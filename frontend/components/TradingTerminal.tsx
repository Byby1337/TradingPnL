import React from 'react';
import { PnLSliders } from './PnLSliders';
import { OptionRocketWidget } from './OptionRocketWidget';
import { SheriffEpochTracker } from './SheriffEpochTracker';

export const TradingTerminal: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-4 md:p-8 font-sans">
      {/* Navigation Header */}
      <header className="flex items-center justify-between flex-wrap gap-4 pb-6 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
            TP
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              TradingPnL <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-mono border border-blue-800">DEX 0DTE</span>
            </h1>
            <p className="text-xs text-slate-400">Orderly Network CLOB • Arbitrum One • Pyth Oracles</p>
          </div>
        </div>

        {/* Top Badges & User Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Aegis Sentinel: <strong className="text-emerald-400">АКТИВЕН</strong></span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300 font-mono">
            Баланс: <strong className="text-white">$1,450.00 USDC</strong>
          </div>

          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition">
            0x71...8e92 (Privy Session ✓)
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulated Orderly Chart & Order Placement (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chart Mockup */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl h-[420px] flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-white">BTC/USDC PERP</span>
                <span className="text-emerald-400 font-bold font-mono">$64,280.50 (+3.42%)</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Orderly CLOB • 24h Vol: $48.2M
              </div>
            </div>

            {/* Visual Canvas Area */}
            <div className="flex-1 my-4 bg-slate-950/70 border border-slate-800/60 rounded-xl flex items-center justify-center text-slate-500 text-xs">
              [ TradingView Advanced Charting with 'Sheriff Hour' & Liquidation markers ]
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition">
                КУПИТЬ / LONG (Orderly CLOB)
              </button>
              <button className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition">
                ПРОДАТЬ / SHORT (Orderly CLOB)
              </button>
            </div>
          </div>

          {/* Bottom Left: Sheriff Epoch Tracker */}
          <div className="flex justify-center">
            <SheriffEpochTracker />
          </div>
        </div>

        {/* Right Column: PnL Sliders & US 0DTE Option Rocket (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col items-center">
          {/* Programmable PnL Sliders */}
          <PnLSliders />

          {/* US-Style 0DTE Option Widget */}
          <OptionRocketWidget />
        </div>
      </main>
    </div>
  );
};
