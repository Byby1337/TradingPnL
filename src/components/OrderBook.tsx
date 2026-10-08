import React, { useState } from 'react';
import { LiveTrade } from '../types';

interface OrderBookProps {
  midPrice: number;
  decimals: number;
  baseAsset: string;
  trades: LiveTrade[];
  bookWidth?: 'compact' | 'normal' | 'wide';
  onToggleBookWidth?: (w: 'compact' | 'normal' | 'wide') => void;
  colSpanClass?: string;
  labels?: {
    book?: string;
    trades?: string;
    price?: string;
    total?: string;
    spread?: string;
  };
}

export const OrderBook: React.FC<OrderBookProps> = ({
  midPrice,
  decimals,
  baseAsset,
  trades,
  bookWidth = 'normal',
  onToggleBookWidth,
  colSpanClass,
  labels
}) => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [depthRows, setDepthRows] = useState<number>(8);

  const spreadUnit = midPrice < 0.5 ? 0.0002 : midPrice < 2 ? 0.001 : midPrice < 20 ? 0.02 : midPrice < 200 ? 0.05 : 0.50;

  const rowIndices = Array.from({ length: depthRows }, (_, i) => i);
  const asks = rowIndices.map((i) => spreadUnit * (depthRows - i));
  const bids = rowIndices.map((i) => spreadUnit * (i + 1));

  return (
    <aside className={`${colSpanClass || 'col-span-12 md:col-span-6 lg:col-span-3'} flex flex-col gap-[1px] bg-panel overflow-y-auto p-3 font-mono text-[11px] numeric transition-all duration-200 border-l border-panel`}>
      {/* Tab Switcher & Width Controls */}
      <div className="flex justify-between items-center pb-2 border-b border-panel font-sans">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('book')}
            className={`text-xs pb-0.5 border-b-2 transition ${
              activeTab === 'book'
                ? 'font-bold text-primary border-primary'
                : 'font-semibold text-muted hover:text-primary border-transparent'
            }`}
          >
            {labels?.book || 'Book'}
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`text-xs pb-0.5 border-b-2 transition ${
              activeTab === 'trades'
                ? 'font-bold text-primary border-primary'
                : 'font-semibold text-muted hover:text-primary border-transparent'
            }`}
          >
            {labels?.trades || 'Trades'}
          </button>
        </div>

        {/* Dynamic Width & Depth Controls (Make Book bigger / smaller) */}
        <div className="flex items-center gap-2">
          {/* Depth row toggle */}
          <div className="flex items-center gap-1 text-[9px] font-mono text-muted">
            <span
              onClick={() => setDepthRows(depthRows === 6 ? 10 : depthRows === 10 ? 14 : 6)}
              className="cursor-pointer hover:text-amber-400 px-1 py-0.5 rounded bg-subpanel border border-panel"
              title="Toggle depth rows"
            >
              {depthRows}r
            </span>
          </div>

          {/* Width Size Switcher */}
          {onToggleBookWidth && (
            <div className="flex items-center gap-1 bg-subpanel px-1.5 py-0.5 rounded border border-panel text-[10px]">
              <button
                onClick={() => {
                  if (bookWidth === 'wide') onToggleBookWidth('normal');
                  else if (bookWidth === 'normal') onToggleBookWidth('compact');
                }}
                disabled={bookWidth === 'compact'}
                className="px-1 text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                title="Make Book narrower"
              >
                −
              </button>
              <span className="font-mono font-bold text-amber-400 uppercase text-[10px] px-1">
                {bookWidth === 'compact' ? 'S' : bookWidth === 'normal' ? 'M' : 'L'}
              </span>
              <button
                onClick={() => {
                  if (bookWidth === 'compact') onToggleBookWidth('normal');
                  else if (bookWidth === 'normal') onToggleBookWidth('wide');
                }}
                disabled={bookWidth === 'wide'}
                className="px-1 text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                title="Make Book wider"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col gap-1 pt-1">
          <div className="grid grid-cols-3 text-muted text-[10px] pb-1 font-sans">
            <span>{labels?.price || 'Price'}</span>
            <span className="text-right">Size ({baseAsset})</span>
            <span className="text-right">{labels?.total || 'Total'}</span>
          </div>

          {/* Asks (Sells) */}
          <div className="space-y-[1px]">
            {asks.map((d, i) => {
              const p = (midPrice + d).toFixed(decimals);
              const s = (0.0124 + i * 0.045).toFixed(6);
              const t = (parseFloat(s) * (midPrice + d)).toFixed(2);
              const depth = 20 + i * (60 / depthRows);
              return (
                <div key={i} className="relative grid grid-cols-3 py-[1px] px-1 hover:bg-subpanel">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10" style={{ width: `${depth}%` }} />
                  <span className="text-[#f6465d] z-10">{p}</span>
                  <span className="text-right text-primary z-10">{s}</span>
                  <span className="text-right text-muted z-10">${t}</span>
                </div>
              );
            })}
          </div>

          {/* Mid Price & Spread */}
          <div className="py-1 px-1 bg-subpanel border-y border-panel flex justify-between items-center text-[10px]">
            <span className="text-[#0ecb81] font-semibold">${midPrice.toFixed(decimals)}</span>
            <span className="text-muted">{labels?.spread || 'Spread'} ${spreadUnit.toFixed(decimals)}</span>
          </div>

          {/* Bids (Buys) */}
          <div className="space-y-[1px]">
            {bids.map((d, i) => {
              const p = (midPrice - d).toFixed(decimals);
              const s = (0.0155 + i * 0.052).toFixed(6);
              const t = (parseFloat(s) * (midPrice - d)).toFixed(2);
              const depth = 25 + i * (60 / depthRows);
              return (
                <div key={i} className="relative grid grid-cols-3 py-[1px] px-1 hover:bg-subpanel">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/10" style={{ width: `${depth}%` }} />
                  <span className="text-[#0ecb81] z-10">{p}</span>
                  <span className="text-right text-primary z-10">{s}</span>
                  <span className="text-right text-muted z-10">${t}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 pt-1">
          <div className="grid grid-cols-3 text-muted text-[10px] pb-1 font-sans">
            <span>{labels?.price || 'Price'}</span>
            <span className="text-right">Size ({baseAsset})</span>
            <span className="text-right">Time</span>
          </div>
          <div className="space-y-[1px] overflow-hidden max-h-[380px]">
            {trades.map((t, idx) => (
              <div key={idx} className="grid grid-cols-3 py-[1.5px] px-1 text-[10px] font-mono hover:bg-subpanel">
                <span className={t.side === 'buy' ? 'text-[#0ecb81] font-semibold' : 'text-[#f6465d] font-semibold'}>
                  ${t.price}
                </span>
                <span className="text-right text-primary">
                  {typeof t.size === 'number' ? t.size.toFixed(6) : t.size}
                </span>
                <span className="text-right text-muted">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
