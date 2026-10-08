import React, { useState, useEffect } from 'react';
import { Market, DeribitOptionData, ActiveOption } from '../types';
import { TRANSLATIONS, LanguageCode, Translations } from '../i18n/translations';

interface OptionsBoardProps {
  currentMarket: Market;
  spotPrice: number;
  userBalance: number;
  activeOptions: ActiveOption[];
  onBuyOption: (instrument: string, strike: number, type: 'CALL' | 'PUT', contracts: number, cost: number) => void;
  onCloseOption: (id: string) => void;
  onNotify?: (type: 'warning' | 'error' | 'info' | 'success', title: string, message: string) => void;
  currentLang?: string;
}

export const OptionsBoard: React.FC<OptionsBoardProps> = ({
  currentMarket,
  spotPrice,
  userBalance,
  activeOptions,
  onBuyOption,
  onCloseOption,
  onNotify,
  currentLang = 'en'
}) => {
  const t: Translations = TRANSLATIONS[(currentLang as LanguageCode) || 'en'] || TRANSLATIONS.en;
  const [boardSide, setBoardSide] = useState<'CALL' | 'PUT'>('CALL');
  const [selectedStrike, setSelectedStrike] = useState<number>(84600);
  const [contracts, setContracts] = useState<number>(0.5);
  const [deribitData, setDeribitData] = useState<DeribitOptionData[]>([]);

  useEffect(() => {
    async function loadDeribit() {
      try {
        const curr = currentMarket.name.includes('ETH') ? 'ETH' : 'BTC';
        const res = await fetch(`/api/options-data?currency=${curr}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.options) {
          setDeribitData(json.options);
        }
      } catch (e) {
        console.warn('Deribit fetch error:', e);
      }
    }
    loadDeribit();
  }, [currentMarket]);

  // Filter or generate intuitive strike cards
  let strikeCards = deribitData.filter((d) => d.type === boardSide);
  if (strikeCards.length === 0) {
    const step = currentMarket.name.includes('BTC') ? 1000 : 50;
    const baseStk = Math.round(spotPrice / step) * step;
    strikeCards = [-3, -2, -1, 0, 1, 2, 3].map((off) => {
      const s = baseStk + off * step;
      const diff = boardSide === 'CALL' ? spotPrice - s : s - spotPrice;
      const mark = Math.max(diff, 0) + spotPrice * 0.012;
      return {
        instrument: `${currentMarket.base}-${s}-${boardSide === 'CALL' ? 'C' : 'P'}`,
        expiry: 'Today',
        strike: s,
        type: boardSide,
        bid: mark * 0.98,
        ask: mark * 1.02,
        mark: mark,
        markIv: '34.5',
        volumeUsd: 15000,
        openInterest: 120,
        underlyingPrice: spotPrice
      };
    });
  }

  const selectedCard = strikeCards.find((c) => c.strike === selectedStrike) || strikeCards[0];
  const premiumPerUnit = selectedCard ? selectedCard.mark : 42.5;
  const totalCost = contracts * premiumPerUnit;
  const breakeven = selectedCard
    ? boardSide === 'CALL'
      ? selectedCard.strike + premiumPerUnit
      : selectedCard.strike - premiumPerUnit
    : spotPrice;

  return (
    <div className="flex-1 grid grid-cols-12 gap-[1px] bg-panel overflow-hidden">
      {/* Cards Matrix */}
      <section className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-[1px] bg-panel overflow-hidden border-r border-panel">
        <div className="h-11 border-b border-panel bg-panel px-4 flex items-center justify-between text-xs flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-muted text-[11px] font-sans">{t.marketDirection}</span>
            <div className="flex bg-subpanel p-0.5 rounded border border-panel text-xs font-semibold">
              <button
                onClick={() => setBoardSide('CALL')}
                className={`px-3 py-1 rounded transition ${
                  boardSide === 'CALL'
                    ? 'bg-[#0ecb81] text-[#080b11] font-bold'
                    : 'text-muted hover:text-primary'
                }`}
              >
                {t.callsLabel}
              </button>
              <button
                onClick={() => setBoardSide('PUT')}
                className={`px-3 py-1 rounded transition ${
                  boardSide === 'PUT'
                    ? 'bg-[#ef4444] text-white font-bold'
                    : 'text-muted hover:text-primary'
                }`}
              >
                {t.putsLabel}
              </button>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-4 font-mono text-[11px] numeric">
            <div>
              <span className="text-muted">{t.spotPriceLabel}</span>{' '}
              <span className="text-primary font-bold">${spotPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-muted">{t.deribitIv}</span>{' '}
              <span className="text-[#10b981] font-semibold">{selectedCard ? selectedCard.markIv : '34.5'}%</span>
            </div>
          </div>
        </div>

        {/* Visual Cards */}
        <div className="flex-1 overflow-auto bg-panel p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {strikeCards.slice(0, 9).map((card) => {
              const isSelected = selectedStrike === card.strike;
              const distPct = (((card.strike - spotPrice) / spotPrice) * 100).toFixed(1);
              const distStr = card.strike === Math.round(spotPrice) ? t.atmLabel : `${distPct}%`;
              const be = boardSide === 'CALL' ? card.strike + card.mark : card.strike - card.mark;

              return (
                <div
                  key={card.strike}
                  onClick={() => setSelectedStrike(card.strike)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-subpanel border-[#d97706] shadow-md ring-1 ring-[#d97706]/40'
                      : 'bg-subpanel/50 border-panel hover:border-muted hover:bg-subpanel'
                  }`}
                >
                  <div className="flex justify-between items-start pb-2 border-b border-panel/50">
                    <div>
                      <div className="text-xs font-bold text-primary font-mono">
                        ${card.strike.toLocaleString()}{' '}
                        <span className={boardSide === 'CALL' ? 'text-[#0ecb81]' : 'text-[#ef4444]'}>
                          {boardSide}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted font-sans">{distStr}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-subpanel text-muted font-mono">
                      IV {card.markIv}%
                    </span>
                  </div>

                  <div className="py-2.5 space-y-1 font-mono text-[11px] numeric">
                    <div className="flex justify-between text-muted text-[10px]">
                      <span>{t.deribitPremium}</span>
                      <span className="text-primary font-bold">${card.mark.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between text-muted text-[10px]">
                      <span>{t.breakeven}</span>
                      <span className="text-[#f59e0b]">${be.toFixed(0)}</span>
                    </div>
                  </div>

                  <button
                    className={`w-full py-1.5 rounded font-sans text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#0ecb81] text-[#080b11]'
                        : 'bg-panel hover:bg-subpanel border border-panel text-primary'
                    }`}
                  >
                    {isSelected ? t.selected : t.selectStrike}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Options Table */}
        <div className="h-44 border-t border-panel bg-panel flex flex-col overflow-hidden">
          <div className="h-7 border-b border-panel px-3 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-primary">{t.openContracts} ({activeOptions.length})</span>
            <span className="font-mono text-[10px] text-muted">{t.settlementIndex}</span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left font-mono text-[11px] numeric">
              <thead>
                <tr className="text-muted border-b border-panel text-[10px] pb-1 font-sans">
                  <th className="pb-1 font-normal">{t.instrument}</th>
                  <th className="pb-1 font-normal">Strike</th>
                  <th className="pb-1 font-normal">Spot</th>
                  <th className="pb-1 font-normal">{t.contracts}</th>
                  <th className="pb-1 font-normal">{t.entryPremium}</th>
                  <th className="pb-1 font-normal">{t.currentValue}</th>
                  <th className="pb-1 font-normal text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y border-panel">
                {activeOptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted font-sans text-xs">
                      {t.noActiveOptions}
                    </td>
                  </tr>
                ) : (
                  activeOptions.map((opt) => (
                    <tr key={opt.id} className="hover:bg-subpanel">
                      <td className="py-2 text-primary font-semibold">{opt.instrument}</td>
                      <td className="py-2 text-muted">{opt.strike}</td>
                      <td className="py-2 text-primary">${spotPrice.toFixed(2)}</td>
                      <td className="py-2 text-primary">{opt.contracts}</td>
                      <td className="py-2 text-muted">{opt.premium}</td>
                      <td className="py-2 text-[#0ecb81] font-semibold">{opt.value}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onCloseOption(opt.id)}
                          className="px-2 py-0.5 bg-[#0ecb81] hover:opacity-90 text-[#080b11] font-bold text-[10px] rounded transition"
                        >
                          {t.close}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Options Ticket */}
      <aside className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-3 bg-panel p-3 font-sans overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-panel">
          <span className="font-bold text-primary text-xs">{t.optionTicket}</span>
          <span className="text-[10px] font-mono text-[#d97706] font-semibold">
            {currentMarket.base} ${selectedStrike.toLocaleString()} {boardSide}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted">
            <span>{t.contracts} ({currentMarket.base})</span>
            <span>
              {t.available}: <strong className="text-primary font-mono">{userBalance.toFixed(2)} USDC</strong>
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={contracts}
              onChange={(e) => setContracts(parseFloat(e.target.value) || 0)}
              className="w-full bg-subpanel border border-panel focus:border-[#d97706] rounded px-2.5 py-1.5 text-primary font-mono text-xs outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-muted font-mono text-[10px]">{currentMarket.base}</span>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-subpanel p-2.5 rounded border border-panel space-y-2 text-[11px] font-mono numeric">
          <div className="text-[10px] font-sans font-bold text-muted uppercase tracking-wider pb-1 border-b border-panel">
            {t.pricingRisk}
          </div>
          <div className="pt-1 space-y-1">
            <div className="flex justify-between text-muted">
              <span>{t.premiumCost}</span>
              <span className="text-primary font-bold text-xs">${totalCost.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-muted text-[10px]">
              <span>{t.breakeven}</span>
              <span className="text-[#f59e0b] font-semibold">${breakeven.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted text-[10px]">
              <span>{t.maxRisk}</span>
              <span className="text-muted">{t.maxRiskCapped}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (totalCost > userBalance) {
              if (onNotify) {
                onNotify('warning', t.insufficientFundsOptionsTitle, t.insufficientFundsOptionsMsg);
              }
              return;
            }
            onBuyOption(
              `${currentMarket.base}-$${selectedStrike.toLocaleString()}-${boardSide}`,
              selectedStrike,
              boardSide,
              contracts,
              totalCost
            );
          }}
          className="w-full py-2.5 bg-[#0ecb81] hover:opacity-90 text-[#080b11] font-bold text-xs rounded transition active:scale-98 shadow-sm"
        >
          {t.buyOptionAction.replace('{type}', boardSide)} (${totalCost.toFixed(2)} USDC)
        </button>
      </aside>
    </div>
  );
};
