'use client';

import React, { useState } from 'react';
import { Header, SectionType } from '../components/Header';
import { TradingViewChart } from '../components/TradingViewChart';
import { OrderBook } from '../components/OrderBook';
import { OrderTicket } from '../components/OrderTicket';
import { PositionsTable } from '../components/PositionsTable';
import { SheriffWidget } from '../components/SheriffWidget';
import { OptionsView } from '../components/OptionsView';
import { PoolsView } from '../components/PoolsView';
import { PortfolioView } from '../components/PortfolioView';

export default function TerminalPage() {
  const [activeSection, setActiveSection] = useState<SectionType>('perpetual');

  return (
    <div className="flex flex-col min-h-screen bg-[#080b11] text-[#eaecef]">
      {/* 1. Global Navigation Navbar (Arcus Style) */}
      <Header activeSection={activeSection} onSelectSection={setActiveSection} />

      {/* 2. Market Metrics Ribbon */}
      <div className="h-9 border-b border-[#1b2332] bg-[#0b0f17] px-4 flex items-center justify-between text-[11px] font-mono tabular-nums flex-shrink-0 select-none">
        <div className="flex items-center gap-5 overflow-x-auto">
          <div className="flex items-center gap-2 pr-4 border-r border-[#1b2332] cursor-pointer hover:opacity-80">
            <span className="font-bold text-white text-[12px] font-sans">BTC-PERP</span>
            <span className="text-[9px] text-[#828f9f]">▼</span>
          </div>

          <div>
            <span className="text-[#828f9f] text-[10px] mr-1">Mark:</span>
            <span className="text-[#0ecb81] font-semibold">64,320.50</span>
          </div>
          <div>
            <span className="text-[#828f9f] text-[10px] mr-1">Oracle:</span>
            <span className="text-white">64,319.80</span>
          </div>
          <div>
            <span className="text-[#828f9f] text-[10px] mr-1">24h Change:</span>
            <span className="text-[#0ecb81]">+3.42%</span>
          </div>
          <div>
            <span className="text-[#828f9f] text-[10px] mr-1">24h Vol:</span>
            <span className="text-white">$148.52M</span>
          </div>
          <div>
            <span className="text-[#828f9f] text-[10px] mr-1">Open Interest:</span>
            <span className="text-white">$82.14M</span>
          </div>
          <div>
            <span className="text-[#828f9f] text-[10px] mr-1">1h Funding:</span>
            <span className="text-[#f59e0b]">0.0100% in 27m</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-[10px] text-[#828f9f]">
          <div>
            Hourly Pool (0.01%): <span className="text-[#0ecb81] font-semibold">$14,850.00 USDC</span>
          </div>
          <div>
            Quorum: <span className="text-white font-semibold">42 / 50</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dynamic Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Section: Perpetual Futures */}
        {activeSection === 'perpetual' && (
          <div className="flex-1 grid grid-cols-12 gap-[1px] bg-[#1b2332] overflow-hidden">
            <section className="col-span-12 lg:col-span-9 flex flex-col gap-[1px] bg-[#1b2332] overflow-hidden">
              <div className="h-[490px]">
                <TradingViewChart />
              </div>
              <div className="flex-1 min-h-[210px]">
                <PositionsTable />
              </div>
            </section>

            <aside className="col-span-12 lg:col-span-3 flex flex-col gap-[1px] bg-[#1b2332] overflow-y-auto">
              <OrderTicket />
              <SheriffWidget />
              <OrderBook />
            </aside>
          </div>
        )}

        {/* Section: US 0DTE Options (Arcus Visual Payoff) */}
        {activeSection === 'options' && <OptionsView />}

        {/* Section: Pools & Vaults */}
        {activeSection === 'pools' && <PoolsView />}

        {/* Section: Portfolio */}
        {activeSection === 'portfolio' && <PortfolioView />}
      </main>
    </div>
  );
}
