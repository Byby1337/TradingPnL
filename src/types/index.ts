export type Category = 'crypto' | 'stocks';

export interface Market {
  name: string;
  ticker: string;
  base: string;
  baseAsset?: string;
  tvSymbol: string;
  cbProduct: string;
  strikeRound: number;
  decimals: number;
  priceDecimals?: number;
  category: Category;
  maxLeverage: number;
  icon?: string;
}

export interface Position {
  id: string;
  symbol: string;
  base: string;
  side: 'Long' | 'Short';
  leverage: number;
  sizeCoins: number;
  entry: number;
  margin: number;
  liqPrice: number;
  timestamp: string;
}

export interface ActiveOption {
  id: string;
  instrument: string;
  strike: string;
  spot: string;
  contracts: string;
  premium: string;
  costVal: number;
  value: string;
  expiry: string;
}

export interface TradeHistoryItem {
  timestamp: string;
  type: 'Perpetual' | '0DTE Option';
  instrument: string;
  side: string;
  size: string;
  entry: string;
  exit: string;
  pnl: number;
}

export interface DeribitOptionData {
  instrument: string;
  expiry: string;
  strike: number;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  mark: number;
  markIv: string;
  volumeUsd: number;
  openInterest: number;
  underlyingPrice: number;
}

export interface LiveTrade {
  price: string;
  size: string;
  time: string;
  side: 'buy' | 'sell';
}
