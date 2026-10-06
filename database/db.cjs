const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
let sqlite3 = null;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  // Safe fallback: when PostgreSQL is used (e.g. Render production), sqlite3 native driver is not needed
  sqlite3 = null;
}
const Redis = require('ioredis');
const crypto = require('crypto');

// Safely load .env from project root if present
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

const DEFAULT_ARBITRUM_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';
const DEFAULT_USDC_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

let ethers;
try {
  ethers = require('ethers');
} catch {
  ethers = require('../backend/node_modules/ethers');
}

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

let pgPool = null;
let sqliteDb = null;
let redisClient = null;
let isPostgres = false;

// 1. Initialize Database Driver (PostgreSQL or SQLite fallback)
async function initDb() {
  // Optional Redis Cache
  if (REDIS_URL) {
    try {
      redisClient = new Redis(REDIS_URL);
      redisClient.on('connect', () => console.log('⚡ [Redis] Connected to Redis cluster!'));
      redisClient.on('error', (e) => console.warn('⚡ [Redis] Error:', e.message));
    } catch (e) {
      console.warn('⚡ [Redis] Skipped:', e.message);
    }
  }

  // PostgreSQL Connection
  if (DATABASE_URL) {
    try {
      const dbUrl = new URL(DATABASE_URL);
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(dbUrl.hostname);
      pgPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: isLocal ? false : {
          rejectUnauthorized: false
        },
        max: 10,
        idleTimeoutMillis: 30000,
        statement_timeout: 10000
      });
      const client = await pgPool.connect();
      console.log('🐘 [Database] Successfully connected to PostgreSQL production database!');
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schemaSql);
      client.release();
      isPostgres = true;
      return;
    } catch (err) {
      console.error('[PostgreSQL] Connection failed:', err.message);
      pgPool = null;
      if (process.env.NODE_ENV === 'production') throw err;
    }
  }

  // SQLite Engine (Exact same schema & SQL tables)
  if (!sqlite3) {
    throw new Error('SQLite3 native driver is unavailable and no PostgreSQL connection was established.');
  }
  const dbPath = path.join(__dirname, 'trading.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log('🗄️ [Database] Running SQL database engine at:', dbPath);
  console.log('💡 [Tip] Provide DATABASE_URL in .env to connect live PostgreSQL cloud (Neon/Supabase/RDS).');

  await new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS accounts (
          address VARCHAR(42) PRIMARY KEY,
          deposited_usdc NUMERIC(18, 6) DEFAULT 0.0,
          locked_margin NUMERIC(18, 6) DEFAULT 0.0,
          realized_pnl NUMERIC(18, 6) DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS positions (
          id VARCHAR(64) PRIMARY KEY,
          account_address VARCHAR(42) NOT NULL,
          symbol VARCHAR(32) NOT NULL,
          base VARCHAR(16) NOT NULL,
          side VARCHAR(8) NOT NULL,
          leverage INTEGER NOT NULL,
          size_coins NUMERIC(18, 6) NOT NULL,
          entry_price NUMERIC(18, 4) NOT NULL,
          margin NUMERIC(18, 6) NOT NULL,
          liq_price NUMERIC(18, 4) NOT NULL,
          status VARCHAR(16) DEFAULT 'OPEN',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          closed_at DATETIME
        )
      `);
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS trades_history (
          id VARCHAR(64) PRIMARY KEY,
          account_address VARCHAR(42) NOT NULL,
          type VARCHAR(16) NOT NULL,
          instrument VARCHAR(32) NOT NULL,
          side VARCHAR(16) NOT NULL,
          size VARCHAR(32) NOT NULL,
          entry_price VARCHAR(32) NOT NULL,
          exit_price VARCHAR(32) NOT NULL,
          pnl NUMERIC(18, 6) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS active_options (
          id VARCHAR(64) PRIMARY KEY,
          account_address VARCHAR(42) NOT NULL,
          instrument VARCHAR(64) NOT NULL,
          strike VARCHAR(32) NOT NULL,
          spot VARCHAR(32) NOT NULL,
          contracts VARCHAR(32) NOT NULL,
          premium VARCHAR(32) NOT NULL,
          cost_val NUMERIC(18, 6) NOT NULL,
          value VARCHAR(32) NOT NULL,
          expiry VARCHAR(32) DEFAULT 'Today',
          status VARCHAR(16) DEFAULT 'ACTIVE',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS funding_settlements (
          id VARCHAR(64) PRIMARY KEY,
          symbol VARCHAR(32) NOT NULL,
          funding_rate NUMERIC(10, 6) NOT NULL,
          long_oi NUMERIC(18, 6) NOT NULL,
          short_oi NUMERIC(18, 6) NOT NULL,
          total_positions_settled INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}
const ADDR_REGEX = /^0x[0-9a-fA-F]{40}$/;

// Helper: Query wrapper
async function query(sql, params = []) {
  if (isPostgres && pgPool) {
    const res = await pgPool.query(sql, params);
    return res.command === 'SELECT' || (res.rows && res.rows.length > 0) ? res.rows : [{ rowCount: res.rowCount }];
  }

  // SQLite query conversion: accurately map positional $N to SQLite params
  const matches = [...sql.matchAll(/\$(\d+)/g)];
  let sqliteSql = sql;
  let sqliteParams = params;
  if (matches.length > 0) {
    sqliteSql = sql.replace(/\$\d+/g, '?');
    sqliteParams = matches.map(m => params[parseInt(m[1], 10) - 1]);
  }
  return new Promise((resolve, reject) => {
    if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
      sqliteDb.all(sqliteSql, sqliteParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    } else {
      sqliteDb.run(sqliteSql, sqliteParams, function (err) {
        if (err) reject(err);
        else resolve([{ rowCount: this.changes, lastID: this.lastID }]);
      });
    }
  });
}

// -------------------------------------------------------------------
// BUSINESS LOGIC: ACCOUNT & TRADING STATE REPOSITORY
// -------------------------------------------------------------------

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MARKET_PRICES = {
  'BTC-PERP': 85000,
  'ETH-PERP': 2700,
  'SOL-PERP': 120,
  'DOGE-PERP': 0.09,
  'NVDA-PERP': 230,
  'SPY-PERP': 760,
  'TSLA-PERP': 354
};

const MARKET_RISK_LIMITS = {
  'BTC-PERP': { maxOi: 100_000, maxSingleNotional: 10_000, maxLeverage: 100 },
  'ETH-PERP': { maxOi: 60_000,  maxSingleNotional: 6_000,  maxLeverage: 100 },
  'SOL-PERP': { maxOi: 30_000,  maxSingleNotional: 3_000,  maxLeverage: 50 },
  'DOGE-PERP': { maxOi: 20_000, maxSingleNotional: 2_000,  maxLeverage: 50 },
  'NVDA-PERP': { maxOi: 25_000, maxSingleNotional: 2_500,  maxLeverage: 20 },
  'TSLA-PERP': { maxOi: 25_000, maxSingleNotional: 2_500,  maxLeverage: 20 },
  'SPY-PERP':  { maxOi: 50_000, maxSingleNotional: 5_000,  maxLeverage: 20 }
};
const DEFAULT_RISK_LIMIT = { maxOi: 25_000, maxSingleNotional: 2_500, maxLeverage: 20 };

async function withTx(fn) {
  if (isPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txQuery = async (sql, params = []) => {
        const res = await client.query(sql, params);
        if (res.command === 'SELECT') return res.rows;
        return [{ rowCount: res.rowCount }];
      };
      const result = await fn(txQuery);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch {}
      throw e;
    } finally {
      client.release();
    }
  }
  // SQLite serialized transaction
  await new Promise((resolve, reject) => {
    sqliteDb.exec('BEGIN IMMEDIATE', err => err ? reject(err) : resolve());
  });
  try {
    const result = await fn(query);
    await new Promise((resolve, reject) => {
      sqliteDb.exec('COMMIT', err => err ? reject(err) : resolve());
    });
    return result;
  } catch (e) {
    try { await new Promise(r => sqliteDb.exec('ROLLBACK', () => r())); } catch {}
    throw e;
  }
}

async function getOrCreateAccount(rawAddress) {
  const address = (rawAddress || '').toLowerCase().trim();
  if (!ADDR_REGEX.test(address)) {
    throw new AppError(400, 'Invalid wallet address format (expected 0x... 40 hex chars)');
  }

  let rows = await query('SELECT * FROM accounts WHERE address = $1', [address]);
  if (!rows || rows.length === 0) {
    await query(
      'INSERT INTO accounts (address, deposited_usdc, locked_margin, realized_pnl) VALUES ($1, $2, $3, $4)',
      [address, 0.0, 0.0, 0.0]
    );
    rows = await query('SELECT * FROM accounts WHERE address = $1', [address]);
  }
  const acc = rows[0];
  return {
    address: acc.address,
    depositedUsdc: parseFloat(acc.deposited_usdc || 0),
    lockedMargin: parseFloat(acc.locked_margin || 0),
    realizedPnl: parseFloat(acc.realized_pnl || 0)
  };
}

async function readOnChainVaultBalance(address) {
  const rpc = process.env.ARBITRUM_RPC || DEFAULT_ARBITRUM_RPC;
  const vaultAddr = (process.env.TRADING_VAULT_ADDRESS || '').toLowerCase();
  if (!rpc || !vaultAddr || !ethers.isAddress(vaultAddr)) return null;
  try {
    const provider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
    const vault = new ethers.Contract(vaultAddr, ['function userBalances(address) view returns (uint256)'], provider);
    const raw = await vault.userBalances(address);
    return Number(raw) / 1e6;
  } catch (err) {
    console.warn(`[Vault Notice] Arbitrum Sepolia vault read for ${address}:`, err?.message || err);
    return null;
  }
}

async function syncOnchainBalance(rawAddress) {
  const address = validateAddressStrict(rawAddress);
  const acc = await getOrCreateAccount(address);
  try {
    const vaultBal = await readOnChainVaultBalance(address);
    if (typeof vaultBal === 'number' && Number.isFinite(vaultBal)) {
      if (vaultBal > 0 || acc.depositedUsdc === 0) {
        await query('UPDATE accounts SET deposited_usdc = $1, updated_at = CURRENT_TIMESTAMP WHERE address = $2', [
          vaultBal,
          address
        ]);
      }
    }
  } catch (err) {
    // Preserve existing balance on RPC network hiccups/timeouts
    console.warn(`[Sync Notice] On-chain RPC balance read skipped for ${address} (${err.message}). Preserving existing balance.`);
  }
  return await getAccountState(address);
}

function validateAddressStrict(value) {
  if (typeof value !== 'string' || !ethers.isAddress(value)) throw new AppError(400, 'Invalid address');
  return ethers.getAddress(value).toLowerCase();
}

async function readOnChainUsdc(address) {
  const rpc = process.env.ARBITRUM_RPC || DEFAULT_ARBITRUM_RPC;
  const usdcAddr = (process.env.USDC_ADDRESS || DEFAULT_USDC_ADDRESS).toLowerCase();
  if (!rpc || !usdcAddr || !ethers.isAddress(usdcAddr)) {
    throw new AppError(503, 'RPC or USDC contract address is not configured on server');
  }
  try {
    const provider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
    const usdc = new ethers.Contract(usdcAddr, ['function balanceOf(address) view returns (uint256)'], provider);
    const raw = await usdc.balanceOf(address);
    return Number(raw) / 1e6;
  } catch (err) {
    console.warn(`[RPC Notice] Arbitrum Sepolia read failed for ${address}:`, err?.message || err);
    throw new AppError(502, 'Failed to retrieve on-chain balance from network. Existing balance preserved.');
  }
}

function setLiveMarketPrice(symbol, price) {
  if (typeof symbol === 'string' && typeof price === 'number' && Number.isFinite(price) && price > 0) {
    MARKET_PRICES[symbol] = price;
  }
}

function getTrustedMark(symbol) {
  const price = MARKET_PRICES[symbol];
  if (!price || !Number.isFinite(price) || price <= 0) throw new AppError(503, 'Price unavailable');
  return price;
}

async function getAccountState(rawAddress) {
  const address = (rawAddress || '').toLowerCase();
  const acc = await getOrCreateAccount(address);

  const openPositions = await query(
    'SELECT * FROM positions WHERE account_address = $1 AND status = $2 ORDER BY created_at DESC',
    [address, 'OPEN']
  );

  const activeOpts = await query(
    'SELECT * FROM active_options WHERE account_address = $1 AND status = $2 ORDER BY created_at DESC',
    [address, 'ACTIVE']
  );

  const history = await query(
    'SELECT * FROM trades_history WHERE account_address = $1 ORDER BY created_at DESC LIMIT 50',
    [address]
  );

  // Recalculate locked margin
  const lockedMargin = openPositions.reduce((sum, p) => sum + parseFloat(p.margin || 0), 0);
  const lockedOptionCost = activeOpts.reduce((sum, o) => sum + parseFloat(o.cost_val || 0), 0);
  const totalLocked = lockedMargin + lockedOptionCost;

  const availableBalance = Math.max(0, acc.depositedUsdc - totalLocked + acc.realizedPnl);

  return {
    address,
    depositedUsdc: acc.depositedUsdc,
    lockedMargin: totalLocked,
    availableBalance: parseFloat(availableBalance.toFixed(2)),
    realizedPnl: acc.realizedPnl,
    positions: openPositions.map(p => ({
      id: p.id,
      symbol: p.symbol,
      base: p.base,
      side: p.side,
      leverage: p.leverage,
      sizeCoins: parseFloat(p.size_coins),
      entry: parseFloat(p.entry_price),
      margin: parseFloat(p.margin),
      liqPrice: parseFloat(p.liq_price),
      timestamp: new Date(p.created_at).toLocaleTimeString()
    })),
    activeOptions: activeOpts.map(o => ({
      id: o.id,
      instrument: o.instrument,
      strike: o.strike,
      spot: o.spot,
      contracts: o.contracts,
      premium: o.premium,
      costVal: parseFloat(o.cost_val),
      value: o.value,
      expiry: o.expiry
    })),
    tradeHistory: history.map(h => ({
      timestamp: new Date(h.created_at).toLocaleTimeString(),
      type: h.type,
      instrument: h.instrument,
      side: h.side,
      size: h.size,
      entry: h.entry_price,
      exit: h.exit_price,
      pnl: parseFloat(h.pnl)
    })),
    platformVolumes: await getPlatformVolumes()
  };
}

async function getPlatformVolumes() {
  const timeClause = isPostgres
    ? "created_at >= NOW() - INTERVAL '24 hours' OR (closed_at IS NOT NULL AND closed_at >= NOW() - INTERVAL '24 hours')"
    : "created_at >= datetime('now', '-24 hours') OR (closed_at IS NOT NULL AND closed_at >= datetime('now', '-24 hours'))";

  const rows = await query(`
    SELECT 
      symbol,
      COALESCE(SUM(
        CASE 
          WHEN status = 'CLOSED' THEN (margin * leverage) * 2 
          ELSE (margin * leverage) 
        END
      ), 0) AS vol
    FROM positions 
    WHERE ${timeClause}
    GROUP BY symbol
  `);

  const volumes = {
    'BTC-PERP': 0,
    'ETH-PERP': 0,
    'SOL-PERP': 0,
    'DOGE-PERP': 0,
    'NVDA-PERP': 0,
    'SPY-PERP': 0,
    'TSLA-PERP': 0
  };

  for (const r of rows) {
    if (r.symbol) {
      volumes[r.symbol] = parseFloat((Number(r.vol) || 0).toFixed(2));
    }
  }

  return volumes;
}

async function openPosition({ address, symbol, side, leverage, margin }) {
  const normAddr = validateAddressStrict(address);
  if (typeof symbol !== 'string' || symbol.length > 32) throw new AppError(400, 'Invalid symbol');
  if (!MARKET_PRICES[symbol]) throw new AppError(400, 'Unsupported symbol');
  if (!['Long', 'Short'].includes(side)) throw new AppError(400, 'Invalid side');
  const numMargin = Number(margin);
  if (!Number.isFinite(numMargin) || numMargin <= 0 || numMargin > 1_000_000) throw new AppError(400, 'Invalid margin');
  const numLev = Number(leverage);
  if (!Number.isInteger(numLev) || numLev < 1 || numLev > 100) throw new AppError(400, 'Invalid leverage');

  const entryPrice = getTrustedMark(symbol);
  const sizeCoins = numMargin * numLev / entryPrice;
  const liqPrice = side === 'Long' ? entryPrice * (1 - 0.9 / numLev) : entryPrice * (1 + 0.9 / numLev);
  const base = symbol.replace(/-PERP$/, '');

  const notional = numMargin * numLev;
  const riskLimit = MARKET_RISK_LIMITS[symbol] || DEFAULT_RISK_LIMIT;
  if (numLev > riskLimit.maxLeverage) {
    throw new AppError(400, `Max leverage for ${symbol} is ${riskLimit.maxLeverage}x`);
  }
  if (notional > riskLimit.maxSingleNotional) {
    throw new AppError(400, `Position size $${notional.toFixed(2)} exceeds single position limit of $${riskLimit.maxSingleNotional.toLocaleString()} for ${symbol}`);
  }

  // Check Open Interest (OI) Cap for this market
  const oiRows = await query(
    `SELECT COALESCE(SUM(margin * leverage), 0) AS total_oi FROM positions WHERE symbol = $1 AND status = 'OPEN'`,
    [symbol]
  );
  const currentTotalOi = Number(oiRows[0]?.total_oi || 0);
  if (currentTotalOi + notional > riskLimit.maxOi) {
    throw new AppError(400, `Market Open Interest cap reached ($${riskLimit.maxOi.toLocaleString()} max). Current: $${currentTotalOi.toFixed(2)}, Requested: $${notional.toFixed(2)}`);
  }

  const openFee = Number((notional * 0.00055).toFixed(2)); // 0.055% Taker Fee
  const totalRequired = Number((numMargin + openFee).toFixed(2));

  await withTx(async tx => {
    const accRows = await tx('SELECT deposited_usdc, locked_margin, realized_pnl FROM accounts WHERE address = $1', [normAddr]);
    if (!accRows.length) throw new AppError(404, 'Account not found');
    const available = Number(accRows[0].deposited_usdc) + Number(accRows[0].realized_pnl) - Number(accRows[0].locked_margin);
    if (available < totalRequired) {
      throw new AppError(400, `Insufficient free margin (margin $${numMargin.toFixed(2)} + fee $${openFee.toFixed(2)}). Available $${available.toFixed(2)}`);
    }

    const locked = await tx(
      'UPDATE accounts SET realized_pnl = realized_pnl - $1, locked_margin = locked_margin + $2, updated_at = CURRENT_TIMESTAMP WHERE address = $3 AND deposited_usdc + realized_pnl - locked_margin >= $4',
      [openFee, numMargin, normAddr, totalRequired]
    );
    if (!locked[0] || locked[0].rowCount !== 1) throw new AppError(400, 'Insufficient free margin');

    const posId = `pos-${crypto.randomUUID()}`;
    await tx(
      `INSERT INTO positions (id, account_address, symbol, base, side, leverage, size_coins, entry_price, margin, liq_price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'OPEN')`,
      [posId, normAddr, symbol, base, side, numLev, sizeCoins, entryPrice, numMargin, liqPrice]
    );
  });
  return await getAccountState(normAddr);
}

async function closePosition({ address, positionId, percent = 100 }) {
  const normAddr = validateAddressStrict(address);
  if (typeof positionId !== 'string' || !/^pos-[a-f0-9-]{20,80}$/.test(positionId)) throw new AppError(400, 'Invalid positionId');
  const pct = Number(percent);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) throw new AppError(400, 'Invalid close percentage');

  return await withTx(async tx => {
    const rows = await tx('SELECT * FROM positions WHERE id = $1 AND account_address = $2 AND status = $3', [positionId, normAddr, 'OPEN']);
    if (!rows || rows.length === 0) throw new AppError(404, 'Position not found or already closed');
    const pos = rows[0];
    const exitPrice = getTrustedMark(pos.symbol);
    const sizeCoins = Number(pos.size_coins);
    const entryPrice = Number(pos.entry_price);
    const margin = Number(pos.margin);
    const diff = pos.side === 'Long' ? exitPrice - entryPrice : entryPrice - exitPrice;

    const fraction = pct / 100;
    const isFullClose = pct >= 99.9;
    const closedCoins = isFullClose ? sizeCoins : sizeCoins * fraction;
    const closedMargin = isFullClose ? margin : Number((margin * fraction).toFixed(2));
    
    // Fee & Net PnL calculation
    const notionalClosed = closedCoins * exitPrice;
    const closeFee = Number((notionalClosed * 0.00055).toFixed(2)); // 0.055% Taker Fee
    const grossPnl = Number((diff * closedCoins).toFixed(2));
    const netPnl = Number((grossPnl - closeFee).toFixed(2));

    if (isFullClose) {
      const upd = await tx('UPDATE positions SET status = $1, closed_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3', ['CLOSED', positionId, 'OPEN']);
      if (!upd[0] || upd[0].rowCount !== 1) throw new AppError(409, 'Position already closed concurrently');
    } else {
      const remainingCoins = Math.max(0, sizeCoins - closedCoins);
      const remainingMargin = Math.max(0.01, margin - closedMargin);
      const upd = await tx('UPDATE positions SET size_coins = $1, margin = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND status = $4', [remainingCoins, remainingMargin, positionId, 'OPEN']);
      if (!upd[0] || upd[0].rowCount !== 1) throw new AppError(409, 'Position already closed concurrently');
    }

    const tradeId = `tr-${crypto.randomUUID()}`;
    await tx(
      `INSERT INTO trades_history (id, account_address, type, instrument, side, size, entry_price, exit_price, pnl)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [tradeId, normAddr, 'Perpetual', pos.symbol, pos.side, `${closedCoins.toFixed(6)} ${pos.base}`, `$${entryPrice.toFixed(2)}`, `$${exitPrice.toFixed(2)}`, netPnl]
    );

    const clampExpr = isPostgres ? 'GREATEST(0, locked_margin - $2)' : 'MAX(0, locked_margin - $2)';
    await tx(`UPDATE accounts SET realized_pnl = realized_pnl + $1, locked_margin = ${clampExpr}, updated_at = CURRENT_TIMESTAMP WHERE address = $3`, [netPnl, closedMargin, normAddr]);
    return await getAccountState(normAddr);
  });
}

