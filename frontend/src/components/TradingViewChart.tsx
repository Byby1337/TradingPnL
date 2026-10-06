'use client';

import React, { useEffect, useRef, useState } from 'react';

const TIMEFRAME_MAP: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
};

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [timeframe, setTimeframe] = useState<string>('15m');

  const renderWidget = (tf: string) => {
    const container = containerRef.current;
    if (typeof (window as any).TradingView !== 'undefined' && container) {
      container.innerHTML = '';
      new (window as any).TradingView.widget({
        autosize: true,
        symbol: 'COINBASE:BTCUSD',
        interval: TIMEFRAME_MAP[tf] || '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#080b11',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: container.id,
        backgroundColor: '#080b11',
        gridColor: '#131b27',
      });
    }
  };

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.onload = () => renderWidget(timeframe);
      document.head.appendChild(script);
    } else {
      renderWidget(timeframe);
    }
  }, [timeframe]);

  return (
    <div className="h-full bg-[#080b11] flex flex-col overflow-hidden relative">
      {/* Interactive Timeframe Bar */}
      <div className="h-8 border-b border-[#1b2332] px-3 bg-[#0e131d] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded transition ${
                timeframe === tf
                  ? 'text-white bg-[#263145] font-semibold'
                  : 'text-[#828f9f] hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Pure 100% TradingView Chart */}
      <div
        id="tradingview_chart_embed"
        ref={containerRef}
        className="flex-1 w-full h-[450px] bg-[#080b11]"
      />
    </div>
  );
};
