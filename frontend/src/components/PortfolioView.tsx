'use client';

import React from 'react';

export const PortfolioView: React.FC = () => {
  return (
    <div className="flex-1 p-6 bg-[#080b11] overflow-y-auto font-mono text-[11px] select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-[#1b2332] pb-3 font-sans">
          <h1 className="text-lg font-bold text-white">Portfolio & Settlement Ledger</h1>
          <p className="text-xs text-[#828f9f]">
            Non-custodial margin balance, active option payouts, and Programmable PnL router history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 tabular-nums">
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-3">
            <div className="text-[#828f9f] text-[10px]">Net Equity</div>
            <div className="text-base font-bold text-white">$12,450.00 USDC</div>
          </div>
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-3">
            <div className="text-[#828f9f] text-[10px]">Unrealized PnL</div>
            <div className="text-base font-bold text-[#0ecb81]">+$621.92</div>
          </div>
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-3">
            <div className="text-[#828f9f] text-[10px]">Active Options Value</div>
            <div className="text-base font-bold text-[#00d2ff]">$628.70 USDC</div>
          </div>
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-3">
            <div className="text-[#828f9f] text-[10px]">Lottery Cooldown Guard</div>
            <div className="text-base font-bold text-[#0ecb81]">0 Wins / 24h (Eligible)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
