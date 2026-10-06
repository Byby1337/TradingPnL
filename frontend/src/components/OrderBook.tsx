'use client';

import React from 'react';

export const OrderBook: React.FC = () => {
  const asks = [
    { price: '64,324.50', size: '1.240', total: '14.82', depth: 82 },
    { price: '64,323.00', size: '0.850', total: '13.58', depth: 58 },
    { price: '64,322.50', size: '2.100', total: '12.73', depth: 45 },
    { price: '64,322.00', size: '3.420', total: '10.63', depth: 35 },
    { price: '64,321.00', size: '5.260', total: '5.26', depth: 25 },
  ];

  const bids = [
    { price: '64,320.00', size: '4.180', total: '4.18', depth: 28 },
    { price: '64,319.50', size: '2.450', total: '6.63', depth: 42 },
    { price: '64,319.00', size: '3.120', total: '9.75', depth: 52 },
    { price: '64,318.50', size: '1.850', total: '11.60', depth: 64 },
    { price: '64,317.00', size: '2.900', total: '14.50', depth: 74 },
  ];

  return (
    <div className="bg-[#12171f] p-3 flex flex-col gap-1 font-mono text-[11px] tabular-nums select-none">
      <div className="flex justify-between items-center text-[#848e9c] pb-1 border-b border-[#1e2329] font-sans">
        <span className="font-semibold text-white text-xs">Order Book</span>
        <span className="text-[10px] text-[#848e9c]">Group: 0.50</span>
      </div>

      <div className="grid grid-cols-3 text-[#848e9c] text-[10px] pb-1">
        <span>Price (USDC)</span>
        <span className="text-right">Size (BTC)</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Red) */}
      <div className="space-y-[1px]">
        {asks.map((ask, idx) => (
          <div key={idx} className="relative grid grid-cols-3 py-[1px] px-1 hover:bg-[#181f2a]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10"
              style={{ width: `${ask.depth}%` }}
            />
            <span className="text-[#f6465d] z-10">{ask.price}</span>
            <span className="text-right text-[#eaecef] z-10">{ask.size}</span>
            <span className="text-right text-[#848e9c] z-10">{ask.total}</span>
          </div>
        ))}
      </div>

      {/* Mid Spread */}
      <div className="py-1 px-1 bg-[#181f2a] border-y border-[#1e2329] flex justify-between items-center text-[10px]">
        <span className="text-[#0ecb81] font-semibold">64,320.50</span>
        <span className="text-[#848e9c]">Spread: 0.50</span>
      </div>

      {/* Bids (Green) */}
      <div className="space-y-[1px]">
        {bids.map((bid, idx) => (
          <div key={idx} className="relative grid grid-cols-3 py-[1px] px-1 hover:bg-[#181f2a]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/10"
              style={{ width: `${bid.depth}%` }}
            />
            <span className="text-[#0ecb81] z-10">{bid.price}</span>
            <span className="text-right text-[#eaecef] z-10">{bid.size}</span>
            <span className="text-right text-[#848e9c] z-10">{bid.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
