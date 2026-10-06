'use client';

import React from 'react';

export const SecurityView: React.FC = () => {
  return (
    <div className="flex-1 p-6 bg-[#080b11] overflow-y-auto font-mono text-[11px] select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-[#1b2332] pb-3 font-sans">
          <h1 className="text-lg font-bold text-white">Aegis Sentinel Security Engine</h1>
          <p className="text-xs text-[#828f9f]">
            Real-time telemetry across all 7 protocol protection layers (GMX v2, Hyperliquid, Backpack, Orderly, Arcus).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-4 space-y-3">
            <span className="font-bold text-white font-sans text-xs">Oracle & Settlement Safeguards</span>
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between">
                <span>Pyth Network Pull Staleness:</span>
                <span className="text-[#0ecb81]">0.32s (Max 1.20s threshold)</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence Interval Guard:</span>
                <span className="text-white">±$3.80 (&lt;0.1% tolerance)</span>
              </div>
              <div className="flex justify-between">
                <span>T+1 Flash Loan Block Delay:</span>
                <span className="text-[#0ecb81]">Enforced (No intra-block cashout)</span>
              </div>
              <div className="flex justify-between">
                <span>Circuit Breaker Ceiling:</span>
                <span className="text-white">20x Maximum Payout Cap</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0e131d] border border-[#1b2332] rounded p-4 space-y-3">
            <span className="font-bold text-white font-sans text-xs">Access Control & Governance</span>
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between">
                <span>Safe Multisig Timelock:</span>
                <span className="text-white">48 Hours Delay Armed</span>
              </div>
              <div className="flex justify-between">
                <span>LP Pool Open Interest Cap:</span>
                <span className="text-[#0ecb81]">6.8% / 15.0% Limit</span>
              </div>
              <div className="flex justify-between">
                <span>Anti-Sybil Cooldown:</span>
                <span className="text-white">1 Win per 24h per Account</span>
              </div>
              <div className="flex justify-between">
                <span>Wash Trading Guard:</span>
                <span className="text-white">60m Trading Freeze on Beneficiary</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
