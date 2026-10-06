import React, { useState, useEffect } from 'react';

export const OptionRocketWidget: React.FC = () => {
  const [spotPrice, setSpotPrice] = useState<number>(64250.0);
  const [activeOption, setActiveOption] = useState<{
    id: number;
    type: 'CALL' | 'PUT';
    strike: number;
    premium: number;
    currentPayout: number;
    timeRemainingSeconds: number;
    canEarlyCashOut: boolean;
  } | null>({
    id: 1042,
    type: 'CALL',
    strike: 64890.0,
    premium: 25.0, // $25 USDC
    currentPayout: 185.5, // Current profit in-the-money
    timeRemainingSeconds: 2140,
    canEarlyCashOut: true // American style early cash out active
  });

  const [cashedOut, setCashedOut] = useState<boolean>(false);

  // Simulate subtle Pyth Network price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotPrice((prev) => {
        const delta = (Math.random() - 0.48) * 15;
        const newPrice = parseFloat((prev + delta).toFixed(1));
        if (activeOption && !cashedOut) {
          const diff = Math.max(0, newPrice - activeOption.strike);
          const mult = (diff / activeOption.strike) * 100 * 3.5;
          const updatedPayout = parseFloat((activeOption.premium + activeOption.premium * mult).toFixed(2));
          setActiveOption((cur) => cur ? { ...cur, currentPayout: Math.min(updatedPayout, 500) } : null);
        }
        return newPrice;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [activeOption, cashedOut]);

  const handleCashOut = () => {
    setCashedOut(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
            US-Style American 0DTE
          </span>
          <h3 className="text-xl font-black text-white mt-1">BTC 1-Hour Rocket</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-mono">Pyth Spot:</div>
          <div className="text-sm font-bold font-mono text-emerald-400">${spotPrice.toLocaleString()}</div>
        </div>
      </div>

      {activeOption && !cashedOut ? (
        <div className="bg-gradient-to-b from-purple-950/40 to-slate-950/80 border border-purple-800/40 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center text-xs mb-2 text-slate-300">
            <span>Страйк: <strong className="text-white">${activeOption.strike.toLocaleString()}</strong></span>
            <span>Премия: <strong className="text-purple-300">${activeOption.premium} USDC</strong></span>
          </div>

          <div className="my-3 p-3 bg-purple-900/30 rounded-lg border border-purple-700/40 text-center">
            <div className="text-[11px] text-purple-300 uppercase tracking-wider font-semibold">
              Текущая прибыль к выводу:
            </div>
            <div className="text-3xl font-black text-emerald-400 my-1">
              +${activeOption.currentPayout.toFixed(2)} USDC
            </div>
            <div className="text-[11px] text-emerald-300 font-mono">
              ({((activeOption.currentPayout / activeOption.premium) * 100).toFixed(0)}% ROI • До 20x апсайд)
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-4">
            <span>Экспирация через: {Math.floor(activeOption.timeRemainingSeconds / 60)} мин</span>
            <span className="text-emerald-400 font-medium">● 0% Риск ликвидации</span>
          </div>

          {/* Instant Cash-Out Button */}
          <button
            onClick={handleCashOut}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            ⚡ ЗАБРАТЬ ПРИБЫЛЬ СЕЙЧАС (Instant Cash-Out)
          </button>
        </div>
      ) : cashedOut ? (
        <div className="p-5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center mb-4">
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-base font-bold text-white">Прибыль зафиксирована досрочно!</div>
          <p className="text-xs text-emerald-300 mt-1">
            +$185.50 USDC мгновенно начислены на ваш свободный баланс на Arbitrum One.
          </p>
        </div>
      ) : null}

      <div className="text-[11px] text-slate-500 text-center">
        Защищено Aegis Sentinel: T+1 Block Delay, 60s Min Hold, оракул Pyth Network.
      </div>
    </div>
  );
};
