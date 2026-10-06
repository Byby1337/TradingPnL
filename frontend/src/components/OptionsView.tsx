'use client';

import React, { useState } from 'react';

export const OptionsView: React.FC = () => {
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [optionExpiry, setOptionExpiry] = useState<'1h' | '4h' | '24h'>('1h');
  const [strikeOffset, setStrikeOffset] = useState<number>(0);
  const [optionContracts, setOptionContracts] = useState<string>('0.5');

  const [activeOptions, setActiveOptions] = useState([
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

  const [cashoutMsg, setCashoutMsg] = useState<string | null>(null);

  const btcPrice = 64320.5;
  const rate = optionExpiry === '1h' ? 85 : optionExpiry === '4h' ? 140 : 260;
  const premium = (parseFloat(optionContracts || '0') * rate).toFixed(2);
  const maxPayout = (parseFloat(premium) * 20).toFixed(2);

  const handleCashout = (id: string) => {
    const target = activeOptions.find((o) => o.id === id);
    if (!target) return;
    setActiveOptions(activeOptions.filter((o) => o.id !== id));
    setCashoutMsg(
      `Settled ${target.instrument} via Pyth oracle. ${target.value} credited to account.`
    );
    setTimeout(() => setCashoutMsg(null), 6000);
  };

  const handlePurchase = () => {
    const size = optionContracts || '0.5';
    const strike = Math.round(
      btcPrice * (1 + (optionType === 'call' ? 1 : -1) * strikeOffset * 0.01)
    );
    const newContract = {
      id: `OPT-${Math.floor(1000 + Math.random() * 9000)}`,
      instrument: `BTC-${optionType.toUpperCase()}-${strike}-${optionExpiry.toUpperCase()}`,
      strike: `$${strike.toLocaleString()}.00`,
      spot: `$${btcPrice.toFixed(2)}`,
      contracts: `${size} BTC`,
      premium: `$${premium}`,
      value: `$${premium}`,
      pnl: '+$0.00 (0.0%)',
      expiry: optionExpiry === '1h' ? '59m 59s' : optionExpiry === '4h' ? '3h 59m' : '23h 59m',
    };
    setActiveOptions([newContract, ...activeOptions]);
  };

  return (
    <div className="flex-1 grid grid-cols-12 gap-[1px] bg-[#1b2332] overflow-hidden select-none">
      {/* Left 9 Cols: Arcus Visual Payoff Curve Chart & Active Options */}
      <section className="col-span-12 lg:col-span-9 flex flex-col gap-[1px] bg-[#1b2332] overflow-hidden">
        {/* Arcus Payoff Diagram */}
        <div className="h-[460px] bg-[#0e131d] flex flex-col overflow-hidden">
          <div className="h-8 border-b border-[#1b2332] px-3 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white font-sans text-xs">
                BTC 0DTE American Option Payoff Curve
              </span>
              <span className="px-1.5 py-0.2 bg-[#131b27] border border-[#1b2332] text-[#00d2ff] rounded font-mono text-[10px]">
                Strike: $64,500 Call
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#828f9f]">
              Settlement: <span className="text-[#0ecb81]">earlyCashOut Anytime</span> | Max Loss:{' '}
              <span className="text-white">${premium}</span>
            </div>
          </div>

          <div className="flex-1 relative bg-[#080b11] p-4 flex flex-col justify-between overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 320">
              <line x1="0" y1="200" x2="800" y2="200" stroke="#1b2332" strokeWidth="1" />
              <line x1="400" y1="0" x2="400" y2="320" stroke="#1b2332" strokeDasharray="3,3" />

              <rect x="420" y="30" width="380" height="170" fill="#0ecb81" fillOpacity="0.05" />
              <rect x="0" y="200" width="420" height="40" fill="#f6465d" fillOpacity="0.05" />

              <path
                d="M 50 240 L 400 240 L 680 40 L 780 40"
                fill="none"
                stroke="#0ecb81"
                strokeWidth="2.5"
              />

              <line x1="400" y1="20" x2="400" y2="280" stroke="#00d2ff" strokeWidth="1" strokeDasharray="4,4" />
              <text x="405" y="60" fill="#00d2ff" fontFamily="monospace" fontSize="10" fontWeight="bold">
                Strike $64,500.00
              </text>

              <line x1="380" y1="20" x2="380" y2="280" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="310" y="100" fill="#f59e0b" fontFamily="monospace" fontSize="10" fontWeight="bold">
                Spot $64,320.50
              </text>

              <circle cx="420" cy="200" r="4" fill="#ffffff" />
              <text x="425" y="195" fill="#ffffff" fontFamily="monospace" fontSize="10">
                Breakeven: $64,585
              </text>

              <line x1="680" y1="40" x2="780" y2="40" stroke="#0ecb81" strokeWidth="1" strokeDasharray="2,2" />
              <text x="685" y="32" fill="#0ecb81" fontFamily="monospace" fontSize="10" fontWeight="bold">
                20x Circuit Breaker Cap (${maxPayout})
              </text>

              <text x="120" y="255" fill="#f6465d" fontFamily="monospace" fontSize="10">
                Max Risk: Premium Paid (${premium} USDC)
              </text>
            </svg>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1b2332] font-mono text-[11px] tabular-nums">
              <div><span className="text-[#828f9f]">Delta:</span> <span className="text-white font-semibold">+0.48</span></div>
              <div><span className="text-[#828f9f]">Implied Vol:</span> <span className="text-white font-semibold">54.2%</span></div>
              <div><span className="text-[#828f9f]">Intrinsic:</span> <span className="text-[#0ecb81] font-semibold">$0.00 (OTM)</span></div>
              <div><span className="text-[#828f9f]">Liquidation Risk:</span> <span className="text-[#0ecb81] font-semibold">0% (Zero)</span></div>
            </div>
          </div>
        </div>

        {/* Active Options Table */}
        <div className="flex-1 min-h-[240px] bg-[#0e131d] flex flex-col overflow-hidden">
          <div className="h-8 border-b border-[#1b2332] px-3 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-white">Active US 0DTE Option Positions</span>
            <span className="font-mono text-[10px] text-[#0ecb81]">
              American Settle (Instant Early Cashout via Pyth)
            </span>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {cashoutMsg && (
              <div className="mb-2 px-3 py-1.5 bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded text-[#0ecb81] font-mono text-[11px] flex justify-between items-center">
                <span>{cashoutMsg}</span>
                <button onClick={() => setCashoutMsg(null)} className="text-[#828f9f] hover:text-white">✕</button>
              </div>
            )}

            <table className="w-full text-left font-mono text-[11px] tabular-nums">
              <thead>
                <tr className="text-[#828f9f] border-b border-[#1b2332] text-[10px] pb-1">
                  <th className="pb-1.5 font-normal">Instrument</th>
                  <th className="pb-1.5 font-normal">Strike</th>
                  <th className="pb-1.5 font-normal">Spot (Pyth)</th>
                  <th className="pb-1.5 font-normal">Contracts</th>
                  <th className="pb-1.5 font-normal">Premium</th>
                  <th className="pb-1.5 font-normal">Current Value</th>
                  <th className="pb-1.5 font-normal">Unrealized PnL</th>
                  <th className="pb-1.5 font-normal">Expiry</th>
                  <th className="pb-1.5 font-normal text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2332]">
                {activeOptions.map((opt) => (
                  <tr key={opt.id} className="hover:bg-[#131b27]">
                    <td className="py-2 text-white font-semibold">{opt.instrument}</td>
                    <td className="py-2 text-[#828f9f]">{opt.strike}</td>
                    <td className="py-2 text-[#eaecef]">{opt.spot}</td>
                    <td className="py-2 text-[#eaecef]">{opt.contracts}</td>
                    <td className="py-2 text-[#828f9f]">{opt.premium}</td>
                    <td className="py-2 text-[#0ecb81] font-semibold">{opt.value}</td>
                    <td className="py-2 text-[#0ecb81] font-semibold">{opt.pnl}</td>
                    <td className="py-2 text-[#f59e0b]">{opt.expiry}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleCashout(opt.id)}
                        className="px-2 py-0.5 bg-[#0ecb81] hover:opacity-90 text-[#080b11] font-bold text-[10px] rounded transition"
                      >
                        Early Cashout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Right 3 Cols: Options Order Ticket */}
      <aside className="col-span-12 lg:col-span-3 flex flex-col gap-[1px] bg-[#1b2332] overflow-y-auto">
        <div className="bg-[#0e131d] p-3 flex flex-col gap-3 font-sans">
          <div className="flex justify-between items-center pb-1 border-b border-[#1b2332]">
            <span className="font-bold text-white text-xs">US 0DTE Options Terminal</span>
            <span className="text-[10px] font-mono text-[#00d2ff]">American Style</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setOptionType('call')}
              className={`py-1.5 font-bold text-xs rounded transition ${
                optionType === 'call'
                  ? 'bg-[#0ecb81] text-[#080b11]'
                  : 'bg-[#131b27] text-[#828f9f] hover:text-white border border-[#1b2332]'
              }`}
            >
              Call Option
            </button>
            <button
              onClick={() => setOptionType('put')}
              className={`py-1.5 font-bold text-xs rounded transition ${
                optionType === 'put'
                  ? 'bg-[#f6465d] text-[#080b11]'
                  : 'bg-[#131b27] text-[#828f9f] hover:text-white border border-[#1b2332]'
              }`}
            >
              Put Option
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#828f9f]">
              <span>Contract Duration</span>
              <span className="text-white font-mono text-[10px]">0DTE Intraday</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
              {(['1h', '4h', '24h'] as const).map((exp) => (
                <button
                  key={exp}
                  onClick={() => setOptionExpiry(exp)}
                  className={`py-1 rounded font-semibold text-center transition ${
                    optionExpiry === exp
                      ? 'bg-[#263145] border border-white text-white'
                      : 'bg-[#131b27] border border-[#1b2332] text-[#828f9f] hover:text-white'
                  }`}
                >
                  {exp === '1h' ? '1 Hour' : exp === '4h' ? '4 Hours' : '24 Hours'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#828f9f]">
              <span>Strike Price</span>
              <span>Spot: <strong className="text-white font-mono">${btcPrice.toLocaleString()}</strong></span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
              {[0, 1, 2, 5].map((off) => (
                <button
                  key={off}
                  onClick={() => setStrikeOffset(off)}
                  className={`py-1 rounded font-semibold transition ${
                    strikeOffset === off
                      ? 'bg-[#263145] border border-white text-white'
                      : 'bg-[#131b27] border border-[#1b2332] text-[#828f9f] hover:text-white'
                  }`}
                >
                  <div>{off === 0 ? 'ATM' : `+${off}%`}</div>
                  <div className="text-[9px] text-[#828f9f]">
                    ${Math.round(btcPrice * (1 + (optionType === 'call' ? 1 : -1) * off * 0.01)).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#828f9f]">
              <span>Contracts (BTC)</span>
              <span>LP Underwrite Cap: <strong className="text-white font-mono">15% Max OI</strong></span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={optionContracts}
                onChange={(e) => setOptionContracts(e.target.value)}
                className="w-full bg-[#131b27] border border-[#1b2332] focus:border-[#2b7fff] rounded px-2.5 py-1.5 text-white font-mono text-xs outline-none"
              />
              <span className="absolute right-2.5 top-1.5 text-[#828f9f] font-mono text-[10px]">BTC</span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-[#828f9f] bg-[#131b27] p-2.5 rounded border border-[#1b2332] tabular-nums">
            <div className="flex justify-between">
              <span>Premium (Max Loss):</span>
              <span className="text-white font-semibold">${premium} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Max Payoff (20x Cap):</span>
              <span className="text-[#0ecb81] font-semibold">${maxPayout} USDC</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Liquidation Margin Call:</span>
              <span className="text-[#0ecb81]">None (Zero Risk)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Settlement:</span>
              <span className="text-white">American (earlyCashOut)</span>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            className="w-full py-2 bg-[#0ecb81] hover:opacity-90 text-[#080b11] font-bold text-xs rounded transition"
          >
            Purchase {optionExpiry.toUpperCase()} {optionType.toUpperCase()} (${premium} USDC)
          </button>
        </div>
      </aside>
    </div>
  );
};
