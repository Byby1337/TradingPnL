import React, { useRef, useEffect, useState } from 'react';
import { TradeHistoryItem } from '../types';

interface PortfolioProps {
  userAddress: string | null;
  userBalance: number;
  tradeHistory: TradeHistoryItem[];
  theme: string;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  userAddress,
  userBalance,
  tradeHistory,
  theme
}) => {
  const [filter, setFilter] = useState<'all' | 'perps' | 'options'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalRealized = tradeHistory.reduce((acc, t) => acc + t.pnl, 0);
  const wins = tradeHistory.filter((t) => t.pnl > 0).length;
  const winRate = tradeHistory.length > 0 ? ((wins / tradeHistory.length) * 100).toFixed(0) : '0';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = theme === 'dark' ? '#221b16' : '#e2e8f0';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Flat straight horizontal line when disconnected OR 0 trades
    if (!userAddress || tradeHistory.length === 0) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.strokeStyle = userAddress ? '#10b981' : '#44372e';
      ctx.lineWidth = 2;
      if (!userAddress) ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    // Cumulative equity points from trades
    let cum = 0;
    const pts = [{ x: 0, pnl: 0 }];
    const reversed = [...tradeHistory].reverse();
    reversed.forEach((t, i) => {
      cum += t.pnl;
      pts.push({ x: (i + 1) / reversed.length, pnl: cum });
    });

    const maxP = Math.max(...pts.map((p) => p.pnl), 10);
    const minP = Math.min(...pts.map((p) => p.pnl), -10);
    const range = Math.max(maxP - minP, 1);

    const coords = pts.map((p) => ({
      x: p.x * w,
      y: h * 0.85 - ((p.pnl - minP) / range) * (h * 0.70)
    }));

    // Area
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) ctx.lineTo(coords[i].x, coords[i].y);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) ctx.lineTo(coords[i].x, coords[i].y);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dot
    const last = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(last.x - 2, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  }, [userAddress, tradeHistory, theme]);

  const filteredTrades = tradeHistory.filter((t) => {
    if (filter === 'perps') return t.type === 'Perpetual';
    if (filter === 'options') return t.type === '0DTE Option';
    return true;
  });

  return (
    <div className="flex-1 p-6 bg-panel overflow-y-auto font-mono text-[11px]">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-panel pb-3 font-sans flex justify-between items-end">
          <div>
            <h1 className="text-lg font-bold text-primary">Portfolio & Performance Analytics</h1>
            <p className="text-xs text-muted">Real-time balance tracking, flat equity curve, and verified trade settlements.</p>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-muted">Account:</span>
            <span className="text-primary font-semibold">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 numeric">
          <div className="bg-subpanel border border-panel rounded p-3">
            <div className="text-muted text-[10px]">Net Equity</div>
            <div className="text-base font-bold text-primary">${userBalance.toFixed(2)} USDC</div>
          </div>
          <div className="bg-subpanel border border-panel rounded p-3">
            <div className="text-muted text-[10px]">Realized PnL</div>
            <div className={`text-base font-bold ${totalRealized >= 0 ? 'text-[#0ecb81]' : 'text-[#ef4444]'}`}>
              {totalRealized >= 0 ? '+' : ''}${totalRealized.toFixed(2)}
            </div>
          </div>
          <div className="bg-subpanel border border-panel rounded p-3">
            <div className="text-muted text-[10px]">Win Rate</div>
            <div className="text-base font-bold text-[#0ecb81]">{winRate}%</div>
          </div>
          <div className="bg-subpanel border border-panel rounded p-3">
            <div className="text-muted text-[10px]">Total Closed Trades</div>
            <div className="text-base font-bold text-primary">{tradeHistory.length}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-subpanel border border-panel rounded p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center font-sans">
            <span className="font-bold text-primary text-xs">Portfolio Equity Curve</span>
            <span className="text-muted text-[10px] font-mono">Real Cumulative Settlements</span>
          </div>
          <div className="w-full h-44 relative bg-panel rounded border border-panel overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Trade History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-panel pb-2">
            <div className="flex gap-4 font-sans text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`pb-1 ${filter === 'all' ? 'font-bold text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
              >
                All Activity
              </button>
              <button
                onClick={() => setFilter('perps')}
                className={`pb-1 ${filter === 'perps' ? 'font-bold text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
              >
                Perpetual Futures
              </button>
              <button
                onClick={() => setFilter('options')}
                className={`pb-1 ${filter === 'options' ? 'font-bold text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}
              >
                US 0DTE Options
              </button>
            </div>
          </div>

          <table className="w-full text-left font-mono text-[11px] numeric">
            <thead>
              <tr className="text-muted border-b border-panel text-[10px] pb-1 font-sans">
                <th className="pb-1.5 font-normal">Timestamp</th>
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
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted font-sans text-xs">
                    No executed trades recorded yet. Open and close positions to see performance analytics.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t, idx) => (
                  <tr key={idx} className="hover:bg-subpanel">
                    <td className="py-2 text-muted">{t.timestamp}</td>
                    <td className="py-2 text-primary font-sans">{t.type}</td>
                    <td className="py-2 text-primary">{t.instrument}</td>
                    <td className="py-2 text-muted">{t.side}</td>
                    <td className="py-2 text-muted">{t.size}</td>
                    <td className="py-2 text-muted">{t.entry}</td>
                    <td className="py-2 text-primary">{t.exit}</td>
                    <td className={`py-2 text-right font-semibold ${t.pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#ef4444]'}`}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
