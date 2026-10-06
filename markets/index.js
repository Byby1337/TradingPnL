// 23TRADE Unified Markets Registry
// Arcus-style decentralized multi-asset architecture

function resolveAllMarkets() {
  let markets = {};
  if (typeof require !== 'undefined') {
    markets['BTC-PERP'] = require('./BTC-PERP.js');
    markets['ETH-PERP'] = require('./ETH-PERP.js');
    markets['SOL-PERP'] = require('./SOL-PERP.js');
    markets['DOGE-PERP'] = require('./DOGE-PERP.js');
    markets['NVDA-PERP'] = require('./NVDA-PERP.js');
    markets['SPY-PERP'] = require('./SPY-PERP.js');
    markets['TSLA-PERP'] = require('./TSLA-PERP.js');
  } else if (typeof window !== 'undefined') {
    markets['BTC-PERP'] = window.MARKET_BTC_PERP;
    markets['ETH-PERP'] = window.MARKET_ETH_PERP;
    markets['SOL-PERP'] = window.MARKET_SOL_PERP;
    markets['DOGE-PERP'] = window.MARKET_DOGE_PERP;
    markets['NVDA-PERP'] = window.MARKET_NVDA_PERP;
    markets['SPY-PERP'] = window.MARKET_SPY_PERP;
    markets['TSLA-PERP'] = window.MARKET_TSLA_PERP;
  }

  // Ensure compatibility accessors (base, decimals)
  Object.values(markets).forEach(m => {
    if (m) {
      m.base = m.baseAsset;
      m.decimals = m.priceDecimals;
    }
  });

  return markets;
}

const MarketRegistry = {
  get markets() {
    return resolveAllMarkets();
  },

  getMarket(ticker) {
    const all = resolveAllMarkets();
    return all[ticker] || all['BTC-PERP'];
  },

  getAllTickers() {
    return Object.keys(resolveAllMarkets());
  },

  getCryptoMarkets() {
    return Object.values(resolveAllMarkets()).filter(m => m && m.category === 'crypto');
  },

  getStockMarkets() {
    return Object.values(resolveAllMarkets()).filter(m => m && m.category === 'stocks');
  },

  isStock(ticker) {
    const m = this.getMarket(ticker);
    return m ? m.category === 'stocks' : false;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketRegistry;
}
if (typeof window !== 'undefined') {
  window.TRADE23_MARKETS = MarketRegistry;
}
