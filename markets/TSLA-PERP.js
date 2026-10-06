// 23TRADE Market Specification: TSLA-PERP (Tesla Inc)
// Arcus-style modular tokenized stock definition

const TSLA_PERP = {
  ticker: 'TSLA-PERP',
  name: 'Tesla Inc',
  category: 'stocks',
  baseAsset: 'TSLA',
  quoteAsset: 'USDC',
  pairId: 7,
  
  // Real Feeds
  tvSymbol: 'NASDAQ:TSLA',
  cbProduct: 'TSLA',
  pythFeedId: '0x16b0f1a9b2b2b1a8f9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.01,
  stepSize: 0.1,
  minOrderSize: 0.1,
  maxOrderSize: 3000.0,
  maxLeverage: 20,
  defaultLeverage: 10,
  initialMarginBps: 500,     // 5.0% IMR
  maintenanceMarginBps: 250, // 2.5% MMR
  makerFeeBps: 0,
  takerFeeBps: 4.5,
  
  // 0DTE Options Configuration
  strikeRound: 5,
  baseIV: 0.58,              // 58% IV
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 2,
  sizeDecimals: 2,
  badge: 'EV & Autonomous',
  description: 'Tesla Inc Tokenized Perpetual contract traded 24/7 with instant USDC settlement.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TSLA_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_TSLA_PERP = TSLA_PERP;
}