async function buyOption({ address, instrument, contracts }) {
  const normAddr = validateAddressStrict(address);
  if (typeof instrument !== 'string' || instrument.length > 64 || !/^[A-Z0-9_\-./]+$/.test(instrument)) {
    throw new AppError(400, 'Invalid instrument');
  }
  // Server-authoritative premium derived from contracts and a fixed pricing table.
  const numContracts = Number(contracts != null ? contracts : 1);
  if (!Number.isFinite(numContracts) || numContracts <= 0 || numContracts > 1000) throw new AppError(400, 'Invalid contracts');
  const premium = Number((numContracts * 85).toFixed(2));
  const costVal = premium;

  return await withTx(async tx => {
    const accRows = await tx('SELECT deposited_usdc, locked_margin, realized_pnl FROM accounts WHERE address = $1', [normAddr]);
    if (!accRows.length) throw new AppError(404, 'Account not found');
    const available = Number(accRows[0].deposited_usdc) + Number(accRows[0].realized_pnl) - Number(accRows[0].locked_margin);
    if (available < costVal) throw new AppError(400, `Insufficient funds for option. Available $${available.toFixed(2)}`);

    const optId = `opt-${crypto.randomUUID()}`;
    await tx(
      `INSERT INTO active_options (id, account_address, instrument, strike, spot, contracts, premium, cost_val, value, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE')`,
      [optId, normAddr, instrument, '$0', '$0', `${numContracts}`, `$${premium}`, costVal, `$${costVal}`]
    );
    return await getAccountState(normAddr);
  });
}

