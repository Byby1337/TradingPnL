'use client';

import React from 'react';

export const PoolsView: React.FC = () => {
  return (
    <div className="flex-1 p-6 bg-[#080b11] overflow-y-auto select-none font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-[#1b2332] pb-3">
          <h1 className="text-lg font-bold text-white">Underwriting Pools & Protocol Vaults</h1>
          <p className="text-xs text-[#828f9f]">
            Single-asset USDC underwriting pool for US 0DTE options and pair-isolated hourly lottery streams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pool 1: Option Underwriting LP Pool */}
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-4 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center font-sans border-b border-[#1b2332] pb-2">
              <span className="font-bold text-white text-xs">USDC Option LP Pool</span>
              <span className="text-[#0ecb81] bg-[#131b27] px-1.5 py-0.5 rounded text-[10px] border border-[#1b2332]">
                34.2% APR
              </span>
            </div>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between text-[#828f9f]">
                <span>Total Liquidity:</span> <span className="text-white font-bold">$2,450,000 USDC</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>Open Interest Utilization:</span> <span className="text-[#0ecb81]">6.8% / 15% Cap</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>Underwriting Yield:</span> <span className="text-white">Options Premium + House Edge</span>
              </div>
            </div>
            <button className="w-full py-1.5 bg-[#2b7fff] text-white font-bold text-xs rounded">
              Deposit USDC
            </button>
          </div>

          {/* Pool 2: Hourly Protocol Pool (BTC-PERP) */}
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-4 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center font-sans border-b border-[#1b2332] pb-2">
              <span className="font-bold text-white text-xs">Hourly Protocol Pool</span>
              <span className="text-[#f59e0b] bg-[#131b27] px-1.5 py-0.5 rounded text-[10px] border border-[#1b2332]">
                Epoch #184
              </span>
            </div>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between text-[#828f9f]">
                <span>Current Beneficiary:</span> <span className="text-white font-bold">0x71C8...a829</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>Accumulated Royalties:</span> <span className="text-[#0ecb81] font-bold">$14,850.00 USDC</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>Resolution Quorum:</span> <span className="text-white">42 / 50 Accounts (84%)</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>Anti-Wash Status:</span> <span className="text-[#f59e0b]">60m Freeze Active</span>
              </div>
            </div>
            <div className="w-full h-1 bg-[#1b2332] rounded">
              <div className="w-[84%] h-full bg-[#2b7fff] rounded"></div>
            </div>
          </div>

          {/* Pool 3: 30-Day Reserve Vault */}
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-4 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between items-center font-sans border-b border-[#1b2332] pb-2">
              <span className="font-bold text-white text-xs">30-Day Reserve Vault</span>
              <span className="text-[#a855f7] bg-[#131b27] px-1.5 py-0.5 rounded text-[10px] border border-[#1b2332]">
                10 Winners
              </span>
            </div>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between text-[#828f9f]">
                <span>Total Accumulated Vault:</span> <span className="text-white font-bold">$124,500.00 USDC</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>1st Place (35%):</span> <span className="text-white">$43,575.00 USDC</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>2nd Place (20%):</span> <span className="text-white">$24,900.00 USDC</span>
              </div>
              <div className="flex justify-between text-[#828f9f]">
                <span>3rd Place (15%):</span> <span className="text-white">$18,675.00 USDC</span>
              </div>
            </div>
            <div className="text-[10px] text-[#828f9f] text-center pt-1">
              + 7 runners-up receive 4.28% each ($5,335)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
