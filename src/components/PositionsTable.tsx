import React, { useState } from 'react';
import { Position, TradeHistoryItem } from '../types';
import { MARKETS } from '../constants/markets';

interface PositionsTableProps {
  userAddress?: string | null;
  positions: Position[];
  tradeHistory: TradeHistoryItem[];
  currentPrice: number;
  marketPrices?: Record<string, number>;
  decimals: number;
  onClosePosition: (position: Position) => void;
  labels?: {
    positions?: string;
    openOrders?: string;
    tradeHistory?: string;
    symbol?: string;
    side?: string;
    size?: string;
    entryPrice?: string;
    markPrice?: string;
    liqPrice?: string;
    margin?: string;
    pnl?: string;
    action?: string;
    close?: string;
    noOpenPositions?: string;
    connectWalletToView?: string;
  };
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  userAddress,
  positions,
  tradeHistory,
  currentPrice,
  marketPrices,
  decimals,
  onClosePosition,
  labels
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  return (
    <div className="h-[220px] flex-shrink-0 bg-panel flex flex-col overflow-hidden border-t border-panel">
      {/* Dock Tabs Header */}
      <div className="h-8 border-b border-panel px-3 flex items-center justify-between text-[11px] flex-shrink-0 bg-panel">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActiveTab('positions')}
            className={`h-8 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'positions'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <span>{labels?.positions || 'Positions'}</span>
            <span className="px-1.5 bg-subpanel rounded text-[10px] text-[#0ecb81] font-mono">
              {userAddress ? positions.length : 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`h-8 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'orders'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <span>{labels?.openOrders || 'Open Orders'}</span>
            <span className="px-1.5 bg-subpanel rounded text-[10px] text-muted font-mono">0</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`h-8 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'history'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <span>{labels?.tradeHistory || 'Trade History'}</span>
            <span className="px-1.5 bg-subpanel rounded text-[10px] text-muted font-mono">
              {userAddress ? tradeHistory.length : 0}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {activeTab === 'positions' && (
          <table className="w-full text-left font-mono text-[11px] numeric">
            <thead>
              <tr className="text-muted border-b border-panel text-[10px] pb-1 font-sans">
                <th className="pb-1.5 font-normal">{labels?.symbol || 'Symbol'}</th>
                <th className="pb-1.5 font-normal">{labels?.side || 'Side'}</th>
                <th className="pb-1.5 font-normal">{labels?.size || 'Size'}</th>
                <th className="pb-1.5 font-normal">{labels?.entryPrice || 'Entry Price'}</th>
                <th className="pb-1.5 font-normal">{labels?.markPrice || 'Mark Price'}</th>
                <th className="pb-1.5 font-normal">{labels?.liqPrice || 'Liq Price'}</th>
                <th className="pb-1.5 font-normal">{labels?.margin || 'Margin'}</th>
                <th className="pb-1.5 font-normal">{labels?.pnl || 'PnL (ROE)'}</th>
                <th className="pb-1.5 font-normal text-right">{labels?.action || 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y border-panel">
              {!userAddress ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted font-sans text-xs">
                    {labels?.connectWalletToView || 'Please connect your Web3 wallet to view open positions.'}
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted font-sans text-xs">
                    {labels?.noOpenPositions || 'No open positions. Use the order ticket on the right to place a trade.'}
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const markPrice = (marketPrices && (marketPrices[pos.symbol] || marketPrices[`${pos.base}-PERP`] || marketPrices[pos.base])) || pos.entry;
                  const diff = pos.side === 'Long' ? markPrice - pos.entry : pos.entry - markPrice;
                  const pnl = diff * pos.sizeCoins;
                  const roe = (diff / pos.entry) * pos.leverage * 100;
                  const isProf = pnl >= 0;
                  const posDecimals = MARKETS[pos.symbol]?.decimals ?? (pos.symbol === 'DOGE-PERP' || pos.base === 'DOGE' ? 4 : 2);

                  return (
                    <tr key={pos.id} className="hover:bg-subpanel">
                      <td className="py-2 text-primary font-semibold flex items-center gap-1.5">
                        {MARKETS[pos.symbol]?.icon ? (
                          <img src={MARKETS[pos.symbol]?.icon} alt="" className="w-4 h-4 rounded-full object-contain" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold flex items-center justify-center">
                            {pos.base?.[0] || '•'}
                          </span>
                        )}
                        <span>{pos.symbol}</span>
                      </td>
                      <td className={`py-2 font-semibold ${pos.side === 'Long' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        {pos.side} {pos.leverage}x
                      </td>
                      <td className="py-2 text-primary">
                        {pos.sizeCoins.toFixed(6)} {pos.base}
                      </td>
                      <td className="py-2 text-muted">
                        ${pos.entry.toLocaleString('en-US', { minimumFractionDigits: posDecimals, maximumFractionDigits: posDecimals })}
                      </td>
                      <td className="py-2 text-primary">
                        ${markPrice.toLocaleString('en-US', { minimumFractionDigits: posDecimals, maximumFractionDigits: posDecimals })}
                      </td>
                      <td className="py-2 text-[#f59e0b]">${pos.liqPrice.toFixed(posDecimals)}</td>
                      <td className="py-2 text-muted">${pos.margin.toFixed(2)}</td>
                      <td className={`py-2 font-semibold ${isProf ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        {isProf ? '+' : ''}${pnl.toFixed(2)} ({isProf ? '+' : ''}{roe.toFixed(2)}%)
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onClosePosition(pos)}
                          className="px-2.5 py-1 bg-[#251d17] hover:bg-[#ff5c00] border border-[#3b2e23] hover:border-[#ff5c00] rounded text-[11px] font-semibold text-[#f5efe8] transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          {labels?.close || 'Close'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'orders' && (
          <div className="py-8 text-center text-muted font-sans text-xs">
            No active limit or trigger orders.
          </div>
        )}

        {activeTab === 'history' && (
          <table className="w-full text-left font-mono text-[11px] numeric">
            <thead>
              <tr className="text-muted border-b border-panel text-[10px] pb-1 font-sans">
                <th className="pb-1.5 font-normal">Time</th>
                <th className="pb-1.5 font-normal">Type</th>
                <th className="pb-1.5 font-normal">Instrument</th>
                <th className="pb-1.5 font-normal">Side</th>
                <th className="pb-1.5 font-normal">Size</th>
                <th className="pb-1.5 font-normal">Entry</th>
                <th className="pb-1.5 font-normal">Exit</th>
                <th className="pb-1.5 font-normal text-right">Realized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y border-panel">
              {!userAddress ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted font-sans text-xs">
                    Please connect your Web3 wallet to view trade history.
                  </td>
                </tr>
              ) : tradeHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted font-sans text-xs">
                    No closed trades recorded yet.
                  </td>
                </tr>
              ) : (
                tradeHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-subpanel">
                    <td className="py-2 text-muted">{item.timestamp}</td>
                    <td className="py-2 text-primary">{item.type}</td>
                    <td className="py-2 text-primary font-semibold">{item.instrument}</td>
                    <td className={`py-2 font-semibold ${item.side === 'Long' || item.side === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {item.side}
                    </td>
                    <td className="py-2 text-primary">{item.size}</td>
                    <td className="py-2 text-muted">{item.entry}</td>
                    <td className="py-2 text-primary">{item.exit}</td>
                    <td className={`py-2 text-right font-semibold ${item.pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