async function closeOption({ address, optionId }) {
  const normAddr = validateAddressStrict(address);
  if (typeof optionId !== 'string' || !/^opt-[a-f0-9-]{20,80}$/.test(optionId)) throw new AppError(400, 'Invalid optionId');

  return await withTx(async tx => {
    const rows = await tx('SELECT * FROM active_options WHERE id = $1 AND account_address = $2 AND status = $3', [optionId, normAddr, 'ACTIVE']);
    if (!rows || rows.length === 0) throw new AppError(404, 'Option not found or already closed');
    const opt = rows[0];
    // Deterministic server payout policy until a real settlement oracle is wired.
    const payout = Number((Number(opt.cost_val) * 1.2).toFixed(2));
    const pnl = Number((payout - Number(opt.cost_val)).toFixed(2));

    const upd = await tx('UPDATE active_options SET status = $1 WHERE id = $2 AND status = $3', ['SETTLED', optionId, 'ACTIVE']);
    if (!upd[0] || upd[0].rowCount !== 1) throw new AppError(409, 'Option already settled');

    const tradeId = `tr-opt-${crypto.randomUUID()}`;
    await tx(
      `INSERT INTO trades_history (id, account_address, type, instrument, side, size, entry_price, exit_price, pnl)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [tradeId, normAddr, '0DTE Option', opt.instrument, 'Settlement', opt.contracts, opt.premium, `$${payout.toFixed(2)}`, pnl]
    );
    await tx('UPDATE accounts SET realized_pnl = realized_pnl + $1, updated_at = CURRENT_TIMESTAMP WHERE address = $2', [pnl, normAddr]);
    return await getAccountState(normAddr);
  });
}

async function getHourlyPoolParticipants(selectedPair) {
  let sql = 'SELECT * FROM positions WHERE status = $1 ORDER BY created_at DESC';
  let params = ['OPEN'];
  if (selectedPair && selectedPair !== 'all') {
    sql = 'SELECT * FROM positions WHERE status = $1 AND (symbol = $2 OR base = $2) ORDER BY created_at DESC';
    params = ['OPEN', selectedPair];
  }
  const rows = await query(sql, params);
  return rows.map((p, idx) => {
    const margin = parseFloat(p.margin || 0);
    const leverage = parseInt(p.leverage || 1, 10);
    const notional = margin * leverage;
    const contrib = margin * 0.10; // 10% routing to sheriff hourly pool
    return {
      id: p.id,
      address: p.account_address,
      pair: p.symbol,
      base: p.base,
      positionSizeUsdc: notional,
      poolContributionUsdc: contrib,
      poolSharePct: 0, // calculated dynamically against total pot
      estPayoutUsdc: contrib * 2.5,
      timestamp: new Date(p.created_at).toLocaleTimeString(),
      status: 'Active',
      side: p.side,
      leverage: leverage
    };
  });
}

async function depositVaultCollateral({ address, amount }) {
  const normAddr = validateAddressStrict(address);
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) throw new AppError(400, 'Invalid deposit amount');

  return await withTx(async tx => {
    await tx(
      'UPDATE accounts SET deposited_usdc = deposited_usdc + $1, updated_at = CURRENT_TIMESTAMP WHERE address = $2',
      [numAmount, normAddr]
    );
    const tradeId = `tr-dep-${crypto.randomUUID()}`;
    await tx(
      `INSERT INTO trades_history (id, account_address, type, instrument, side, size, entry_price, exit_price, pnl)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [tradeId, normAddr, 'VAULT', 'TradingVault', 'Deposit', `$${numAmount.toFixed(2)}`, '-', '-', 0]
    );
    return await getAccountState(normAddr);
  });
}

