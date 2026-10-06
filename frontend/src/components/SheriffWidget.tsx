'use client';

import React, { useState, useEffect } from 'react';

export const SheriffWidget: React.FC = () => {
  const [secondsRemaining, setSecondsRemaining] = useState(27 * 60 + 42);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="bg-[#12171f] p-3 flex flex-col gap-2 font-mono text-[11px] select-none">
      {/* Module Header */}
      <div className="flex justify-between items-center text-[#848e9c] pb-1 border-b border-[#1e2329]">
        <span className="font-sans font-semibold text-white text-xs">Hourly Protocol Pool</span>
        <span className="text-[#f0b90b] font-bold">{timeFormatted} remaining</span>
      </div>

      {/* Current Beneficiary Card */}
      <div className="bg-[#181f2a] p-2 rounded border border-[#1e2329] space-y-1 tabular-nums">
        <div className="flex justify-between text-[10px] text-[#848e9c]">
          <span>Current Beneficiary:</span>
          <span className="text-[#f0b90b]">Trading Frozen (60m)</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-white font-bold">0x71C8...a829</span>
          <span className="text-[#0ecb81] font-semibold">$14,850.00 USDC</span>
        </div>
      </div>

      {/* Resolution Quorum Progress */}
      <div className="space-y-1 tabular-nums">
        <div className="flex justify-between text-[10px] text-[#848e9c]">
          <span>Resolution Quorum:</span>
          <span className="text-white">42 / 50 Accounts (84%)</span>
        </div>
        <div className="w-full h-1 bg-[#1e2329] rounded">
          <div className="w-[84%] h-full bg-[#2b7fff] rounded"></div>
        </div>
        <div className="text-[9px] text-[#848e9c] leading-tight">
          Quorum ≥ 50 participants required to settle. Sub-quorum rolls over to subsequent epoch.
        </div>
      </div>

      {/* 30-Day Protocol Reserve */}
      <div className="bg-[#181f2a] p-2 rounded border border-[#1e2329] space-y-1 tabular-nums mt-1">
        <div className="flex justify-between text-[10px] text-[#848e9c]">
          <span>30-Day Reserve Vault:</span>
          <span className="text-[#2b7fff]">10 Recipients</span>
        </div>
        <div className="text-white font-bold text-sm">$124,500.00 USDC</div>
        <div className="grid grid-cols-3 gap-1 text-[9px] text-center pt-1 border-t border-[#1e2329] text-[#848e9c]">
          <div>1st: <span class="text-white">$43,575</span></div>
          <div>2nd: <span class="text-white">$24,900</span></div>
          <div>3rd: <span class="text-white">$18,675</span></div>
        </div>
      </div>
    </div>
  );
};
