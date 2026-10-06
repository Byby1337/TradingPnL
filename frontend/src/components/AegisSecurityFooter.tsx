'use client';

import React from 'react';

export const AegisSecurityFooter: React.FC = () => {
  return (
    <footer className="h-6 border-t border-[#1e2329] bg-[#12171f] px-3 flex items-center justify-between font-mono text-[10px] text-[#848e9c] select-none tabular-nums flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81]"></span>
          <span className="text-white">Aegis Core:</span>
          <span className="text-[#0ecb81]">Online (7/7 Checks Passing)</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 border-l border-[#1e2329] pl-3">
          <span>Arbitrum:</span>
          <span className="text-white">128ms</span>
        </div>
        <div className="hidden md:flex items-center gap-1 border-l border-[#1e2329] pl-3">
          <span>Pyth Feed:</span>
          <span className="text-white">BTC/USD (0.32s)</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 border-l border-[#1e2329] pl-3">
          <span>Flash Guard:</span>
          <span className="text-white">T+1 Block Delay Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <span>Timelock:</span>
          <span className="text-white">48h Safe Multisig</span>
        </div>
        <div>
          <span>API:</span>
          <span className="text-[#0ecb81]">Connected (Orderly Network)</span>
        </div>
      </div>
    </footer>
  );
};
