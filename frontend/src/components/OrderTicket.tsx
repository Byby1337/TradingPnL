'use client';

import React, { useState } from 'react';

export const OrderTicket: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'perps' | 'options'>('perps');

  // Perps State
  const [perpSide, setPerpSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState<number>(20);
  const [marginAmount, setMarginAmount] = useState<string>('500');
  const [hourlyAllocation, setHourlyAllocation] = useState<number>(10);
  const [reserveAllocation, setReserveAllocation] = useState<number>(5);

  // Options State
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [optionExpiry, setOptionExpiry] = useState<'1h' | '4h' | '24h'>('1h');
  const [strikeOffset, setStrikeOffset] = useState<number>(0);
  const [optionContracts, setOptionContracts] = useState<string>('0.5');

  const btcPrice = 64320.5;
  const perpSize = (parseFloat(marginAmount || '0') * leverage).toFixed(2);
  const calculatedLiq =
    perpSide === 'long'
      ? (btcPrice * (1 - 0.9 / leverage)).toFixed(1)
      : (btcPrice * (1 + 0.9 / leverage)).toFixed(1);

  // Options Calculations
  const estimatedPremium = (
    parseFloat(optionContracts || '0') *
    (optionExpiry === '1h' ? 85 : optionExpiry === '4h' ? 140 : 260)
  ).toFixed(2);
  const maxPayout = (parseFloat(estimatedPremium) * 20).toFixed(2);

  return (
    <div className="bg-[#12171f] p-3 flex flex-col gap-3 font-sans text-xs select-none">
      {/* Switcher Tabs */}
      <div className="grid grid-cols-2 bg-[#181f2a] p-0.5 rounded border border-[#1e2329] text-[11px]">
        <button
          onClick={() => setActiveTab('perps')}
          className={`py-1 text-center font-semibold rounded transition ${
            activeTab === 'perps' ? 'bg-[#262d38] text-white' : 'text-[#848e9c] hover:text-white'
          }`}
        >
          Perpetuals
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`py-1 text-center font-semibold rounded transition ${
            activeTab === 'options' ? 'bg-[#262d38] text-white' : 'text-[#848e9c] hover:text-white'
          }`}
        >
          US 0DTE Options
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PERPETUALS FORM */}
      {/* ========================================================================= */}
      {activeTab === 'perps' && (
        <div className="flex flex-col gap-3">
          {/* Buy / Sell (Long / Short) */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setPerpSide('long')}
              className={`py-1.5 font-bold text-xs rounded transition ${
                perpSide === 'long'
                  ? 'bg-[#0ecb81] text-[#0b0e11]'
                  : 'bg-[#181f2a] text-[#848e9c] hover:text-white border border-[#1e2329]'
              }`}
            >
              Buy / Long
            </button>
            <button
              onClick={() => setPerpSide('short')}
              className={`py-1.5 font-bold text-xs rounded transition ${
                perpSide === 'short'
                  ? 'bg-[#f6465d] text-[#0b0e11]'
                  : 'bg-[#181f2a] text-[#848e9c] hover:text-white border border-[#1e2329]'
              }`}
            >
              Sell / Short
            </button>
          </div>

          {/* Order Type & Leverage Display */}
          <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
            <div className="flex gap-2">
              <span className="text-white font-semibold cursor-pointer">Market</span>
              <span className="hover:text-white cursor-pointer">Limit</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <span>Leverage:</span>
              <span className="text-white font-bold">{leverage}x</span>
            </div>
          </div>

          {/* Margin Input */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#848e9c]">
              <span>Collateral Margin</span>
              <span>Available: <strong className="text-white font-mono">12,450.00 USDC</strong></span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={marginAmount}
                onChange={(e) => setMarginAmount(e.target.value)}
                className="w-full bg-[#181f2a] border border-[#1e2329] focus:border-[#2b7fff] rounded px-2.5 py-1.5 text-white font-mono text-xs outline-none"
              />
              <span className="absolute right-2.5 top-1.5 text-[#848e9c] font-mono text-[10px]">USDC</span>
            </div>
          </div>

          {/* Leverage Range Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min="1"
              max="100"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full h-1 bg-[#1e2329] rounded appearance-none cursor-pointer accent-[#2b7fff]"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#848e9c]">
              <span>1x</span><span>25x</span><span>50x</span><span>75x</span><span>100x</span>
            </div>
          </div>

          {/* Programmable PnL Allocation Sub-Panel */}
          <div className="bg-[#181f2a] border border-[#1e2329] rounded p-2.5 space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-[#848e9c]">
              <span className="font-semibold text-white">Settlement PnL Split</span>
              <span className="text-[10px] text-[#0ecb81] font-mono">100% Margin Protected</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#848e9c]">
                <span>Hourly Pool Allocation (Min 10%):</span>
                <span className="font-mono text-white font-semibold">{hourlyAllocation}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={hourlyAllocation}
                onChange={(e) => setHourlyAllocation(Number(e.target.value))}
                className="w-full h-1 bg-[#262d38] rounded appearance-none cursor-pointer accent-[#2b7fff]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#848e9c]">
                <span>30-Day Reserve Allocation:</span>
                <span className="font-mono text-white font-semibold">{reserveAllocation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="5"
                value={reserveAllocation}
                onChange={(e) => setReserveAllocation(Number(e.target.value))}
                className="w-full h-1 bg-[#262d38] rounded appearance-none cursor-pointer accent-[#2b7fff]"
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#848e9c] pt-1 border-t border-[#1e2329] font-mono">
              <span>Direct Wallet Payout:</span>
              <span className="text-[#0ecb81] font-semibold">
                {100 - hourlyAllocation - reserveAllocation}%
              </span>
            </div>
          </div>

          {/* Order Summary Metrics */}
          <div className="space-y-1 text-[11px] font-mono text-[#848e9c] tabular-nums">
            <div className="flex justify-between">
              <span>Position Size:</span>
              <span className="text-white">${perpSize} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Liquidation Price:</span>
              <span className="text-[#f0b90b]">${calculatedLiq}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Execution Fee:</span>
              <span className="text-[#848e9c]">Taker 0.055% | Maker 0.00%</span>
            </div>
          </div>

          <button
            className={`w-full py-2 font-bold text-xs rounded transition ${
              perpSide === 'long'
                ? 'bg-[#0ecb81] hover:opacity-90 text-[#0b0e11]'
                : 'bg-[#f6465d] hover:opacity-90 text-[#0b0e11]'
            }`}
          >
            {perpSide === 'long' ? `Buy / Long BTC (${leverage}x)` : `Sell / Short BTC (${leverage}x)`}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* US 0DTE OPTIONS FORM */}
      {/* ========================================================================= */}
      {activeTab === 'options' && (
        <div className="flex flex-col gap-3">
          {/* Call / Put Selector */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setOptionType('call')}
              className={`py-1.5 font-bold text-xs rounded transition ${
                optionType === 'call'
                  ? 'bg-[#0ecb81] text-[#0b0e11]'
                  : 'bg-[#181f2a] text-[#848e9c] hover:text-white border border-[#1e2329]'
              }`}
            >
              Call Option
            </button>
            <button
              onClick={() => setOptionType('put')}
              className={`py-1.5 font-bold text-xs rounded transition ${
                optionType === 'put'
                  ? 'bg-[#f6465d] text-[#0b0e11]'
                  : 'bg-[#181f2a] text-[#848e9c] hover:text-white border border-[#1e2329]'
              }`}
            >
              Put Option
            </button>
          </div>

          {/* Expiry Duration */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#848e9c]">
              <span>Contract Expiry</span>
              <span className="text-white font-mono text-[10px]">American Exercise</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
              {[
                { id: '1h', label: '1 Hour' },
                { id: '4h', label: '4 Hours' },
                { id: '24h', label: '24 Hours' },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setOptionExpiry(exp.id as any)}
                  className={`py-1 rounded font-semibold text-center transition ${
                    optionExpiry === exp.id
                      ? 'bg-[#262d38] border border-white text-white'
                      : 'bg-[#181f2a] border border-[#1e2329] text-[#848e9c] hover:text-white'
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strike Selection */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#848e9c]">
              <span>Strike Price</span>
              <span>Spot: <strong className="text-white font-mono">${btcPrice.toLocaleString()}</strong></span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
              {[
                { offset: 0, label: 'ATM' },
                { offset: 1, label: '+1%' },
                { offset: 2, label: '+2%' },
                { offset: 5, label: '+5%' },
              ].map((item) => (
                <button
                  key={item.offset}
                  onClick={() => setStrikeOffset(item.offset)}
                  className={`py-1 rounded font-semibold transition ${
                    strikeOffset === item.offset
                      ? 'bg-[#262d38] border border-white text-white'
                      : 'bg-[#181f2a] border border-[#1e2329] text-[#848e9c] hover:text-white'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[9px] text-[#848e9c]">
                    ${Math.round(btcPrice * (1 + (optionType === 'call' ? 1 : -1) * item.offset * 0.01)).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contracts Input */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[#848e9c]">
              <span>Contracts (BTC)</span>
              <span>Pool Open Interest: <strong className="text-white font-mono">6.8% / 15% Cap</strong></span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={optionContracts}
                onChange={(e) => setOptionContracts(e.target.value)}
                className="w-full bg-[#181f2a] border border-[#1e2329] focus:border-[#2b7fff] rounded px-2.5 py-1.5 text-white font-mono text-xs outline-none"
              />
              <span className="absolute right-2.5 top-1.5 text-[#848e9c] font-mono text-[10px]">BTC</span>
            </div>
          </div>

          {/* Options Underwrite Metrics */}
          <div className="space-y-1 text-[11px] font-mono text-[#848e9c] bg-[#181f2a] p-2.5 rounded border border-[#1e2329] tabular-nums">
            <div className="flex justify-between">
              <span>Option Premium (Max Risk):</span>
              <span className="text-white font-semibold">${estimatedPremium} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Max Payout Cap (20x):</span>
              <span className="text-[#0ecb81] font-semibold">${maxPayout} USDC</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Liquidation Risk:</span>
              <span className="text-[#0ecb81]">None (Premium Capped)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Exercise Type:</span>
              <span className="text-white">American (earlyCashOut anytime)</span>
            </div>
          </div>

          <button
            className={`w-full py-2 font-bold text-xs rounded transition ${
              optionType === 'call'
                ? 'bg-[#0ecb81] hover:opacity-90 text-[#0b0e11]'
                : 'bg-[#f6465d] hover:opacity-90 text-[#0b0e11]'
            }`}
          >
            Purchase {optionExpiry.toUpperCase()} {optionType.toUpperCase()} (${estimatedPremium} USDC)
          </button>
        </div>
      )}
    </div>
  );
};
