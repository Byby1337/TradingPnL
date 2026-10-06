/**
 * Migration Script: SQLite -> PostgreSQL
 * Reads all accounts, positions, trade history and options from database/trading.sqlite
 * and imports them into PostgreSQL.
 *
 * Usage:
 *   node scripts/migrateToPostgres.cjs [POSTGRES_URL]
 *   Example: node scripts/migrateToPostgres.cjs postgresql://postgres:mypassword@localhost:5432/postgres
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

// Safe .env loader
function loadEnv() {
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
}

loadEnv();

const dbUrl = process.argv[2] || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('\n❌ Ошибка: не указана строка подключения к PostgreSQL!');
  console.log('Пожалуйста, укажите строку подключения в качестве аргумента:');
  console.log('  node scripts/migrateToPostgres.cjs postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/postgres');
  console.log('Или пропишите DATABASE_URL=... в файле .env\n');
  process.exit(1);
}

const sqlitePath = path.join(__dirname, '..', 'database', 'trading.sqlite');
if (!fs.existsSync(sqlitePath)) {
  console.error('❌ Файл SQLite не найден по пути:', sqlitePath);
  process.exit(1);
}

async function run() {
  console.log('\n======================================================');
  console.log('🚀 МИГРАЦИЯ ДАННЫХ ИЗ SQLITE В POSTGRESQL');
  console.log('======================================================');
  console.log(`📁 Исходный SQLite: ${sqlitePath}`);
  console.log(`🐘 Целевой PostgreSQL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  // 1. Connect to PostgreSQL
  const pg = new Client({ connectionString: dbUrl });
  try {
    await pg.connect();
    console.log('✅ Успешное подключение к PostgreSQL!');
  } catch (err) {
    console.error('❌ Не удалось подключиться к PostgreSQL:', err.message);
    if (err.code === '28P01') {
      console.error('👉 Ошибка пароля: проверьте пароль пользователя postgres.');
    }
    process.exit(1);
  }

  // 2. Apply PostgreSQL Schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  console.log('⚙️ Применение схемы таблиц PostgreSQL (database/schema.sql)...');
  await pg.query(schemaSql);
  console.log('✅ Таблицы и индексы в PostgreSQL созданы/проверены.');

  // 3. Read SQLite Data
  const sqlite = new sqlite3.Database(sqlitePath);
  const querySqlite = (sql) => new Promise((resolve, reject) => {
    sqlite.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  const accounts = await querySqlite('SELECT * FROM accounts');
  const positions = await querySqlite('SELECT * FROM positions');
  const trades = await querySqlite('SELECT * FROM trades_history');
  const options = await querySqlite('SELECT * FROM active_options').catch(() => []);

  console.log(`\n📊 Найдено в SQLite:`);
  console.log(`   - Аккаунтов: ${accounts.length}`);
  console.log(`   - Позиций: ${positions.length}`);
  console.log(`   - Истории сделок: ${trades.length}`);
  console.log(`   - Опционов: ${options.length}`);

  // 4. Migrate Accounts
  let accCount = 0;
  for (const a of accounts) {
    await pg.query(`
      INSERT INTO accounts (address, deposited_usdc, locked_margin, realized_pnl, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (address) DO UPDATE SET
        deposited_usdc = EXCLUDED.deposited_usdc,
        locked_margin = EXCLUDED.locked_margin,
        realized_pnl = EXCLUDED.realized_pnl,
        updated_at = EXCLUDED.updated_at
    `, [
      a.address.toLowerCase(),
      parseFloat(a.deposited_usdc || 0),
      parseFloat(a.locked_margin || 0),
      parseFloat(a.realized_pnl || 0),
      a.created_at ? new Date(a.created_at) : new Date(),
      a.updated_at ? new Date(a.updated_at) : new Date()
    ]);
    accCount++;
  }
  console.log(`✅ Перенесено аккаунтов: ${accCount}`);

  // 5. Migrate Positions
  let posCount = 0;
  for (const p of positions) {
    await pg.query(`
      INSERT INTO positions (
        id, account_address, symbol, base, side, leverage, size_coins,
        entry_price, margin, liq_price, status, created_at, closed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        size_coins = EXCLUDED.size_coins,
        margin = EXCLUDED.margin,
        closed_at = EXCLUDED.closed_at
    `, [
      p.id,
      p.account_address.toLowerCase(),
      p.symbol,
      p.base,
      p.side,
      parseInt(p.leverage, 10),
      parseFloat(p.size_coins),
      parseFloat(p.entry_price),
      parseFloat(p.margin),
      parseFloat(p.liq_price),
      p.status || 'OPEN',
      p.created_at ? new Date(p.created_at) : new Date(),
      p.closed_at ? new Date(p.closed_at) : null
    ]);
    posCount++;
  }
  console.log(`✅ Перенесено позиций: ${posCount}`);

  // 6. Migrate Trade History
  let tradeCount = 0;
  for (const t of trades) {
    await pg.query(`
      INSERT INTO trades_history (
        id, account_address, type, instrument, side, size, entry_price, exit_price, pnl, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING
    `, [
      t.id,
      t.account_address.toLowerCase(),
      t.type || 'Perpetual',
      t.instrument,
      t.side,
      t.size,
      t.entry_price,
      t.exit_price,
      parseFloat(t.pnl || 0),
      t.created_at ? new Date(t.created_at) : new Date()
    ]);
    tradeCount++;
  }
  console.log(`✅ Перенесено сделок в историю: ${tradeCount}`);

  // 7. Migrate Options
  let optCount = 0;
  for (const o of options) {
    await pg.query(`
      INSERT INTO active_options (
        id, account_address, instrument, strike, spot, contracts, premium, cost_val, value, expiry, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        value = EXCLUDED.value
    `, [
      o.id,
      o.account_address.toLowerCase(),
      o.instrument,
      o.strike,
      o.spot,
      o.contracts,
      o.premium,
      parseFloat(o.cost_val || 0),
      o.value,
      o.expiry || 'Today',
      o.status || 'ACTIVE',
      o.created_at ? new Date(o.created_at) : new Date()
    ]);
    optCount++;
  }
  if (optCount > 0) {
    console.log(`✅ Перенесено опционов: ${optCount}`);
  }

  // 8. Update .env file with DATABASE_URL
  const envFilePath = path.join(__dirname, '..', '.env');
  let envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf8') : '';
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${dbUrl}`);
  } else {
    envContent += `\nDATABASE_URL=${dbUrl}\n`;
  }
  fs.writeFileSync(envFilePath, envContent.trim() + '\n', 'utf8');
  console.log(`\n📝 Файл .env автоматически обновлен с DATABASE_URL!`);

  sqlite.close();
  await pg.end();

  console.log('\n======================================================');
  console.log('🎉 ВСЕ ДАННЫЕ УСПЕШНО ПЕРЕНЕСЕНЫ В POSTGRESQL!');
  console.log('При запуске "node server.cjs" сервер будет работать с PostgreSQL.');
  console.log('======================================================\n');
}

run().catch((e) => {
  console.error('❌ Фатальная ошибка миграции:', e);
  process.exit(1);
});