async function recordWithdraw({ address, amount, fee = 0, txHash = null }) {
  const normAddr = validateAddressStrict(address);
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) throw new AppError(400, 'Invalid withdraw amount');

  return await withTx(async tx => {
    const acc = await getOrCreateAccount(normAddr);
    let remaining = numAmount;
    let newPnl = acc.realizedPnl;
    let newDeposit = acc.depositedUsdc;

    if (newPnl > 0) {
      const pnlDeduction = Math.min(newPnl, remaining);
      newPnl -= pnlDeduction;
      remaining -= pnlDeduction;
    }

    if (remaining > 0) {
      newDeposit = Math.max(0, newDeposit - remaining);
    }

    await tx(
      'UPDATE accounts SET deposited_usdc = $1, realized_pnl = $2, updated_at = CURRENT_TIMESTAMP WHERE address = $3',
      [newDeposit, newPnl, normAddr]
    );

    const tradeId = `tr-wd-${crypto.randomUUID()}`;
    await tx(
      `INSERT INTO trades_history (id, account_address, type, instrument, side, size, entry_price, exit_price, pnl)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [tradeId, normAddr, 'VAULT', 'TradingVault', 'Withdraw', `$${numAmount.toFixed(2)}`, '-', '-', 0]
    );

    return await getAccountState(normAddr);
  });
}

async function getMarketFundingData(symbol) {
  const normSymbol = (symbol || 'BTC-PERP').toUpperCase();
  const riskLimit = MARKET_RISK_LIMITS[normSymbol] || DEFAULT_RISK_LIMIT;

  const oiRows = await query(
    `SELECT side, COALESCE(SUM(margin * leverage), 0) AS notional FROM positions WHERE symbol = $1 AND status = 'OPEN' GROUP BY side`,
    [normSymbol]
  );
  let longOi = 0;
  let shortOi = 0;
  for (const r of oiRows) {
    if (r.side === 'Long') longOi = Number(r.notional);
    if (r.side === 'Short') shortOi = Number(r.notional);
  }
  const totalOi = longOi + shortOi;

  // Imbalance calculation: clamp((Long - Short) / max(Total, 2000) * 0.0004, -0.0004, 0.0004) + baseline 0.0001 (0.01% / 8h)
  const imbalanceRatio = totalOi > 0 ? (longOi - shortOi) / Math.max(totalOi, 2000) : 0;
  let fundingRate = 0.0001 + (imbalanceRatio * 0.0004); // baseline 0.01%
  fundingRate = Math.max(-0.0005, Math.min(0.0005, fundingRate)); // clamped between -0.05% and +0.05%

  const now = Date.now();
  const nextFundingTime = Math.ceil(now / 3600000) * 3600000;
  const secondsLeft = Math.max(0, Math.floor((nextFundingTime - now) / 1000));

  return {
    symbol: normSymbol,
    longOi: Number(longOi.toFixed(2)),
    shortOi: Number(shortOi.toFixed(2)),
    totalOi: Number(totalOi.toFixed(2)),
    maxOi: riskLimit.maxOi,
    maxSingleNotional: riskLimit.maxSingleNotional,
    fundingRate: Number(fundingRate.toFixed(6)),
    fundingRatePercent: (fundingRate * 100).toFixed(4) + '%',
    nextFundingTime,
    secondsLeft
  };
}

async function settleFundingRates() {
  const symbols = Object.keys(MARKET_PRICES);
  const results = [];

  for (const symbol of symbols) {
    try {
      const data = await getMarketFundingData(symbol);
      const rate = data.fundingRate;

      // Fetch all open positions for this symbol
      const openPositions = await query(
        `SELECT id, account_address, side, margin, leverage FROM positions WHERE symbol = $1 AND status = 'OPEN'`,
        [symbol]
      );

      if (openPositions.length === 0) continue;

      let settledCount = 0;
      await withTx(async tx => {
        for (const pos of openPositions) {
          const notional = Number(pos.margin) * Number(pos.leverage);
          const payment = Number((notional * Math.abs(rate)).toFixed(4));
          if (payment <= 0) continue;

          let deltaPnl = 0;
          if (rate > 0) {
            // Positive funding: Longs pay, Shorts receive
            deltaPnl = pos.side === 'Long' ? -payment : payment;
          } else if (rate < 0) {
            // Negative funding: Shorts pay, Longs receive
            deltaPnl = pos.side === 'Short' ? -payment : payment;
          }

          if (deltaPnl !== 0) {
            await tx(
              'UPDATE accounts SET realized_pnl = realized_pnl + $1, updated_at = CURRENT_TIMESTAMP WHERE address = $2',
              [deltaPnl, pos.account_address]
            );
            settledCount++;
          }
        }

        const settlementId = `fund-${crypto.randomUUID()}`;
        await tx(
          `INSERT INTO funding_settlements (id, symbol, funding_rate, long_oi, short_oi, total_positions_settled)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [settlementId, symbol, rate, data.longOi, data.shortOi, settledCount]
        );
      });

      console.log(`⏱️ [Funding Settle] ${symbol}: Rate ${(rate * 100).toFixed(4)}%, Settled ${settledCount} positions.`);
      results.push({ symbol, rate, settledCount });
    } catch (e) {
      console.error(`[Funding Settle Error] ${symbol}:`, e.message);
    }
  }

  return results;
}

module.exports = {
  initDb,
  query,
  getAccountState,
  syncOnchainBalance,
  openPosition,
  closePosition,
  buyOption,
  closeOption,
  depositVaultCollateral,
  recordWithdraw,
  getHourlyPoolParticipants,
  setLiveMarketPrice,
  getTrustedMark,
  getPlatformVolumes,
  getMarketFundingData,
  settleFundingRates,
  MARKET_RISK_LIMITS
};

