'use client';

import React, { useState } from 'react';

export const PositionsTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'options' | 'perps' | 'tickets'>('options');
  const [cashoutSuccess, setCashoutSuccess] = useState<string | null>(null);

  const [options, setOptions] = useState([
    {
      id: 'OPT-8419',
      instrument: 'BTC-CALL-64500-1H',
      strike: '$64,500.00',
      spot: '$64,905.10',
      contracts: '1.20 BTC',
      premium: '$102.00',
      value: '$486.20',
      pnl: '+$384.20 (+376%)',
      expiry: '24m 18s',
    },
    {
      id: 'OPT-8422',
      instrument: 'ETH-CALL-3450-4H',
      strike: '$3,450.00',
      spot: '$3,478.50',
      contracts: '5.00 ETH',
      premium: '$85.00',
      value: '$142.50',
      pnl: '+$57.50 (+67.6%)',
      expiry: '2h 15m',
    },
  ]);

  const perps = [
    {
      symbol: 'BTC-PERP',
      side: 'Long 20x',
      size: '0.450 BTC',
      entryPrice: '$63,920.00',
      markPrice: '$64,320.50',
      liqPrice: '$61,043.60',
      margin: '$1,447.20',
      pnl: '+$180.22 (+12.45%)',
    },
    {
      symbol: 'SOL-PERP',
      side: 'Short 10x',
      size: '25.00 SOL',
      entryPrice: '$158.40',
      markPrice: '$155.10',
      liqPrice: '$172.65',
      margin: '$396.00',
      pnl: '+$82.50 (+20.83%)',
    },
  ];

  const tickets = [
    {
      roundId: 'EPOCH-184',
      pair: 'BTC-PERP',
      allocated: '$45.00 USDC',
      quorum: '42 / 50 Accounts (84%)',
      weight: '2.38%',
      pot: '$14,850.00 USDC',
      cooldown: 'Eligible (0 wins / 24h)',
    },
  ];

  const handleEarlyCashout = (optId: string) => {
    const target = options.find((o) => o.id === optId);
    if (!target) return;
    setCashoutSuccess(
      `Settled ${target.instrument} via Pyth oracle. ${target.value} credited to account (T+1 Block Succeeded).`
    );
    setOptions(options.filter((o) => o.id !== optId));
    setTimeout(() => setCashoutSuccess(null), 6000);
  };

  return (
    <div className="flex-1 min-h-[220px] bg-[#12171f] flex flex-col overflow-hidden select-none">
      {/* Dock Tabs Header */}
      <div className="h-8 border-b border-[#1e2329] px-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActiveTab('options')}
            className={`h-8 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'options'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-[#848e9c] hover:text-white'
            }`}
          >
            <span>US 0DTE Options</span>
            <span className="px-1 bg-[#181f2a] rounded text-[10px] text-[#0ecb81] font-mono">
              {options.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('perps')}
            className={`h-8 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'perps'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-[#848e9c] hover:text-white'
            }`}
          >
            <span>Positions</span>
            <span className="px-1 bg-[#181f2a] rounded text-[10px] text-white font-mono">
              {perps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`h-8 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'tickets'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-[#848e9c] hover:text-white'
            }`}
          >
            <span>Hourly Pool Allocations</span>
            <span className="px-1 bg-[#181f2a] rounded text-[10px] text-white font-mono">
              {tickets.length}
            </span>
          </button>
        </div>

        <div className="font-mono text-[10px] text-[#848e9c]">
          Settlement: <span className="text-white">Instant L2</span> (T+1 Flash Delay Armed)
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-2">
        {cashoutSuccess && (
          <div className="mb-2 px-3 py-1.5 bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded text-[#0ecb81] font-mono text-[11px] flex justify-between items-center">
            <span>{cashoutSuccess}</span>
            <button
              onClick={() => setCashoutSuccess(null)}
              className="text-[#848e9c] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Options Table */}
        {activeTab === 'options' && (
          <table className="w-full text-left font-mono text-[11px] tabular-nums">
            <thead>
              <tr className="text-[#848e9c] border-b border-[#1e2329] text-[10px] pb-1">
                <th className="pb-1.5 font-normal">Instrument</th>
                <th className="pb-1.5 font-normal">Strike</th>
                <th className="pb-1.5 font-normal">Spot (Pyth)</th>
                <th className="pb-1.5 font-normal">Contracts</th>
                <th className="pb-1.5 font-normal">Premium</th>
                <th className="pb-1.5 font-normal">Current Value</th>
                <th className="pb-1.5 font-normal">Unrealized PnL</th>
                <th className="pb-1.5 font-normal">Expiry</th>
                <th className="pb-1.5 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2329]">
              {options.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#848e9c]">
                    No active option positions.
                  </td>
                </tr>
              ) : (
                options.map((opt) => (
                  <tr key={opt.id} className="hover:bg-[#181f2a]/50">
                    <td className="py-2 text-white font-semibold">{opt.instrument}</td>
                    <td className="py-2 text-[#848e9c]">{opt.strike}</td>
                    <td className="py-2 text-[#eaecef]">{opt.spot}</td>
                    <td className="py-2 text-[#eaecef]">{opt.contracts}</td>
                    <td className="py-2 text-[#848e9c]">{opt.premium}</td>
                    <td className="py-2 text-[#0ecb81] font-semibold">{opt.value}</td>
                    <td className="py-2 text-[#0ecb81] font-semibold">{opt.pnl}</td>
                    <td className="py-2 text-[#f0b90b]">{opt.expiry}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleEarlyCashout(opt.id)}
                        className="px-2 py-0.5 bg-[#0ecb81] hover:opacity-90 text-[#0b0e11] font-bold text-[10px] rounded transition"
                      >
                        Early Cashout
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 2. Perps Table */}
        {activeTab === 'perps' && (
          <table className="w-full text-left font-mono text-[11px] tabular-nums">
            <thead>
              <tr className="text-[#848e9c] border-b border-[#1e2329] text-[10px] pb-1">
                <th className="pb-1.5 font-normal">Market</th>
                <th className="pb-1.5 font-normal">Side</th>
                <th className="pb-1.5 font-normal">Size</th>
                <th className="pb-1.5 font-normal">Entry Price</th>
                <th className="pb-1.5 font-normal">Mark Price</th>
                <th className="pb-1.5 font-normal">Liq. Price</th>
                <th className="pb-1.5 font-normal">Margin</th>
                <th className="pb-1.5 font-normal">PnL (ROE)</th>
                <th className="pb-1.5 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2329]">
              {perps.map((perp, idx) => (
                <tr key={idx} className="hover:bg-[#181f2a]/50">
                  <td className="py-2 text-white font-semibold">{perp.symbol}</td>
                  <td className="py-2">
                    <span className={perp.side.startsWith('Long') ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                      {perp.side}
                    </span>
                  </td>
                  <td className="py-2 text-[#eaecef]">{perp.size}</td>
                  <td className="py-2 text-[#848e9c]">{perp.entryPrice}</td>
                  <td className="py-2 text-[#eaecef]">{perp.markPrice}</td>
                  <td className="py-2 text-[#f0b90b]">{perp.liqPrice}</td>
                  <td className="py-2 text-[#eaecef]">{perp.margin}</td>
                  <td className="py-2 text-[#0ecb81] font-semibold">{perp.pnl}</td>
                  <td className="py-2 text-right">
                    <button className="px-2 py-0.5 bg-[#181f2a] hover:bg-[#262d38] border border-[#1e2329] rounded text-[10px] text-white">
                      Market Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 3. Tickets Table */}
        {activeTab === 'tickets' && (
          <table className="w-full text-left font-mono text-[11px] tabular-nums">
            <thead>
              <tr className="text-[#848e9c] border-b border-[#1e2329] text-[10px] pb-1">
                <th className="pb-1.5 font-normal">Round ID</th>
                <th className="pb-1.5 font-normal">Pair</th>
                <th className="pb-1.5 font-normal">Allocated PnL</th>
                <th className="pb-1.5 font-normal">Quorum (≥50)</th>
                <th className="pb-1.5 font-normal">Weight</th>
                <th className="pb-1.5 font-normal">Hourly Pot</th>
                <th className="pb-1.5 font-normal text-right">Anti-Sybil Cooldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2329]">
              {tickets.map((tkt, idx) => (
                <tr key={idx} className="hover:bg-[#181f2a]/50">
                  <td className="py-2 text-white font-semibold">{tkt.roundId}</td>
                  <td className="py-2 text-[#eaecef]">{tkt.pair}</td>
                  <td className="py-2 text-[#0ecb81]">{tkt.allocated}</td>
                  <td className="py-2 text-[#eaecef]">{tkt.quorum}</td>
                  <td className="py-2 text-[#848e9c]">{tkt.weight}</td>
                  <td className="py-2 text-[#0ecb81] font-semibold">{tkt.pot}</td>
                  <td className="py-2 text-right text-[#0ecb81]">{tkt.cooldown}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
