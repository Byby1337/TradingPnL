import { Market } from '../types';

export const MARKETS: Record<string, Market> = {
  'BTC-PERP': {
    name: 'Bitcoin',
    ticker: 'BTC-PERP',
    base: 'BTC',
    tvSymbol: 'COINBASE:BTCUSD',
    cbProduct: 'BTC-USD',
    strikeRound: 500,
    decimals: 2,
    category: 'crypto',
    maxLeverage: 100,
    icon: '/tokens/Bitcoin.svg.webp'
  },
  'ETH-PERP': {
    name: 'Ethereum',
    ticker: 'ETH-PERP',
    base: 'ETH',
    tvSymbol: 'COINBASE:ETHUSD',
    cbProduct: 'ETH-USD',
    strikeRound: 50,
    decimals: 2,
    category: 'crypto',
    maxLeverage: 100,
    icon: '/tokens/ETH.png'
  },
  'SOL-PERP': {
    name: 'Solana',
    ticker: 'SOL-PERP',
    base: 'SOL',
    tvSymbol: 'COINBASE:SOLUSD',
    cbProduct: 'SOL-USD',
    strikeRound: 5,
    decimals: 2,
    category: 'crypto',
    maxLeverage: 50,
    icon: '/tokens/Solana_logo.png'
  },
  'DOGE-PERP': {
    name: 'Dogecoin',
    ticker: 'DOGE-PERP',
    base: 'DOGE',
    tvSymbol: 'COINBASE:DOGEUSD',
    cbProduct: 'DOGE-USD',
    strikeRound: 0.01,
    decimals: 4,
    category: 'crypto',
    maxLeverage: 20,
    icon: '/tokens/Dogecoin_Logo.png'
  },
  'NVDA-PERP': {
    name: 'NVIDIA Corp',
    ticker: 'NVDA-PERP',
    base: 'NVDA',
    tvSymbol: 'NASDAQ:NVDA',
    cbProduct: 'NVDA',
    strikeRound: 2,
    decimals: 2,
    category: 'stocks',
    maxLeverage: 20,
    icon: '/tokens/NVDA.png'
  },
  'SPY-PERP': {
    name: 'S&P 500 ETF',
    ticker: 'SPY-PERP',
    base: 'SPY',
    tvSymbol: 'AMEX:SPY',
    cbProduct: 'SPY',
    strikeRound: 1,
    decimals: 2,
    category: 'stocks',
    maxLeverage: 20,
    icon: '/tokens/SPY.png'
  },
  'TSLA-PERP': {
    name: 'Tesla Inc',
    ticker: 'TSLA-PERP',
    base: 'TSLA',
    tvSymbol: 'NASDAQ:TSLA',
    cbProduct: 'TSLA',
    strikeRound: 5,
    decimals: 2,
    category: 'stocks',
    maxLeverage: 20,
    icon: '/tokens/TSLA.png'
  }
};
