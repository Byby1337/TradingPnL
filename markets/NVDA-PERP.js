// 23TRADE Market Specification: NVDA-PERP (NVIDIA Corp)
// Arcus-style modular tokenized stock definition

const NVDA_PERP = {
  ticker: 'NVDA-PERP',
  name: 'NVIDIA Corp',
  category: 'stocks',
  baseAsset: 'NVDA',
  quoteAsset: 'USDC',
  pairId: 5,
  
  // Real Feeds
  tvSymbol: 'NASDAQ:NVDA',
  cbProduct: 'NVDA', // Synthetic tokenized equities bridge
  pythFeedId: '0x429b82882db8ff2e342f0b74070a248f8ff4579c17df20ab889bb0c4b2b1a99d',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.01,
  stepSize: 0.1,
  minOrderSize: 0.1,
  maxOrderSize: 2000.0,
  maxLeverage: 20,
  defaultLeverage: 10,
  initialMarginBps: 500,     // 5.0% IMR
  maintenanceMarginBps: 250, // 2.5% MMR
  makerFeeBps: 0,            // 0% maker fee (Arcus feature)
  takerFeeBps: 4,            // 0.04% taker fee
  
  // 0DTE Options Configuration
  strikeRound: 2,
  baseIV: 0.48,              // 48% IV
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 2,
  sizeDecimals: 2,
  badge: 'AI & Semiconductor',
  description: 'NVIDIA Tokenized Equity Perpetual with 0% maker fees, 24/7 trading, and 100% margin security.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NVDA_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_NVDA_PERP = NVDA_PERP;
}
