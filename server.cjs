const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Safely load .env from project root if present
try {
  const envPath = path.join(__dirname, '.env');
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

let ethers;
try {
  ethers = require('ethers');
} catch {
  // Local monorepo fallback; production must install ethers as a root dependency.
  ethers = require('./backend/node_modules/ethers');
}

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const BIND_HOST = process.env.BIND_HOST || '0.0.0.0';
const BASE_ORIGIN = 'http://localhost:3000';
const PUBLIC_DIR = path.resolve(__dirname, 'dist');
const SESSION_TTL_MS = 60 * 60 * 1000;
const NONCE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || `${BASE_ORIGIN},http://localhost:5173`)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const SESSIONS_FILE = path.join(__dirname, 'database', 'sessions.json');
const nonces = new Map();
const sessions = new Map();
const requestBuckets = new Map();

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      const now = Date.now();
      for (const [k, v] of Object.entries(data)) {
        if (v && v.expiresAt > now) {
          sessions.set(k, v);
        }
      }
    }
  } catch {}
}
loadSessions();

function saveSessions() {
  try {
    const obj = {};
    const now = Date.now();
    for (const [k, v] of sessions.entries()) {
      if (v && v.expiresAt > now) obj[k] = v;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const db = require('./database/db.cjs');

// Initialize Database on startup
db.initDb().catch(err => console.error('[Database init error]:', err?.message || err));

// Global process error handlers to prevent crash (H-1)
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Promise Rejection]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

// Input validation helpers (H-3)
const ADDR_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ALLOWED_PERP_SYMBOLS = new Set([
  'BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'DOGE-PERP',
  'BNB-PERP', 'ZEC-PERP', 'LIT-PERP', 'ARB-PERP',
  'NEAR-PERP', 'UNI-PERP', 'GMX-PERP', 'XRP-PERP',
  'NVDA-PERP', 'SPY-PERP', 'TSLA-PERP'
]);
const VALID_TICKERS = new Set(['NVDA', 'SPY', 'TSLA']);
const VALID_CURRENCIES = new Set(['BTC', 'ETH']);

function isValidAddress(addr) {
  return typeof addr === 'string' && ADDR_REGEX.test(addr.trim());
}

function isValidNumber(num, { min = 0, max = Infinity, allowZero = false } = {}) {
  if (typeof num !== 'number' || !Number.isFinite(num)) return false;
  if (allowZero) return num >= min && num <= max;
  return num > min && num <= max;
}

// Memory quote cache for Yahoo Finance (M-5)
const quoteCache = new Map();

// Real-time crypto price feeds (Coinbase API + Kraken fallback)
const CRYPTO_FEEDS = {
  'BTC-PERP': { coinbase: 'BTC-USD', kraken: 'XXBTZUSD' },
  'ETH-PERP': { coinbase: 'ETH-USD', kraken: 'XETHZUSD' },
  'SOL-PERP': { coinbase: 'SOL-USD', kraken: 'SOLUSD' },
  'DOGE-PERP': { coinbase: 'DOGE-USD', kraken: 'XDGUSD' },
  'BNB-PERP': { coinbase: 'BNB-USD', kraken: 'BNBUSD' },
  'ZEC-PERP': { coinbase: 'ZEC-USD', kraken: 'XZECZUSD' },
  'LIT-PERP': { coinbase: 'LIT-USD', kraken: 'LITUSD' },
  'ARB-PERP': { coinbase: 'ARB-USD', kraken: 'ARBUSD' },
  'NEAR-PERP': { coinbase: 'NEAR-USD', kraken: 'NEARUSD' },
  'UNI-PERP': { coinbase: 'UNI-USD', kraken: 'UNIUSD' },
  'GMX-PERP': { coinbase: 'GMX-USD', kraken: 'GMXUSD' },
  'XRP-PERP': { coinbase: 'XRP-USD', kraken: 'XXRPZUSD' }
};

async function fetchCryptoPrice(symbol) {
  const feed = CRYPTO_FEEDS[symbol];
  if (!feed) return null;
  try {
    const r = await fetch(`https://api.coinbase.com/v2/prices/${feed.coinbase}/spot`, {
      signal: AbortSignal.timeout(3000)
    });
    const d = await r.json();
    const price = parseFloat(d?.data?.amount);
    if (price && Number.isFinite(price) && price > 0) {
      db.setLiveMarketPrice(symbol, price);
      return price;
    }
  } catch {}

  try {
    const rk = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${feed.kraken}`, {
      signal: AbortSignal.timeout(3000)
    });
    const dk = await rk.json();
    const tick = dk?.result?.[feed.kraken] || Object.values(dk?.result || {})[0];
    const price = parseFloat(tick?.c?.[0]);
    if (price && Number.isFinite(price) && price > 0) {
      db.setLiveMarketPrice(symbol, price);
      return price;
    }
  } catch {}
  return null;
}

async function syncAllCryptoPrices() {
  await Promise.all(Object.keys(CRYPTO_FEEDS).map(fetchCryptoPrice));
}

// Initial sync on server start & recurring update every 3 seconds
syncAllCryptoPrices().catch(() => {});
setInterval(syncAllCryptoPrices, 3000).unref();

// Periodic cleanup of expired nonces, sessions, request buckets to prevent OOM (M-R4)
const MAX_MAP_ENTRIES = 10000;
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of nonces.entries()) {
    if (!item || item.expiresAt <= now) nonces.delete(key);
  }
  for (const [key, item] of sessions.entries()) {
    if (!item || item.expiresAt <= now) sessions.delete(key);
  }
  for (const [key, item] of requestBuckets.entries()) {
    if (!item || item.resetAt <= now) requestBuckets.delete(key);
  }
  for (const [key, item] of quoteCache.entries()) {
    if (!item || (now - item.ts) > 30000) quoteCache.delete(key);
  }
  if (nonces.size > MAX_MAP_ENTRIES) nonces.clear();
  if (sessions.size > MAX_MAP_ENTRIES) sessions.clear();
  if (requestBuckets.size > MAX_MAP_ENTRIES) requestBuckets.clear();
}, 60 * 1000).unref();

// Safe URL parsing against fixed base to prevent Host header crash (H-1)
function getSafeUrl(req) {
  try {
    return new URL(req.url, BASE_ORIGIN);
  } catch {
    return new URL('/', BASE_ORIGIN);
  }
}

// Request body parser with 32KB payload limit to prevent DoS (M-2)
function parseJsonBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        reject(new Error('Payload too large (max 32KB)'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf8');
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Vary': 'Origin'
  };
}

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://s3.tradingview.com https://*.tradingview.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://*.tradingview.com; img-src 'self' data: https:; connect-src 'self' https://*.arbitrum.io wss://ws-feed.exchange.coinbase.com https://query1.finance.yahoo.com https://www.deribit.com https://hermes.pyth.network https://*.tradingview.com wss://*.tradingview.com; frame-ancestors 'none'; base-uri 'none'; object-src 'none'"
  };
}

function sendJson(res, data, statusCode = 200, req = null, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...securityHeaders(),
    ...(req ? corsHeaders(req) : {}),
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter(([key]) => key));
}

function getSession(req) {
  const sid = parseCookies(req.headers.cookie || '').sid;
  const session = sid ? sessions.get(sid) : null;
  if (!session || session.expiresAt <= Date.now()) {
    if (sid) sessions.delete(sid);
    return null;
  }
  return session;
}

function requireAuth(req) {
  const session = getSession(req);
  if (!session) throw new HttpError(401, 'Unauthorized');
  return session.address;
}

function requireAdmin(req) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') throw new HttpError(403, 'Forbidden');
  return session.address;
}

const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES || '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)
);

function getClientIp(req) {
  const directIp = req.socket.remoteAddress || 'unknown';
  // M-R2 fix: Only trust forwarded proxy headers if the direct socket peer is a verified trusted proxy (loopback / Nginx)
  if (TRUSTED_PROXIES.has(directIp) || TRUSTED_PROXIES.has(directIp.replace(/^::ffff:/, ''))) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      const ips = forwarded.split(',').map(s => s.trim()).filter(Boolean);
      if (ips.length > 0 && ips[0]) return ips[0];
    }
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') return cfIp.trim();
  }
  return directIp;
}

function checkRateLimit(req, limit = 120, windowMs = 60_000, prefix = 'general') {
  const ip = getClientIp(req);
  const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
  const effectiveLimit = isLoopback ? Math.max(limit, 1000) : limit;
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const existing = requestBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > effectiveLimit) throw new HttpError(429, 'Too many requests');
}

function validateAddress(value) {
  if (typeof value !== 'string' || !ethers.isAddress(value)) {
    throw new HttpError(400, 'Invalid wallet address');
  }
  return ethers.getAddress(value).toLowerCase();
}

// Secure static path resolution: strictly confines to PUBLIC_DIR (C-1)
function resolveStatic(rawPath) {
  let p;
  try {
    p = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  // Reject null bytes and path segments starting with dot (e.g. .. or .env)
  if (p.includes('\0')) return null;
  const rel = (p === '/' || p === '') ? 'index.html' : p.replace(/^[/\\]+/, '');
  if (rel.split(/[\\/]/).some(seg => seg.startsWith('.'))) return null;

  const full = path.resolve(PUBLIC_DIR, rel);
  // Strictly ensure path remains within PUBLIC_DIR
  if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + path.sep)) {
    return null;
  }
  return full;
}

// Main HTTP request router
async function handleRequest(req, res) {
  const parsedUrl = getSafeUrl(req);
  const reqPath = parsedUrl.pathname;

  // Handle CORS preflight only for explicit allowed origins.
  if (req.method === 'OPTIONS') {
    const headers = corsHeaders(req);
    if (!headers['Access-Control-Allow-Origin']) {
      res.writeHead(403, securityHeaders());
      res.end();
      return;
    }
    res.writeHead(204, { ...securityHeaders(), ...headers });
    res.end();
    return;
  }

  if (reqPath.startsWith('/api/')) {
    const isAuthRoute = reqPath.startsWith('/api/auth/');
    checkRateLimit(req, isAuthRoute ? 60 : 300, 60_000, isAuthRoute ? 'auth' : 'api');
  }

  // Wallet-authentication flow. The nonce is single-use and has a short TTL.
  if (reqPath === '/api/auth/nonce' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const address = validateAddress(body.address);
    const nonce = crypto.randomBytes(32).toString('hex');
    const message = `TradingPnL login\nAddress: ${address}\nNonce: ${nonce}`;
    nonces.set(address, { message, expiresAt: Date.now() + NONCE_TTL_MS });
    sendJson(res, { message, expiresInSeconds: NONCE_TTL_MS / 1000 }, 200, req);
    return;
  }

  if (reqPath === '/api/auth/login' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const address = validateAddress(body.address);
    if (typeof body.signature !== 'string' || body.signature.length > 1024) {
      throw new HttpError(400, 'Invalid signature');
    }
    const challenge = nonces.get(address);
    nonces.delete(address);
    if (!challenge || challenge.expiresAt <= Date.now()) {
      throw new HttpError(401, 'Login challenge expired');
    }
    let recovered;
    try {
      recovered = ethers.verifyMessage(challenge.message, body.signature).toLowerCase();
    } catch {
      throw new HttpError(401, 'Invalid signature');
    }
    if (recovered !== address) throw new HttpError(401, 'Invalid signature');

    const sid = crypto.randomBytes(32).toString('hex');
    sessions.set(sid, { address, role: 'user', expiresAt: Date.now() + SESSION_TTL_MS });
    saveSessions();
    const isHttps = req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
    const cookieFlag = isHttps ? '; Secure' : '';
    sendJson(res, { address }, 200, req, {
      'Set-Cookie': `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${cookieFlag}`
    });
    return;
  }

  if (reqPath === '/api/auth/logout' && req.method === 'POST') {
    const sid = parseCookies(req.headers.cookie || '').sid;
    if (sid) {
      sessions.delete(sid);
      saveSessions();
    }
    sendJson(res, { success: true }, 200, req, {
      'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
    });
    return;
  }

  // API: Get Account State. Identity comes only from the authenticated session.
  if (reqPath === '/api/account' && req.method === 'GET') {
    const address = requireAuth(req);
    try {
      const state = await db.getAccountState(address);
      sendJson(res, state, 200, req);
    } catch (err) {
      console.error('[API /api/account error]:', err?.code || err?.message || err);
      sendJson(res, { error: 'Failed to retrieve account state' }, 500, req);
    }
    return;
  }

  // API: Sync On-chain Balance. The server reads the chain; the client cannot supply a balance.
  if (reqPath === '/api/sync-balance' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const state = await db.syncOnchainBalance(address);
      sendJson(res, state, 200, req);
    } catch (err) {
      console.error('[API /api/sync-balance error]:', err?.code || err?.message || err);
      sendJson(res, { error: 'Unable to sync balance' }, 500, req);
    }
    return;
  }

  // API: Open Perpetual Order. Server derives prices and account identity.
  if (reqPath === '/api/orders/open' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      let symbol = String(body.symbol || '').toUpperCase().trim();
      const SYMBOL_MAP = {
        'BITCOIN': 'BTC-PERP',
        'BTC': 'BTC-PERP',
        'ETHEREUM': 'ETH-PERP',
        'ETH': 'ETH-PERP',
        'SOLANA': 'SOL-PERP',
        'SOL': 'SOL-PERP',
        'DOGECOIN': 'DOGE-PERP',
        'DOGE': 'DOGE-PERP',
        'BNB': 'BNB-PERP',
        'BINANCE': 'BNB-PERP',
        'ZEC': 'ZEC-PERP',
        'ZCASH': 'ZEC-PERP',
        'LIT': 'LIT-PERP',
        'LITENTRY': 'LIT-PERP',
        'ARB': 'ARB-PERP',
        'ARBITRUM': 'ARB-PERP',
        'NEAR': 'NEAR-PERP',
        'UNI': 'UNI-PERP',
        'UNISWAP': 'UNI-PERP',
        'GMX': 'GMX-PERP',
        'XRP': 'XRP-PERP',
        'RIPPLE': 'XRP-PERP',
        'NVDA': 'NVDA-PERP',
        'SPY': 'SPY-PERP',
        'TSLA': 'TSLA-PERP'
      };
      if (SYMBOL_MAP[symbol]) symbol = SYMBOL_MAP[symbol];
      if (!ALLOWED_PERP_SYMBOLS.has(symbol)) {
        throw new HttpError(400, 'Unsupported symbol');
      }
      if (!['Long', 'Short'].includes(body.side)) throw new HttpError(400, 'Invalid side');
      if (!Number.isInteger(body.leverage) || body.leverage < 1 || body.leverage > 100) {
        throw new HttpError(400, 'Leverage must be between 1 and 100');
      }
      if (!isValidNumber(body.margin, { min: 0, max: 1_000_000 })) {
        throw new HttpError(400, 'Invalid margin');
      }
      if (CRYPTO_FEEDS[symbol]) {
        await fetchCryptoPrice(symbol);
      }
      const state = await db.openPosition({
        address,
        symbol,
        side: body.side,
        leverage: body.leverage,
        margin: body.margin
      });
      sendJson(res, state, 200, req);
    } catch (err) {
      console.error('[API /api/orders/open error]:', err?.code || err?.message || err);
      const status = Number.isInteger(err?.status) ? err.status : 500;
      sendJson(res, { error: err?.message || 'Unable to open order' }, status, req);
    }
    return;
  }

  // API: Close Perpetual Position. The server obtains the mark price.
  if (reqPath === '/api/orders/close' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      if (typeof body.positionId !== 'string' || !/^pos-[a-f0-9-]{20,80}$/.test(body.positionId)) {
        throw new HttpError(400, 'Invalid positionId');
      }
      const rawPct = body.percent !== undefined ? Number(body.percent) : 100;
      if (!Number.isFinite(rawPct) || rawPct <= 0 || rawPct > 100) {
        throw new HttpError(400, 'Invalid percent');
      }
      const state = await db.closePosition({ address, positionId: body.positionId, percent: rawPct });
      sendJson(res, state, 200, req);
    } catch (err) {
      console.error('[API /api/orders/close error]:', err?.code || err?.message || err);
      const status = Number.isInteger(err?.status) ? err.status : 500;
      sendJson(res, { error: err?.message || 'Unable to close order' }, status, req);
    }
    return;
  }

  // API: Buy 0DTE Option. Only bounded, server-owned fields are accepted.
  if (reqPath === '/api/options/buy' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      if (typeof body.instrument !== 'string' || body.instrument.length > 64 ||
          !/^[A-Z0-9_\-./]+$/.test(body.instrument)) {
        throw new HttpError(400, 'Invalid instrument');
      }
      if (!isValidNumber(body.costVal, { min: 0, max: 1_000_000 })) {
        throw new HttpError(400, 'Invalid option premium');
      }
      const state = await db.buyOption({
        address,
        instrument: body.instrument,
        contracts: body.contracts
      });
      sendJson(res, state, 200, req);
    } catch (err) {
      console.error('[API /api/options/buy error]:', err?.code || err?.message || err);
      sendJson(res, { error: err instanceof HttpError ? err.message : 'Unable to buy option' }, err instanceof HttpError ? err.status : 500, req);
    }
    return;
  }

  // API: Close Option. Payout is calculated from trusted market data by the server.
  if (reqPath === '/api/options/close' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      if (typeof body.optionId !== 'string' || !/^opt-[a-f0-9-]{20,80}$/.test(body.optionId)) {
        throw new HttpError(400, 'Invalid optionId');
      }
      const state = await db.closeOption({ address, optionId: body.optionId });
      sendJson(res, state, 200, req);
    } catch (err) {
      console.error('[API /api/options/close error]:', err?.code || err?.message || err);
      sendJson(res, { error: err instanceof HttpError ? err.message : 'Unable to close option' }, err instanceof HttpError ? err.status : 500, req);
    }
    return;
  }

  // API: Get Hourly Pool Live Data & Participants from DB
  if (reqPath === '/api/hourly-pool' && req.method === 'GET') {
    const rawPair = parsedUrl.searchParams.get('pair') || 'all';
    const pair = String(rawPair).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    try {
      const participants = await db.getHourlyPoolParticipants(pair);
      const allParticipants = await db.getHourlyPoolParticipants('all');
      // Epoch resets to 0 (pending) if minimum conditions are not met (0 participants / pot empty)
      // When at least 1 participant contributes routing, the epoch activates starting at Epoch #1
      const isPoolActive = allParticipants.length > 0;
      const epoch = isPoolActive ? 1 : 0;
      sendJson(res, {
        success: true,
        pair,
        epoch,
        active: isPoolActive,
        participants,
        count: participants.length
      });
    } catch (err) {
      console.error('[API /api/hourly-pool error]:', err?.message);
      sendJson(res, { error: 'Failed to retrieve pool data', participants: [], epoch: 0, active: false }, 500);
    }
    return;
  }

  // API: Get 24h Platform Trading Volumes for all markets
  if (reqPath === '/api/markets/volume' && req.method === 'GET') {
    try {
      const volumes = await db.getPlatformVolumes();
      sendJson(res, volumes, 200, req);
    } catch (err) {
      console.error('[API /api/markets/volume error]:', err?.message);
      sendJson(res, {}, 500, req);
    }
    return;
  }

  // API: Get Live Market Prices for all symbols
  if (reqPath === '/api/markets/live-prices' && req.method === 'GET') {
    try {
      const prices = db.getLiveMarketPrices();
      sendJson(res, { prices }, 200, req);
    } catch (err) {
      console.error('[API /api/markets/live-prices error]:', err?.message);
      sendJson(res, { prices: {} }, 500, req);
    }
    return;
  }

  // API: Get Market Funding Rate & Open Interest Metrics
  if (reqPath === '/api/markets/funding' && req.method === 'GET') {
    try {
      const symbol = parsedUrl.searchParams.get('symbol') || 'BTC-PERP';
      const fundingData = await db.getMarketFundingData(symbol);
      sendJson(res, fundingData, 200, req);
    } catch (err) {
      console.error('[API /api/markets/funding error]:', err?.message);
      sendJson(res, { error: 'Failed to retrieve funding metrics' }, 500, req);
    }
    return;
  }

  // API: Get Trading Vault Status & Available Liquidity
  if (reqPath === '/api/vault/info' && req.method === 'GET') {
    try {
      const vaultAddress = process.env.TRADING_VAULT_ADDRESS || '0x4Fa9293827922f4688d7365a9E92B3468c02CcC7';
      const rpc = process.env.ARBITRUM_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
      const usdcAddress = process.env.USDC_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

      const provider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      const usdcContract = new ethers.Contract(usdcAddress, ['function balanceOf(address) view returns (uint256)'], provider);
      const vaultBalUnits = await usdcContract.balanceOf(vaultAddress);
      const vaultLiquidity = Number(vaultBalUnits) / 1e6;

      sendJson(res, {
        vaultAddress,
        usdcAddress,
        vaultLiquidity: parseFloat(vaultLiquidity.toFixed(2))
      }, 200, req);
    } catch (err) {
      console.error('[API /api/vault/info error]:', err?.message);
      sendJson(res, { error: 'Unable to query vault info' }, 500, req);
    }
    return;
  }

  // API: Request Signed Withdrawal Voucher from Trading Vault
  if (reqPath === '/api/vault/withdraw-voucher' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(400, 'Invalid withdrawal amount');
      }

      const state = await db.getAccountState(address);
      if (amount > state.availableBalance) {
        throw new HttpError(400, `Amount exceeds available trading balance ($${state.availableBalance.toFixed(2)})`);
      }

      const keeperKey = process.env.KEEPER_PRIVATE_KEY;
      if (!keeperKey) {
        throw new HttpError(500, 'Vault keeper key not configured on server');
      }

      const vaultAddress = process.env.TRADING_VAULT_ADDRESS || '0x4Fa9293827922f4688d7365a9E92B3468c02CcC7';
      const rpc = process.env.ARBITRUM_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
      const usdcAddress = process.env.USDC_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

      // Read current on-chain nonce for trader & verify vault liquidity
      const provider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      const vaultContract = new ethers.Contract(vaultAddress, ['function nonces(address) view returns (uint256)'], provider);
      const usdcContract = new ethers.Contract(usdcAddress, ['function balanceOf(address) view returns (uint256)'], provider);

      const [nonce, vaultBalUnits] = await Promise.all([
        vaultContract.nonces(address),
        usdcContract.balanceOf(vaultAddress)
      ]);

      const vaultLiquidity = Number(vaultBalUnits) / 1e6;
      const amountUnits = BigInt(Math.floor(amount * 1e6));

      if (amountUnits > vaultBalUnits) {
        throw new HttpError(400, `В смарт-контракте TradingVault сейчас доступно $${vaultLiquidity.toFixed(2)} USDC ликвидности. Вы можете вывести до $${vaultLiquidity.toFixed(2)} USDC сейчас (остаток профита $${(amount - vaultLiquidity).toFixed(2)} USDC станет доступен при пополнении ликвидности).`);
      }

      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity
      const fee = 0;
      const feeUnits = 0n;

      const innerHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [vaultAddress, address, amountUnits, feeUnits, nonce, expiry]
        )
      );

      const wallet = new ethers.Wallet(keeperKey);
      const rawSig = await wallet.signMessage(ethers.getBytes(innerHash));
      const sig = ethers.Signature.from(rawSig);

      sendJson(res, {
        success: true,
        voucher: {
          amount,
          fee,
          nonce: Number(nonce),
          expiry,
          v: sig.v,
          r: sig.r,
          s: sig.s
        }
      }, 200, req);
    } catch (err) {
      console.error('[API /api/vault/withdraw-voucher error]:', err?.code || err?.message || err);
      const status = Number.isInteger(err?.status) ? err.status : 500;
      sendJson(res, { error: err?.message || 'Unable to generate withdrawal voucher' }, status, req);
    }
    return;
  }

  // API: Confirm On-Chain Vault Withdrawal & Update Balances
  if (reqPath === '/api/vault/confirm-withdraw' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(400, 'Invalid withdrawal amount');
      }
      const updatedState = await db.recordWithdraw({
        address,
        amount,
        fee: 0,
        txHash: body.txHash || null
      });
      sendJson(res, updatedState, 200, req);
    } catch (err) {
      console.error('[API /api/vault/confirm-withdraw error]:', err?.code || err?.message || err);
      const status = Number.isInteger(err?.status) ? err.status : 500;
      sendJson(res, { error: err?.message || 'Unable to confirm withdrawal' }, status, req);
    }
    return;
  }

  // API: Confirm Vault Deposit
  if (reqPath === '/api/vault/deposit' && req.method === 'POST') {
    const address = requireAuth(req);
    try {
      const body = await parseJsonBody(req);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(400, 'Invalid deposit amount');
      }
      const updatedState = await db.depositVaultCollateral({
        address,
        amount
      });
      sendJson(res, updatedState, 200, req);
    } catch (err) {
      console.error('[API /api/vault/deposit error]:', err?.code || err?.message || err);
      const status = Number.isInteger(err?.status) ? err.status : 500;
      sendJson(res, { error: err?.message || 'Unable to process deposit' }, status, req);
    }
    return;
  }

  // API: Real Live Stock Quotes (NVDA, SPY, TSLA) with caching & timeout (M-5)
  if (reqPath === '/api/stock-quote') {
    let rawTicker = (parsedUrl.searchParams.get('ticker') || 'NVDA').toUpperCase().replace('-PERP', '').replace('PERP', '').trim();
    if (!VALID_TICKERS.has(rawTicker)) {
      sendJson(res, { error: 'Unsupported stock ticker. Allowed: NVDA, SPY, TSLA' }, 400);
      return;
    }

    // Check 5-second cache
    const cached = quoteCache.get(rawTicker);
    if (cached && (Date.now() - cached.ts) < 5000) {
      sendJson(res, cached.data);
      return;
    }

    const fallbacks = {
      'NVDA': { ticker: 'NVDA', price: 230.86, prev: 228.38, high: 232.28, low: 228.16, volume: 97235000, chgPct: 1.09 },
      'SPY': { ticker: 'SPY', price: 763.99, prev: 762.63, high: 765.65, low: 758.79, volume: 46190000, chgPct: 0.18 },
      'TSLA': { ticker: 'TSLA', price: 354.11, prev: 354.81, high: 359.79, low: 353.80, volume: 30180000, chgPct: -0.20 }
    };

    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(rawTicker)}`, {
        signal: AbortSignal.timeout(5000)
      });
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error('No metadata');

      const price = meta.regularMarketPrice || meta.chartPreviousClose;
      const prev = meta.chartPreviousClose || price;
      const high = meta.regularMarketDayHigh || price * 1.01;
      const low = meta.regularMarketDayLow || price * 0.99;
      const vol = meta.regularMarketVolume || 50000000;
      const chgPct = prev ? ((price - prev) / prev) * 100 : 0;

      const result = { ticker: rawTicker, price, prev, high, low, volume: vol, chgPct };
      quoteCache.set(rawTicker, { data: result, ts: Date.now() });
      db.setLiveMarketPrice(`${rawTicker}-PERP`, price);
      sendJson(res, result);
    } catch {
      const fb = fallbacks[rawTicker] || fallbacks['NVDA'];
      sendJson(res, fb);
    }
    return;
  }

  // API: Real Options Data from Deribit (BTC, ETH) with timeout
  if (reqPath === '/api/options-data') {
    let rawCurrency = (parsedUrl.searchParams.get('currency') || 'BTC').toUpperCase().trim();
    if (!VALID_CURRENCIES.has(rawCurrency)) rawCurrency = 'BTC';

    try {
      const r = await fetch(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${rawCurrency}&kind=option`, {
        signal: AbortSignal.timeout(6000)
      });
      const d = await r.json();
      if (!d.result || !Array.isArray(d.result)) throw new Error('Invalid Deribit response');

      const sample = d.result.find(item => item.underlying_price);
      const underlyingPrice = sample ? sample.underlying_price : (rawCurrency === 'BTC' ? 84600 : 2700);
      db.setLiveMarketPrice(`${rawCurrency}-PERP`, underlyingPrice);

      const validOptions = d.result.filter(item => {
        if (!item.instrument_name) return false;
        const parts = item.instrument_name.split('-');
        if (parts.length < 4) return false;
        const strike = parseFloat(parts[2]);
        const diffPct = Math.abs(strike - underlyingPrice) / underlyingPrice;
        return diffPct <= 0.08;
      });

      const formatted = validOptions.slice(0, 30).map(item => {
        const parts = item.instrument_name.split('-');
        const expiryStr = parts[1];
        const strike = parseFloat(parts[2]);
        const type = parts[3] === 'C' ? 'CALL' : 'PUT';
        const btcPrice = underlyingPrice;
        const markPrice = item.mark_price || 0.005;
        const bidUsd = item.bid_price ? (item.bid_price * btcPrice).toFixed(2) : (markPrice * btcPrice * 0.98).toFixed(2);
        const askUsd = item.ask_price ? (item.ask_price * btcPrice).toFixed(2) : (markPrice * btcPrice * 1.02).toFixed(2);
        const markUsd = (markPrice * btcPrice).toFixed(2);

        return {
          instrument: item.instrument_name,
          expiry: expiryStr,
          strike: strike,
          type: type,
          bid: parseFloat(bidUsd),
          ask: parseFloat(askUsd),
          mark: parseFloat(markUsd),
          markIv: item.mark_iv ? item.mark_iv.toFixed(1) : '54.0',
          volumeUsd: item.volume_usd || 0,
          openInterest: item.open_interest || 0,
          underlyingPrice: underlyingPrice
        };
      });

      sendJson(res, { currency: rawCurrency, underlyingPrice, options: formatted });
    } catch {
      sendJson(res, { currency: rawCurrency, underlyingPrice: (rawCurrency === 'BTC' ? 84600 : 2700), options: [] });
    }
    return;
  }

  // M3: System Health & Observability Metrics
  if (reqPath === '/api/health') {
    const mem = process.memoryUsage();
    sendJson(res, {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: Date.now(),
      metrics: {
        activeSessions: sessions.size,
        activeNonces: nonces.size,
        rateLimitBuckets: requestBuckets.size,
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024)
      }
    }, 200, req);
    return;
  }

  // Pool configuration is immutable at runtime. Never let a client redirect spender funds.
  if (reqPath === '/api/config/pool') {
    if (req.method !== 'GET') {
      throw new HttpError(405, 'Pool configuration is read-only');
    }
    const poolAddr = process.env.LP_POOL_ADDRESS || null;
    if (!poolAddr || !ethers.isAddress(poolAddr)) {
      throw new HttpError(503, 'Pool is not configured');
    }
    sendJson(res, { poolAddress: ethers.getAddress(poolAddr) }, 200, req);
    return;
  }

  // STATIC FILE SERVING: Strictly confined to dist/ (C-1 security fix)
  const filePath = resolveStatic(reqPath);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  fs.realpath(filePath, (e, real) => {
    if (e || (!real.startsWith(PUBLIC_DIR + path.sep) && real !== path.join(PUBLIC_DIR, 'index.html'))) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    fs.stat(real, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(real).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        ...securityHeaders()
      });

      fs.createReadStream(real).pipe(res);
    });
  });
}

// Server initialization with top-level error handling & timeouts (H-1, M-2)
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    console.error('[Request error]:', err?.code || err?.message || err);
    if (!res.headersSent) {
      sendJson(
        res,
        { error: status < 500 ? (err?.message || 'Bad request') : 'Internal server error' },
        status,
        req
      );
    }
  });
});

server.headersTimeout = 10000;
server.requestTimeout = 15000;
server.keepAliveTimeout = 5000;

server.listen(PORT, BIND_HOST, () => {
  console.log(`\n============================================================`);
  console.log(`  23TRADE Hardened Local Exchange running at:`);
  console.log(`  👉 http://localhost:${PORT}`);
  console.log(`============================================================\n`);
  console.log(`- Web3 Wallets (MetaMask, Rabby) active on http://localhost:${PORT}`);
  console.log(`- Security patches active: C-1 (Path Traversal), C-4 (.env Write Lock),`);
  console.log(`  H-1 (Crash Protection), H-3 (Input Validation), M-2 (Payload Guard).`);
  console.log(`- Press Ctrl+C in this terminal to stop the server.\n`);
});

// Periodic Funding Settlement Loop (Hourly Epochs)
let lastFundingHour = new Date().getUTCHours();
setInterval(async () => {
  const currentHour = new Date().getUTCHours();
  if (currentHour !== lastFundingHour) {
    lastFundingHour = currentHour;
    try {
      console.log(`⏱️ [Funding Engine] Triggering hourly funding settlement for UTC Hour ${currentHour}...`);
      await db.settleFundingRates();
    } catch (err) {
      console.error('[Funding Engine] Settlement error:', err?.message || err);
    }
  }
}, 30_000);
