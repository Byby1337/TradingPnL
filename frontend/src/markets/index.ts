import { MarketConfig, BTC_PERP } from './BTC-PERP';
import { ETH_PERP } from './ETH-PERP';
import { SOL_PERP } from './SOL-PERP';
import { DOGE_PERP } from './DOGE-PERP';
import { NVDA_PERP } from './NVDA-PERP';
import { SPY_PERP } from './SPY-PERP';
import { TSLA_PERP } from './TSLA-PERP';

export type { MarketConfig };
export { BTC_PERP, ETH_PERP, SOL_PERP, DOGE_PERP, NVDA_PERP, SPY_PERP, TSLA_PERP };

export const ALL_MARKETS: Record<string, MarketConfig> = {
  'BTC-PERP': BTC_PERP,
  'ETH-PERP': ETH_PERP,
  'SOL-PERP': SOL_PERP,
  'DOGE-PERP': DOGE_PERP,
  'NVDA-PERP': NVDA_PERP,
  'SPY-PERP': SPY_PERP,
  'TSLA-PERP': TSLA_PERP
};

export const MarketRegistry = {
  getMarket(ticker: string): MarketConfig {
    return ALL_MARKETS[ticker] || BTC_PERP;
  },

  getAllTickers(): string[] {
    return Object.keys(ALL_MARKETS);
  },

  getCryptoMarkets(): MarketConfig[] {
    return Object.values(ALL_MARKETS).filter(m => m.category === 'crypto');
  },

  getStockMarkets(): MarketConfig[] {
    return Object.values(ALL_MARKETS).filter(m => m.category === 'stocks');
  }
};
