import React, { useState } from 'react';

export interface PnLAllocationState {
  walletPercent: number;
  lotteryPercent: number;
  optionPercent: number;
  optionDirection: 'CALL' | 'PUT';
  optionHorizon: 'ONE_HOUR' | 'ZERO_DTE';
}

export const PnLSliders: React.FC = () => {
  const [wallet, setWallet] = useState<number>(60);
  const [lottery, setLottery] = useState<number>(20);
  const [option, setOption] = useState<number>(20);
  const [direction, setDirection] = useState<'CALL' | 'PUT'>('CALL');
  const [saved, setSaved] = useState<boolean>(false);

  const handleWalletChange = (newVal: number) => {
    setWallet(newVal);
    const remainder = 100 - newVal;
    setLottery(Math.floor(remainder / 2));
    setOption(remainder - Math.floor(remainder / 2));
    setSaved(false);
  };

  const handleLotteryChange = (newVal: number) => {
    const maxLottery = 100 - wallet;
    const clamped = Math.min(newVal, maxLottery);
    setLottery(clamped);
    setOption(100 - wallet - clamped);
    setSaved(false);
  };

  const savePreset = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
          Programmable PnL Sliders
        </h3>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
          Orderly + 0DTE
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-5">
        При исполнении Take-Profit тело маржи на 100% вернется на баланс, а профит распределится:
      </p>

      {/* Slider 1: Wallet */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-emerald-400 font-semibold">💰 На торговый баланс (USDC):</span>
          <span className="font-bold text-emerald-400">{wallet}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="90"
          value={wallet}
          onChange={(e) => handleWalletChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Slider 2: Lottery */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-amber-400 font-semibold">👑 В Лотерею «Шериф часа» (20% PnL):</span>
          <span className="font-bold text-amber-400">{lottery}%</span>
        </div>
        <input
          type="range"
          min="0"
          max={100 - wallet}
          value={lottery}
          onChange={(e) => handleLotteryChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Slider 3: 0DTE Options */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-purple-400 font-semibold">🚀 В 0DTE Опцион-Ракету:</span>
          <span className="font-bold text-purple-400">{option}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-lg overflow-hidden">
          <div className="bg-purple-500 h-full transition-all" style={{ width: `${option}%` }}></div>
        </div>
      </div>

      {/* Option direction toggle */}
      <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl mb-5">
        <div className="text-[11px] text-slate-400 mb-2 font-medium">Направление авто-опциона при закрытии перпа:</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDirection('CALL')}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              direction === 'CALL'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ▲ CALL (Pump Rocket)
          </button>
          <button
            onClick={() => setDirection('PUT')}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              direction === 'PUT'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ▼ PUT (Dump Rocket)
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={savePreset}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-blue-600/20 transition flex items-center justify-center gap-2"
      >
        {saved ? '✓ Пресет сохранен в Session Key' : 'Сохранить пресет распределения'}
      </button>
    </div>
  );
};
