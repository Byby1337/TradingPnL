'use client';

import React from 'react';

export type SectionType = 'perpetual' | 'options' | 'pools' | 'portfolio' | 'security';

interface HeaderProps {
  activeSection: SectionType;
  onSelectSection: (section: SectionType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeSection, onSelectSection }) => {
  return (
    <header className="h-12 border-b border-[#1b2332] bg-[#0e131d] px-4 flex items-center justify-between text-[12px] flex-shrink-0 select-none">
      {/* Left: Brand + Navigation Menu (Arcus Style) */}
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div
          onClick={() => onSelectSection('perpetual')}
          className="flex items-center gap-2.5 font-bold tracking-tight text-white cursor-pointer"
        >
          <div className="w-6 h-6 bg-[#2b7fff] rounded flex items-center justify-center text-xs font-black text-white">
            23
          </div>
          <span className="text-[13px] tracking-tight font-black">
            23<span className="text-[#2b7fff]">TRADE</span>
          </span>
        </div>

        {/* Global Navigation Menu */}
        <nav className="flex items-center gap-1 font-medium text-[12px]">
          <button
            onClick={() => onSelectSection('perpetual')}
            className={`px-3 py-1.5 rounded transition ${
              activeSection === 'perpetual'
                ? 'text-white bg-[#131b27] border border-[#263145] font-semibold'
                : 'text-[#828f9f] hover:text-white'
            }`}
          >
            Perpetual
          </button>
          <button
            onClick={() => onSelectSection('options')}
            className={`px-3 py-1.5 rounded transition ${
              activeSection === 'options'
                ? 'text-white bg-[#131b27] border border-[#263145] font-semibold'
                : 'text-[#828f9f] hover:text-white'
            }`}
          >
            US 0DTE Options
          </button>
          <button
            onClick={() => onSelectSection('pools')}
            className={`px-3 py-1.5 rounded transition ${
              activeSection === 'pools'
                ? 'text-white bg-[#131b27] border border-[#263145] font-semibold'
                : 'text-[#828f9f] hover:text-white'
            }`}
          >
            Pools & Vaults
          </button>
          <button
            onClick={() => onSelectSection('portfolio')}
            className={`px-3 py-1.5 rounded transition ${
              activeSection === 'portfolio'
                ? 'text-white bg-[#131b27] border border-[#263145] font-semibold'
                : 'text-[#828f9f] hover:text-white'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => onSelectSection('security')}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              activeSection === 'security'
                ? 'text-white bg-[#131b27] border border-[#263145] font-semibold'
                : 'text-[#828f9f] hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81]"></span>
            <span>Security</span>
          </button>
        </nav>
      </div>

      {/* Right: Clean Web3 Wallet */}
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#131b27] border border-[#1b2332] rounded cursor-pointer hover:border-[#263145]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81]"></span>
          <span className="text-white font-semibold">0x3F9a...B821</span>
          <span className="text-[#0ecb81] font-semibold ml-1 tabular-nums">12,450.00 USDC</span>
        </div>
      </div>
    </header>
  );
};
