import React, { useState, useRef, useEffect } from 'react';
import { Market } from '../types';
import { MARKETS } from '../constants/markets';

interface MarketRibbonProps {
  currentMarket: Market;
  onSelectMarket: (m: Market) => void;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketPrices?: Record<string, number>;
  marketVolumes?: Record<string, number>;
  labels?: {
    allPairs?: string;
    crypto?: string;
    stocks?: string;
    indexPrice?: string;
    change24h?: string;
    high24h?: string;
    low24h?: string;
    volume24h?: string;
  };
}

export const formatVolume = (val: number | undefined | null) => {
  const v = Number(val) || 0;
  if (v <= 0) return '$0.00';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e4) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DEFAULT_CHANGES: Record<string, number> = {
  'BTC-PERP': 2.45,
  'ETH-PERP': 1.82,
  'SOL-PERP': -0.65,
  'DOGE-PERP': 4.12,
  'BNB-PERP': 1.15,
  'ZEC-PERP': -2.10,
  'LIT-PERP': 3.45,
  'ARB-PERP': -1.25,
  'NEAR-PERP': 2.80,
  'UNI-PERP': 0.95,
  'GMX-PERP': 1.40,
  'XRP-PERP': 4.60,
  'NVDA-PERP': 3.20,
  'SPY-PERP': 0.45,
  'TSLA-PERP': -1.35
};

const DEFAULT_PRICES: Record<string, number> = {
  'BTC-PERP': 85240.50,
  'ETH-PERP': 2685.20,
  'SOL-PERP': 122.40,
  'DOGE-PERP': 0.1845,
  'BNB-PERP': 735.50,
  'ZEC-PERP': 1180.00,
  'LIT-PERP': 0.1205,
  'ARB-PERP': 0.1740,
  'NEAR-PERP': 4.5200,
  'UNI-PERP': 7.350,
  'GMX-PERP': 8.09,
  'XRP-PERP': 1.3800,
  'NVDA-PERP': 138.25,
  'SPY-PERP': 585.10,
  'TSLA-PERP': 258.40
};

