import React, { useState } from 'react';
import { Market } from '../types';

interface OrderTicketProps {
  currentMarket: Market;
  currentPrice: number;
  userBalance: number;
  onExecuteOrder: (side: 'Long' | 'Short', margin: number, leverage: number) => void;
  onOpenDeposit?: () => void;
  onNotify?: (type: 'warning' | 'error' | 'info' | 'success', title: string, message: string) => void;
  labels?: {
    placeOrder?: string;
    buyLong?: string;
    sellShort?: string;
    orderMargin?: string;
    available?: string;
    leverage?: string;
    settlementRouting?: string;
    hourlyPoolRouting?: string;
    platformReserve?: string;
    traderPayout?: string;
    positionSize?: string;
    estLiqPrice?: string;
    takerFee?: string;
    insufficientMargin?: string;
  };
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  currentMarket,
  currentPrice,
  userBalance,
  onExecuteOrder,
  onOpenDeposit,
  onNotify,
  labels
}) => {
  const [side, setSide] = useState<'Long' | 'Short'>('Long');
  const [margin, setMargin] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(20);
  const [marginPct, setMarginPct] = useState<number>(0);
  const [poolSplit, setPoolSplit] = useState<number>(10);
  const [reserveSplit, setReserveSplit] = useState<number>(5);

  const numericMargin = parseFloat(margin) || 0;
  const positionSize = numericMargin * leverage;
  const liqPrice = currentPrice > 0
    ? side === 'Long'
      ? currentPrice * (1 - 0.9 / leverage)
      : currentPrice * (1 + 0.9 / leverage)
    : 0;

  const handleMarginChange = (valStr: string) => {
    setMargin(valStr);
    const val = parseFloat(valStr) || 0;
    if (userBalance > 0) {
      setMarginPct(Math.min(100, Math.max(0, Math.round((val / userBalance) * 100))));
    } else {
      setMarginPct(0);
    }
  };

  const handlePctChange = (pct: number) => {
    setMarginPct(pct);
    if (userBalance > 0 && pct > 0) {
      const calcVal = parseFloat(((userBalance * pct) / 100).toFixed(2));
      setMargin(calcVal.toString());
    } else {
      setMargin('');
    }
  };

  const handleExecute = () => {
    if (numericMargin <= 0) {
      if (onNotify) {
        onNotify('warning', labels?.placeOrder || 'Order Error', 'Please enter a margin amount greater than 0.');
      }
      return;
    }
    if (numericMargin > userBalance) {
      if (onNotify) {
        onNotify('warning', labels?.insufficientMargin || 'Insufficient Margin', `Insufficient available margin! You have $${userBalance.toFixed(2)} USDC available.`);
      }
      return;
    }
    onExecuteOrder(side, numericMargin, leverage);
  };

  return (
    <aside className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col gap-[1px] bg-panel overflow-y-auto border-r border-panel p-3 font-sans">
      <div className="flex justify-between items-center pb-2 border-b border-panel">
        <span className="font-bold text-primary text-xs">{labels?.placeOrder || 'Place Order'}</span>
      </div>

      {/* Long / Short Toggle */}
      <div className="grid grid-cols-2 gap-1.5 my-2">
        <button
          onClick={() => setSide('Long')}
          className={`py-1.5 font-bold text-xs rounded transition ${
            side === 'Long'
              ? 'bg-[#0ecb81] text-[#080b11]'
              : 'bg-subpanel text-muted hover:text-primary border border-panel'
          }`}
        >
          {labels?.buyLong || 'Buy / Long'}
        </button>
        <button
          onClick={() => setSide('Short')}
          className={`py-1.5 font-bold text-xs rounded transition ${
            side === 'Short'
              ? 'bg-[#f6465d] text-[#080b11]'
              : 'bg-subpanel text-muted hover:text-primary border border-panel'
          }`}
        >
          {labels?.sellShort || 'Sell / Short'}
        </button>
      </div>

      {/* Order Margin Input & Smooth Slider */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between items-center text-[11px] text-muted">
          <span>{labels?.orderMargin || 'Order Margin'}</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span>{labels?.available || 'Available'}: <strong className="text-primary">{userBalance.toFixed(2)} USDC</strong></span>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={margin}
            placeholder="0.00"
            onChange={(e) => handleMarginChange(e.target.value)}
            className="w-full bg-subpanel border border-panel focus:border-[#d97706] rounded px-2.5 py-1.5 text-primary font-mono text-xs outline-none"
          />
          <span className="absolute right-2.5 top-1.5 text-muted font-mono text-[10px]">USDC</span>
        </div>

        {/* Smooth Margin Slider with percentage directly on top */}
        <div className="pt-1.5 space-y-1">
          <div className="flex justify-end text-[11px]">
            <span className="font-mono text-primary font-bold">{marginPct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={marginPct}
            onChange={(e) => handlePctChange(parseInt(e.target.value) || 0)}
            className="w-full h-1 bg-subpanel rounded appearance-none cursor-pointer accent-[#d97706]"
          />
          <div className="flex justify-between text-[9px] font-mono text-muted px-0.5">
            {[0, 25, 50, 75, 100].map((p) => (
              <span
                key={p}
                onClick={() => handlePctChange(p)}
                className="cursor-pointer hover:text-primary"
              >
                {p}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Leverage Slider with 25x markers */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted">{labels?.leverage || 'Leverage'}</span>
          <span className="font-mono text-primary font-bold">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max={currentMarket.maxLeverage || 100}
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-1 bg-subpanel rounded appearance-none cursor-pointer accent-[#d97706]"
        />
        <div className="flex justify-between text-[9px] font-mono text-muted px-0.5">
          {[1, 25, 50, 75, 100].map((l) => (
            <span
              key={l}
              onClick={() => setLeverage(l)}
              className="cursor-pointer hover:text-primary"
            >
              {l}x
            </span>
          ))}
        </div>
      </div>

      {/* Programmable PnL Splits */}
      <div className="bg-subpanel border border-panel rounded p-2.5 space-y-2 text-[11px] mb-2">
        <div className="flex justify-between items-center text-muted">
          <span className="font-semibold text-primary">{labels?.settlementRouting || 'Settlement PnL Routing'}</span>
          <span className="text-[10px] text-muted font-mono">Dynamic Split</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted">
            <span>{labels?.hourlyPoolRouting || 'Hourly Pool (Min 10%):'}</span>
            <span className="font-mono text-primary font-semibold">{poolSplit}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={poolSplit}
            onChange={(e) => setPoolSplit(parseInt(e.target.value))}
            className="w-full h-1 bg-panel rounded appearance-none cursor-pointer accent-[#d97706]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted">
            <span>{labels?.platformReserve || '30-Day Reserve:'}</span>
            <span className="font-mono text-primary font-semibold">{reserveSplit}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="5"
            value={reserveSplit}
            onChange={(e) => setReserveSplit(parseInt(e.target.value))}
            className="w-full h-1 bg-panel rounded appearance-none cursor-pointer accent-[#d97706]"
          />
        </div>

        <div className="flex justify-between text-[10px] text-muted pt-1 border-t border-panel font-mono">
          <span>{labels?.traderPayout || 'Direct Wallet Payout:'}</span>
          <span className="text-[#0ecb81] font-semibold">{100 - poolSplit - reserveSplit}%</span>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1 text-[11px] font-mono text-muted numeric mb-3">
        <div className="flex justify-between">
          <span>{labels?.positionSize || 'Position Size'}:</span>
          <span className="text-primary">${positionSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
        </div>
        <div className="flex justify-between">
          <span>{labels?.estLiqPrice || 'Est. Liq Price'}:</span>
          <span className="text-[#f59e0b]">${liqPrice.toFixed(currentMarket.decimals)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>{labels?.takerFee || 'Taker Fee'}:</span>
          <span className="text-muted font-mono">0.055% (${(positionSize * 0.00055).toFixed(2)} USDC)</span>
        </div>
      </div>

      {userBalance <= 0 ? (
        <button
          type="button"
          disabled
          className="w-full py-2.5 font-bold text-xs rounded bg-subpanel text-muted border border-panel flex items-center justify-center cursor-not-allowed"
        >
          {labels?.insufficientMargin || 'Insufficient Trading Margin'}
        </button>
      ) : (
        <button
          onClick={handleExecute}
          className={`w-full py-2.5 font-bold text-xs rounded transition active:scale-98 shadow-sm ${
            side === 'Long'
              ? 'bg-[#0ecb81] hover:opacity-90 text-[#080b11]'
              : 'bg-[#f6465d] hover:opacity-90 text-[#080b11]'
          }`}
        >
          {side === 'Long' ? (labels?.buyLong || 'Buy / Long') : (labels?.sellShort || 'Sell / Short')} {currentMarket.base} ({leverage}x)
        </button>
      )}
    </aside>
  );
};
