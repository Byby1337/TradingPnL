-- ==========================================================
-- 23TRADE PRODUCTION DATABASE SCHEMA (PostgreSQL)
-- ==========================================================

-- 1. Accounts Table (Collateral, Equity, Vault Balance)
CREATE TABLE IF NOT EXISTS accounts (
    address VARCHAR(42) PRIMARY KEY,
    deposited_usdc NUMERIC(18, 6) DEFAULT 0.000000,
    locked_margin NUMERIC(18, 6) DEFAULT 0.000000,
    realized_pnl NUMERIC(18, 6) DEFAULT 0.000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Open / Active Perpetual Positions
CREATE TABLE IF NOT EXISTS positions (
    id VARCHAR(64) PRIMARY KEY,
    account_address VARCHAR(42) NOT NULL REFERENCES accounts(address) ON DELETE CASCADE,
    symbol VARCHAR(32) NOT NULL,
    base VARCHAR(16) NOT NULL,
    side VARCHAR(8) NOT NULL,
    leverage INTEGER NOT NULL,
    size_coins NUMERIC(18, 6) NOT NULL,
    entry_price NUMERIC(18, 4) NOT NULL,
    margin NUMERIC(18, 6) NOT NULL,
    liq_price NUMERIC(18, 4) NOT NULL,
    status VARCHAR(16) DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_positions_account ON positions(account_address, status);

-- 3. Trade History & Realized Settlements
CREATE TABLE IF NOT EXISTS trades_history (
    id VARCHAR(64) PRIMARY KEY,
    account_address VARCHAR(42) NOT NULL REFERENCES accounts(address) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL,
    instrument VARCHAR(32) NOT NULL,
    side VARCHAR(16) NOT NULL,
    size VARCHAR(32) NOT NULL,
    entry_price VARCHAR(32) NOT NULL,
    exit_price VARCHAR(32) NOT NULL,
    pnl NUMERIC(18, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_account ON trades_history(account_address, created_at DESC);

-- 4. 0DTE Options Active Contracts
CREATE TABLE IF NOT EXISTS active_options (
    id VARCHAR(64) PRIMARY KEY,
    account_address VARCHAR(42) NOT NULL REFERENCES accounts(address) ON DELETE CASCADE,
    instrument VARCHAR(64) NOT NULL,
    strike VARCHAR(32) NOT NULL,
    spot VARCHAR(32) NOT NULL,
    contracts VARCHAR(32) NOT NULL,
    premium VARCHAR(32) NOT NULL,
    cost_val NUMERIC(18, 6) NOT NULL,
    value VARCHAR(32) NOT NULL,
    expiry VARCHAR(32) DEFAULT 'Today',
    status VARCHAR(16) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_account ON active_options(account_address, status);

-- 5. Funding Rate Periodic Settlements
CREATE TABLE IF NOT EXISTS funding_settlements (
    id VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    funding_rate NUMERIC(10, 6) NOT NULL,
    long_oi NUMERIC(18, 6) NOT NULL,
    short_oi NUMERIC(18, 6) NOT NULL,
    total_positions_settled INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_symbol ON funding_settlements(symbol, created_at DESC);
