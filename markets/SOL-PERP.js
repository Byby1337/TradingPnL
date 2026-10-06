// 23TRADE Market Specification: SOL-PERP (Solana)
// Arcus-style modular market definition

const SOL_PERP = {
  ticker: 'SOL-PERP',
  name: 'Solana',
  category: 'crypto',
  baseAsset: 'SOL',
  quoteAsset: 'USDC',
  pairId: 3,
  
  // Real Feeds
  tvSymbol: 'COINBASE:SOLUSD',
  cbProduct: 'SOL-USD',
  pythFeedId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.01,
  stepSize: 0.1,
  minOrderSize: 0.1,
  maxOrderSize: 5000.0,
  maxLeverage: 50,
  defaultLeverage: 15,
  initialMarginBps: 200,     // 2.0% IMR
  maintenanceMarginBps: 100, // 1.0% MMR
  makerFeeBps: 2,
  takerFeeBps: 5.5,
  
  // 0DTE Options Configuration
  strikeRound: 5,
  baseIV: 0.76,              // 76% IV
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 2,
  sizeDecimals: 2,
  badge: 'High Beta',
  description: 'Solana Perpetual contract featuring high-velocity order routing and continuous funding.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SOL_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_SOL_PERP = SOL_PERP;
}
