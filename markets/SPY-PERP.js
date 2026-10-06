// 23TRADE Market Specification: SPY-PERP (SPDR S&P 500 ETF)
// Arcus-style modular tokenized index ETF definition

const SPY_PERP = {
  ticker: 'SPY-PERP',
  name: 'S&P 500 ETF',
  category: 'stocks',
  baseAsset: 'SPY',
  quoteAsset: 'USDC',
  pairId: 6,
  
  // Real Feeds
  tvSymbol: 'AMEX:SPY',
  cbProduct: 'SPY',
  pythFeedId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.01,
  stepSize: 0.1,
  minOrderSize: 0.1,
  maxOrderSize: 5000.0,
  maxLeverage: 20,
  defaultLeverage: 10,
  initialMarginBps: 500,     // 5.0% IMR
  maintenanceMarginBps: 250, // 2.5% MMR
  makerFeeBps: 0,
  takerFeeBps: 3.5,
  
  // 0DTE Options Configuration
  strikeRound: 1,
  baseIV: 0.22,              // 22% IV (Lower macro equity volatility)
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 2,
  sizeDecimals: 2,
  badge: 'Benchmark Index',
  description: 'SPDR S&P 500 ETF Trust Tokenized Perpetual with sub-penny tick spread and index tracking.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPY_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_SPY_PERP = SPY_PERP;
}
