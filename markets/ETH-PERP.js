// 23TRADE Market Specification: ETH-PERP (Ethereum)
// Arcus-style modular market definition

const ETH_PERP = {
  ticker: 'ETH-PERP',
  name: 'Ethereum',
  category: 'crypto',
  baseAsset: 'ETH',
  quoteAsset: 'USDC',
  pairId: 2,
  
  // Real Feeds
  tvSymbol: 'COINBASE:ETHUSD',
  cbProduct: 'ETH-USD',
  pythFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.01,
  stepSize: 0.01,
  minOrderSize: 0.01,
  maxOrderSize: 1000.0,
  maxLeverage: 100,
  defaultLeverage: 20,
  initialMarginBps: 100,     // 1.0% IMR
  maintenanceMarginBps: 50,  // 0.5% MMR
  makerFeeBps: 2,
  takerFeeBps: 5.5,
  
  // 0DTE Options Configuration
  strikeRound: 50,
  baseIV: 0.62,              // 62% IV
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 2,
  sizeDecimals: 3,
  badge: 'Smart Contracts',
  description: 'Ethereum Perpetual contract settled in USDC with real-time Pyth oracle verification.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ETH_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_ETH_PERP = ETH_PERP;
}
