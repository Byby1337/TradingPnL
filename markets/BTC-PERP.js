// 23TRADE Market Specification: BTC-PERP (Bitcoin)
// Arcus-style modular market definition

const BTC_PERP = {
  ticker: 'BTC-PERP',
  name: 'Bitcoin',
  category: 'crypto',
  baseAsset: 'BTC',
  quoteAsset: 'USDC',
  pairId: 1,
  
  // Real Feeds
  tvSymbol: 'COINBASE:BTCUSD',
  cbProduct: 'BTC-USD',
  pythFeedId: '0xe62df6e830ba6ae761531cbe50c1a04e3ea95ff77eb0b7a32d525964a5b03988',
  
  // Trading Constraints & Risk Engine
  tickSize: 0.1,
  stepSize: 0.001,
  minOrderSize: 0.001,
  maxOrderSize: 100.0,
  maxLeverage: 100,
  defaultLeverage: 20,
  initialMarginBps: 100,     // 1.0% IMR
  maintenanceMarginBps: 50,  // 0.5% MMR
  makerFeeBps: 2,            // 0.02%
  takerFeeBps: 5.5,          // 0.055%
  
  // 0DTE Options Configuration
  strikeRound: 500,
  baseIV: 0.54,              // 54% IV
  expiryPresets: ['1h', '4h', '24h'],
  
  // Display & UI
  priceDecimals: 2,
  sizeDecimals: 4,
  badge: 'Top Mkt Cap',
  description: 'Bitcoin Perpetual contract with 100% margin protection and 0DTE upside routing.'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BTC_PERP;
} else if (typeof window !== 'undefined') {
  window.MARKET_BTC_PERP = BTC_PERP;
}
