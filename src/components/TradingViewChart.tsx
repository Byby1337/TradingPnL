import React, { useEffect, useRef } from 'react';
import { Market } from '../types';

interface TradingViewChartProps {
  currentMarket: Market;
  theme: string;
  interval: string;
  onIntervalChange: (tf: string) => void;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  currentMarket,
  theme,
  interval,
  onIntervalChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const sym = currentMarket.tvSymbol || 'COINBASE:BTCUSD';
    const currentThemeMode = theme === 'dark' ? 'dark' : 'light';
    const toolbarBg = theme === 'dark' ? '%2318130f' : '%23ffffff';

    const iframeUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${interval}&theme=${currentThemeMode}&style=1&timezone=Etc%2FUTC&locale=en&toolbar_bg=${toolbarBg}&hide_top_toolbar=1&hide_side_toolbar=1&allow_symbol_change=0&save_image=0&studies=%5B%22Volume%40tv-basicstudies%22%5D`;

    const iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowfullscreen', 'true');

    containerRef.current.appendChild(iframe);
  }, [currentMarket, theme, interval]);

  const intervals = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1H', value: '60' },
    { label: '4H', value: '240' },
    { label: '1D', value: 'D' }
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-panel overflow-hidden">
      {/* Timeframe Bar without redundant feed text */}
      <div className="h-8 border-b border-panel bg-panel px-3 flex items-center justify-between text-[11px] font-sans flex-shrink-0 z-10">
        <div className="flex items-center gap-1 font-mono">
          {intervals.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onIntervalChange(tf.value)}
              className={`px-2.5 py-0.5 rounded text-xs transition ${
                interval === tf.value
                  ? 'bg-subpanel text-primary font-bold'
                  : 'text-muted hover:text-primary hover:bg-subpanel font-semibold'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Chart */}
      <div className="flex-1 min-h-[320px] bg-panel overflow-hidden relative w-full">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