const ASSET_META: Record<string, { icon: string; color: string; badgeBg: string }> = {
  'BTC': { icon: '₿', color: '#f7931a', badgeBg: 'bg-[#f7931a]/15 text-[#f7931a] border-[#f7931a]/30' },
  'ETH': { icon: 'Ξ', color: '#627eea', badgeBg: 'bg-[#627eea]/15 text-[#627eea] border-[#627eea]/30' },
  'SOL': { icon: '◎', color: '#14f195', badgeBg: 'bg-[#14f195]/15 text-[#14f195] border-[#14f195]/30' },
  'DOGE': { icon: 'Ð', color: '#c2a633', badgeBg: 'bg-[#c2a633]/15 text-[#c2a633] border-[#c2a633]/30' },
  'BNB': { icon: 'B', color: '#f3ba2f', badgeBg: 'bg-[#f3ba2f]/15 text-[#f3ba2f] border-[#f3ba2f]/30' },
  'ZEC': { icon: 'Z', color: '#f4b237', badgeBg: 'bg-[#f4b237]/15 text-[#f4b237] border-[#f4b237]/30' },
  'LIT': { icon: 'L', color: '#27c699', badgeBg: 'bg-[#27c699]/15 text-[#27c699] border-[#27c699]/30' },
  'ARB': { icon: 'A', color: '#28a0f0', badgeBg: 'bg-[#28a0f0]/15 text-[#28a0f0] border-[#28a0f0]/30' },
  'NEAR': { icon: 'N', color: '#5f80ea', badgeBg: 'bg-[#5f80ea]/15 text-[#5f80ea] border-[#5f80ea]/30' },
  'UNI': { icon: 'U', color: '#ff007a', badgeBg: 'bg-[#ff007a]/15 text-[#ff007a] border-[#ff007a]/30' },
  'GMX': { icon: 'G', color: '#4f56f4', badgeBg: 'bg-[#4f56f4]/15 text-[#4f56f4] border-[#4f56f4]/30' },
  'XRP': { icon: '✕', color: '#23292f', badgeBg: 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30' },
  'NVDA': { icon: 'N', color: '#76b900', badgeBg: 'bg-[#76b900]/15 text-[#76b900] border-[#76b900]/30' },
  'SPY': { icon: 'S', color: '#3b82f6', badgeBg: 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30' },
  'TSLA': { icon: 'T', color: '#e82127', badgeBg: 'bg-[#e82127]/15 text-[#e82127] border-[#e82127]/30' }
};

export const MarketRibbon: React.FC<MarketRibbonProps> = ({
  currentMarket,
  onSelectMarket,
  price,
  change24h,
  high24h,
  low24h,
  volume24h,
  marketPrices,
  marketVolumes,
  labels
}) => {
  const [showPairMenu, setShowPairMenu] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'all' | 'crypto' | 'stocks'>('all');
  const menuRef = useRef<HTMLDivElement>(null);

  const [fundingData, setFundingData] = useState<{
    fundingRatePercent: string;
    fundingRate: number;
    secondsLeft: number;
    totalOi: number;
    maxOi: number;
  }>({
    fundingRatePercent: '+0.0100%',
    fundingRate: 0.0001,
    secondsLeft: 3600,
    totalOi: 0,
    maxOi: 100000
  });

  const [countdownStr, setCountdownStr] = useState<string>('00:00');

  useEffect(() => {
    let active = true;
    const fetchFunding = async () => {
      try {
        const res = await fetch(`/api/markets/funding?symbol=${encodeURIComponent(currentMarket.ticker)}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setFundingData(data);
          }
        }
      } catch {}
    };

    fetchFunding();
    const interval = setInterval(fetchFunding, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentMarket.ticker]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const nextHour = Math.ceil(now / 3600000) * 3600000;
      const diffSec = Math.max(0, Math.floor((nextHour - now) / 1000));
      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      setCountdownStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPairMenu(false);
      }
    };
    if (showPairMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPairMenu]);

  const filteredMarkets = Object.values(MARKETS).filter((m) => {
    if (marketFilter === 'all') return true;
    return m.category === marketFilter;
  });

  const activeMeta = ASSET_META[currentMarket.base] || { icon: '•', color: '#d97706', badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };

  return (
    <div className="h-9 border-b border-panel bg-panel px-4 flex items-center justify-between text-[11px] font-mono numeric flex-shrink-0 relative z-30 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-5 shrink-0">
        {/* Sleek Pair Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowPairMenu(!showPairMenu)}
            className="flex items-center gap-2 pr-3.5 border-r border-panel cursor-pointer hover:opacity-90 py-1 bg-transparent border-0 text-left outline-none group transition"
          >
            {currentMarket.icon ? (
              <img src={currentMarket.icon} alt="" className="w-5 h-5 rounded-full object-contain shrink-0" />
            ) : (
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${activeMeta.badgeBg}`}>
                {activeMeta.icon}
              </div>
            )}
            <span className="font-bold text-primary text-[13px] font-sans group-hover:text-amber-400 transition-colors">
              {currentMarket.ticker}
            </span>
            <span className="text-[10px] px-2 py-0.5 leading-none shrink-0 inline-flex items-center justify-center rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold">
              {currentMarket.maxLeverage}x
            </span>
            <span className={`text-[9px] text-muted transition-transform duration-200 ${showPairMenu ? 'rotate-180 text-amber-400' : ''}`}>
              ▼
            </span>
          </button>

          {showPairMenu && (
            <div className="absolute left-0 top-10 w-96 bg-panel/95 backdrop-blur-xl border border-panel shadow-2xl rounded-2xl p-2.5 z-50 font-sans animate-in fade-in zoom-in-95 duration-150">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-subpanel rounded-xl mb-2 border border-panel">
                <button
                  onClick={() => setMarketFilter('all')}
                  className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition ${
                    marketFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  {labels?.allPairs || 'All Pairs'}
                </button>
                <button
                  onClick={() => setMarketFilter('crypto')}
                  className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition ${
                    marketFilter === 'crypto'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  {labels?.crypto || 'Crypto'}
                </button>
                <button
                  onClick={() => setMarketFilter('stocks')}
                  className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition ${
                    marketFilter === 'stocks'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  {labels?.stocks || 'Equities'}
                </button>
              </div>

              {/* Pair List Cards */}
              <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
                {filteredMarkets.map((m) => {
                  const meta = ASSET_META[m.base] || { icon: '•', color: '#d97706', badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
                  const isSelected = m.ticker === currentMarket.ticker;
                  const mPrice = m.ticker === currentMarket.ticker
                    ? price
                    : (marketPrices?.[m.ticker] || marketPrices?.[m.base] || DEFAULT_PRICES[m.ticker] || 0);
                  const mChg = m.ticker === currentMarket.ticker
                    ? change24h
                    : (DEFAULT_CHANGES[m.ticker] || 1.25);
                  const pairVol = marketVolumes?.[m.ticker] ?? marketVolumes?.[`${m.ticker}-PERP`] ?? (m.ticker === currentMarket.ticker ? volume24h : 0);
                  const mVol = formatVolume(pairVol);

                  return (
                    <div
                      key={m.ticker}
                      onClick={() => {
                        onSelectMarket(m);
                        setShowPairMenu(false);
                      }}
                      className={`px-3 py-2 rounded-xl cursor-pointer flex justify-between items-center transition-all group ${
                        isSelected
                          ? 'bg-amber-500/10 border border-amber-500/40 shadow-sm'
                          : 'hover:bg-subpanel border border-transparent hover:border-panel'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {m.icon ? (
                          <img src={m.icon} alt="" className="w-7 h-7 rounded-full object-contain flex-shrink-0" />
                        ) : (
                          <div className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold ${meta.badgeBg}`}>
                            {meta.icon}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold text-xs ${isSelected ? 'text-amber-400' : 'text-primary group-hover:text-amber-300'}`}>
                              {m.ticker}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 leading-none shrink-0 inline-flex items-center justify-center rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold">
                              {m.maxLeverage}x
                            </span>
                          </div>
                          <span className="text-muted text-[10px]">{m.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end font-mono">
                        <span className="text-xs font-bold text-primary group-hover:text-amber-300 transition-colors">
                          ${mPrice.toLocaleString('en-US', { minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals })}
                        </span>
                        <span className={`text-[10px] font-semibold ${mChg >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                          {mChg >= 0 ? '+' : ''}{mChg.toFixed(2)}%
                        </span>
                        <span className="text-[9px] text-muted">
                          Vol {mVol}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Real Ticker Stats */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted text-[10px] mr-1 font-sans">{labels?.indexPrice || 'Index Price'}:</span>
          <span className="text-primary font-bold">
            ${price.toLocaleString('en-US', { minimumFractionDigits: currentMarket.decimals, maximumFractionDigits: currentMarket.decimals })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-muted text-[10px] mr-1">{labels?.change24h || '24h Change'}:</span>
          <span className={`font-semibold ${change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-muted">
          <span className="text-[10px] mr-1">{labels?.high24h || '24h High'}:</span>
          <span className="text-primary font-medium">${high24h.toLocaleString('en-US', { minimumFractionDigits: currentMarket.decimals })}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-muted">
          <span className="text-[10px] mr-1">{labels?.low24h || '24h Low'}:</span>
          <span className="text-primary font-medium">${low24h.toLocaleString('en-US', { minimumFractionDigits: currentMarket.decimals })}</span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-muted">
          <span className="text-[10px] mr-1">{labels?.volume24h || '24h Volume'}:</span>
          <span className="text-primary font-medium">{formatVolume(volume24h)}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3 text-[11px] font-mono shrink-0">
        <div className="flex items-center gap-1.5 bg-subpanel px-2.5 py-0.5 rounded border border-panel" title="Periodic funding rate applied between Long and Short positions">
          <span className="text-muted text-[10px] font-sans">Funding:</span>
          <span className={`font-semibold ${fundingData.fundingRate >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {fundingData.fundingRate >= 0 ? '+' : ''}{fundingData.fundingRatePercent}
          </span>
          <span className="text-muted text-[10px] font-sans ml-0.5">in {countdownStr}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-subpanel px-2.5 py-0.5 rounded border border-panel" title={`Max Open Interest Cap: ${formatVolume(fundingData.maxOi)}`}>
          <span className="text-muted text-[10px] font-sans">OI:</span>
          <span className="text-primary font-bold">{formatVolume(fundingData.totalOi)}</span>
          <span className="text-muted text-[9px]">/ {formatVolume(fundingData.maxOi)}</span>
        </div>
      </div>
    </div>
  );
};
