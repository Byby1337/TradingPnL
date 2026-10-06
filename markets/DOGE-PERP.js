// 23TRADE Market Specification: DOGE-PERP (Dogecoin)
// Arcus-style modular market definition

const DOGE_PERP = {
  ticker: 'DOGE-PERP',
  name: 'Dogecoin',
  category: 'crypto',
  baseAsset: 'DOGE',
  quoteAsset: 'USDC',
  pairId: 4,
  
  // Real Feeds
  tvSymbol: 'BINANCE:DOGEUSDT',
  cbProduct: 'DOGE-USD',
  pythFeedId: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a023097610cf4f840f',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.00001,
  stepSize: 10,
  minOrderSize: 10,
  maxOrderSize: 1000000.0,
  maxLeverage: 20,
  defaultLeverage: 10,
  initialMarginBps: 500,     // 5.0% IMR
  maintenanceMarginBps: 250, // 2.5% MMR
  makerFeeBps: 2,
  takerFeeBps: 6,
  
  // 0DTE Options Configuration
  strikeRound: 0.01,
  baseIV: 0.88,              // 88% IV
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 4,
  sizeDecimals: 1,
  badge: 'Meme Sector',
  description: 'Dogecoin Perpetual contract with high volatility and decentralized oracle feed.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOGE_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_DOGE_PERP = DOGE_PERP;
}
