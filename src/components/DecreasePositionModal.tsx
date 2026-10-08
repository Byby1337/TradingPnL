import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Info, Loader2 } from 'lucide-react';
import { Position } from '../types';

interface DecreasePositionModalProps {
  isOpen: boolean;
  position: Position | null;
  currentMarkPrice: number;
  currentLang: string;
  onClose: () => void;
  onConfirmDecrease: (positionId: string, percent: number, closeAmountUsd: number) => Promise<void>;
}

export const DecreasePositionModal: React.FC<DecreasePositionModalProps> = ({
  isOpen,
  position,
  currentMarkPrice,
  currentLang,
  onClose,
  onConfirmDecrease
}) => {
  if (!isOpen || !position) return null;

  const isRu = currentLang === 'ru';
  const decimals = position.entry > 1000 ? 2 : (position.entry > 1 ? 3 : 4);
  const mark = currentMarkPrice || position.entry;

  // Position total size in USD
  const totalSizeUsd = position.sizeCoins * mark;
  const initialMargin = position.margin;

  const [closeAmountUsd, setCloseAmountUsd] = useState<string>('');
  const [percent, setPercent] = useState<number>(0);
  const [keepLeverage, setKeepLeverage] = useState<boolean>(true);
  const [showExecutionDetails, setShowExecutionDetails] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset when modal opens for a new position
  useEffect(() => {
    setCloseAmountUsd('');
    setPercent(0);
    setIsSubmitting(false);
  }, [position?.id]);

  const handlePercentChange = (newPct: number) => {
    const clamped = Math.max(0, Math.min(100, newPct));
    setPercent(clamped);
    if (clamped === 0) {
      setCloseAmountUsd('');
    } else {
      const calcUsd = (totalSizeUsd * clamped) / 100;
      setCloseAmountUsd(calcUsd.toFixed(2));
    }
  };

  const handleAmountInputChange = (val: string) => {
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(val)) return;
    setCloseAmountUsd(val);
    const num = parseFloat(val);
    if (!num || isNaN(num) || totalSizeUsd <= 0) {
      setPercent(0);
    } else {
      const p = Math.min(100, (num / totalSizeUsd) * 100);
      setPercent(parseFloat(p.toFixed(1)));
    }
  };

  // Calculations for close preview
  const numAmount = parseFloat(closeAmountUsd) || 0;
  const validAmount = Math.min(totalSizeUsd, Math.max(0, numAmount));
  const effectivePct = totalSizeUsd > 0 ? (validAmount / totalSizeUsd) * 100 : 0;
  const fraction = Math.min(1, Math.max(0, effectivePct / 100));
  const isFullClose = fraction >= 0.999;

  // Closed coins & collateral
  const closedCoins = position.sizeCoins * fraction;
  const closedMargin = initialMargin * fraction;

  // PnL on closed portion
  const priceDiff = position.side === 'Long' ? mark - position.entry : position.entry - mark;
  const grossPnl = closedCoins * priceDiff;
  const notionalClosed = closedCoins * mark;
  const closeFee = notionalClosed * 0.00055;
  const netPnl = grossPnl - closeFee;
  const roe = closedMargin > 0 ? (netPnl / closedMargin) * 100 : 0;
  const isProfit = netPnl >= 0;

  // Total USDC to receive
  const receiveUsdc = Math.max(0, closedMargin + netPnl);

  // Liquidation price update
  const newLiqPriceText = isFullClose
    ? 'N/A'
    : `$${position.liqPrice.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  const handleSubmit = async () => {
    if (validAmount <= 0 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onConfirmDecrease(position.id, effectivePct, validAmount);
      onClose();
    } catch (e) {
      // error handled in caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="bg-panel border border-panel rounded-2xl w-full max-w-[420px] p-5 text-primary shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-panel">
          <h3 className="text-base font-semibold text-primary">
            Market: {position.side} {position.base}/USD Decrease
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-subpanel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Input Box */}
        <div className="mt-4 bg-subpanel border border-panel rounded-xl p-3.5 focus-within:border-amber-500 transition-colors">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1.5 flex justify-between">
            <span>{isRu ? 'Закрыть объем' : 'Close'}</span>
            <span className="text-muted">
              Max: ${totalSizeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={closeAmountUsd}
              onChange={(e) => handleAmountInputChange(e.target.value)}
              className="bg-transparent text-2xl font-bold font-mono text-primary outline-none w-full placeholder:text-muted/50"
            />
            <span className="text-sm font-bold text-muted ml-2 select-none">USD</span>
          </div>
        </div>

        {/* Slider & Quick Percentage Pill */}
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={percent}
                onChange={(e) => handlePercentChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono mt-1 select-none">
                <span onClick={() => handlePercentChange(0)} className="cursor-pointer hover:text-primary">0%</span>
                <span onClick={() => handlePercentChange(25)} className="cursor-pointer hover:text-primary">25%</span>
                <span onClick={() => handlePercentChange(50)} className="cursor-pointer hover:text-primary">50%</span>
                <span onClick={() => handlePercentChange(75)} className="cursor-pointer hover:text-primary">75%</span>
                <span onClick={() => handlePercentChange(100)} className="cursor-pointer hover:text-primary">100%</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="bg-subpanel border border-panel px-2 py-0.5 rounded text-[11px] font-mono text-primary">
                {percent.toFixed(1)}%
              </span>
              <button
                type="button"
                onClick={() => handlePercentChange(100)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-colors ${
                  percent === 100 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-subpanel hover:bg-panel text-primary border border-panel'
                }`}
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Keep Leverage Switch */}
        <div className="mt-4 flex items-center justify-between py-2 px-1">
          <span className="text-xs text-primary font-medium select-none">
            {isRu ? `Сохранять плечо ${position.leverage}x` : `Keep Leverage at ${position.leverage}x`}
          </span>
          <button
            type="button"
            onClick={() => setKeepLeverage(!keepLeverage)}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
              keepLeverage ? 'bg-amber-500' : 'bg-subpanel border border-panel'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                keepLeverage ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Button */}
        <div className="mt-3">
          {validAmount <= 0 ? (
            <button
              disabled
              className="w-full py-3.5 bg-subpanel text-muted border border-panel rounded-xl font-bold text-sm cursor-not-allowed select-none"
            >
              {isRu ? 'Введите сумму закрытия' : 'Enter an amount'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isRu
                  ? `${isFullClose ? 'Закрыть' : 'Уменьшить'} ${position.side} ${position.base}/USD`
                  : `${isFullClose ? 'Close' : 'Decrease'} ${position.side} ${position.base}/USD`}
              </span>
            </button>
          )}
        </div>

        {/* Summary Info Rows */}
        <div className="mt-4 pt-3 border-t border-panel space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">{isRu ? 'К получению' : 'Receive'}</span>
            <div className="flex items-center gap-1 font-mono">
              <span className="font-semibold text-primary">
                {receiveUsdc.toFixed(4)} USDC (${receiveUsdc.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">{isRu ? 'Цена ликвидации' : 'Liquidation Price'}</span>
            <span className="font-mono text-muted">
              ${position.liqPrice.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} → {newLiqPriceText}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted">{isRu ? 'Чистый PnL' : 'Net PnL'}</span>
            <span className={`font-mono font-semibold ${isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)} ({roe >= 0 ? '+' : ''}{roe.toFixed(2)}%)
            </span>
          </div>

          {/* Expandable Execution Details */}
          <div>
            <button
              type="button"
              onClick={() => setShowExecutionDetails(!showExecutionDetails)}
              className="w-full flex items-center justify-between text-muted hover:text-primary transition-colors py-1 select-none"
            >
              <span>{isRu ? 'Детали исполнения' : 'Execution Details'}</span>
              {showExecutionDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showExecutionDetails && (
              <div className="mt-1.5 p-2.5 bg-subpanel rounded-lg border border-panel space-y-1.5 text-[11px] font-mono text-muted">
                <div className="flex justify-between">
                  <span>{isRu ? 'Цена исполнения (Mark)' : 'Execution Mark Price'}</span>
                  <span className="text-primary">${mark.toFixed(decimals)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isRu ? 'Грязный PnL' : 'Gross PnL'}</span>
                  <span className={grossPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                    {grossPnl >= 0 ? '+' : ''}${grossPnl.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isRu ? 'Комиссия протокола (Taker)' : 'Trading Fee (Taker)'}</span>
                  <span className="text-[#f6465d]">-${closeFee.toFixed(2)} (0.055%)</span>
                </div>
                <div className="flex justify-between">
                  <span>{isRu ? 'Слиппедж' : 'Allowed Slippage'}</span>
                  <span>0.10%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Position Metrics Bar */}
        <div className="mt-4 pt-3 border-t border-panel flex items-center justify-between text-[11px] font-mono text-muted">
          <div>
            <div className="text-muted text-[10px] uppercase">{isRu ? 'Плечо' : 'Leverage'}</div>
            <div className="text-primary font-bold">{position.leverage}x</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">{isRu ? 'Размер' : 'Size'}</div>
            <div className="text-primary font-bold">
              ${totalSizeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted text-[10px] uppercase flex items-center justify-end gap-1">
              <span>{isRu ? 'Залог (USDC)' : 'Collateral (USDC)'}</span>
              <Info className="w-2.5 h-2.5 text-muted" />
            </div>
            <div className="text-primary font-bold">
              ${initialMargin.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
