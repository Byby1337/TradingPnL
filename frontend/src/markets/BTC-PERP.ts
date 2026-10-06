export interface MarketConfig {
  ticker: string;
  name: string;
  category: 'crypto' | 'stocks';
  baseAsset: string;
  quoteAsset: string;
  pairId: number;
  tvSymbol: string;
  cbProduct: string;
  pythFeedId: string;
  tickSize: number;
  stepSize: number;
  minOrderSize: number;
  maxOrderSize: number;
  maxLeverage: number;
  defaultLeverage: number;
  initialMarginBps: number;
  maintenanceMarginBps: number;
  makerFeeBps: number;
  takerFeeBps: number;
  strikeRound: number;
  baseIV: number;
  expiryPresets: string[];
  priceDecimals: number;
  sizeDecimals: number;
  badge: string;
  description: string;
}

export const BTC_PERP: MarketConfig = {
  ticker: 'BTC-PERP',
  name: 'Bitcoin',
  category: 'crypto',
  baseAsset: 'BTC',
  quoteAsset: 'USDC',
  pairId: 1,
  tvSymbol: 'COINBASE:BTCUSD',
  cbProduct: 'BTC-USD',
  pythFeedId: '0xe62df6e830ba6ae761531cbe50c1a04e3ea95ff77eb0b7a32d525964a5b03988',
  tickSize: 0.1,
  stepSize: 0.001,
  minOrderSize: 0.001,
  maxOrderSize: 100.0,
  maxLeverage: 100,
  defaultLeverage: 20,
  initialMarginBps: 100,
  maintenanceMarginBps: 50,
  makerFeeBps: 2,
  takerFeeBps: 5.5,
  strikeRound: 500,
  baseIV: 0.54,
  expiryPresets: ['1h', '4h', '24h'],
  priceDecimals: 2,
  sizeDecimals: 4,
  badge: 'Top Mkt Cap',
  description: 'Bitcoin Perpetual contract with 100% margin protection and 0DTE upside routing.'
};
