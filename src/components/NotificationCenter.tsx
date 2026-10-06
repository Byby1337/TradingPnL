import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../i18n/translations';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  rawError?: string;
  txHash?: string;
  isModal?: boolean;
  autoDismissMs?: number;
}

export interface Web3ParsedError {
  title: string;
  userMessage: string;
  rawDetails: string;
  isModalRecommended: boolean;
}

export function parseWeb3Error(err: any, lang: LanguageCode = 'ru'): Web3ParsedError {
  const isRu = lang === 'ru';
  let rawStr = '';

  if (typeof err === 'string') {
    rawStr = err;
  } else if (err && typeof err === 'object') {
    rawStr = err?.data?.message || err?.error?.message || err?.reason || err?.message || JSON.stringify(err);
  } else {
    rawStr = String(err || 'Unknown error');
  }

  const lower = rawStr.toLowerCase();

  // 1. Gas / Base Fee spike (max fee per gas less than block base fee)
  if (lower.includes('max fee per gas less than block base fee') || lower.includes('base fee') || lower.includes('underpriced')) {
    return {
      title: isRu ? 'Смена базовой комиссии газа' : 'Gas Price / Base Fee Spike',
      userMessage: isRu
        ? 'Базовая комиссия газа в сети Arbitrum выросла быстрее, чем кошелёк отправил транзакцию (baseFee > maxFeePerGas). Повторите попытку или выберите «Рыночный/Агрессивный» газ в MetaMask.'
        : 'Network base fee surged before the transaction was broadcast (baseFee > maxFeePerGas). Please retry the transaction or select a higher gas priority in your wallet.',
      rawDetails: rawStr,
      isModalRecommended: true
    };
  }

  // 2. User rejected transaction in wallet
  if (lower.includes('user rejected') || lower.includes('denied') || lower.includes('4001') || lower.includes('action_rejected')) {
    return {
      title: isRu ? 'Транзакция отменена' : 'Transaction Cancelled',
      userMessage: isRu
        ? 'Вы отклонили подтверждение транзакции в расширении кошелька.'
        : 'You cancelled or rejected the transaction request in your wallet extension.',
      rawDetails: rawStr,
      isModalRecommended: false
    };
  }

  // 3. Insufficient balance for gas or margin
  if (lower.includes('insufficient funds') || lower.includes('transfer amount exceeds balance')) {
    return {
      title: isRu ? 'Недостаточно средств' : 'Insufficient Funds',
      userMessage: isRu
        ? 'На балансе кошелька недостаточно средств (ETH для оплаты газа или USDC для залога маржи).'
        : 'Insufficient funds in wallet (ETH required for gas fee or USDC for order margin).',
      rawDetails: rawStr,
      isModalRecommended: true
    };
  }

  // 4. Contract revert
  if (lower.includes('execution reverted') || lower.includes('revert')) {
    return {
      title: isRu ? 'Транзакция отклонена' : 'Execution Reverted',
      userMessage: isRu
        ? 'Ошибка выполнения операции. Проверьте параметры сделки или повторите попытку.'
        : 'Transaction reverted. Please check parameters or retry.',
      rawDetails: rawStr,
      isModalRecommended: true
    };
  }

  // 5. Network / Chain ID mismatch
  if (lower.includes('chainid') || lower.includes('chain changed') || lower.includes('wrong network')) {
    return {
      title: isRu ? 'Неверная сеть блокчейна' : 'Wrong Blockchain Network',
      userMessage: isRu
        ? 'Пожалуйста, переключите сеть в кошельке на Arbitrum Sepolia (Chain ID: 421614).'
        : 'Please switch your wallet to Arbitrum Sepolia network (Chain ID: 421614).',
      rawDetails: rawStr,
      isModalRecommended: true
    };
  }

  // 6. Wallet Auth / Rate Limit Error
  if (lower.includes('wallet authentication failed') || lower.includes('too many requests') || lower.includes('429')) {
    return {
      title: isRu ? 'Ошибка авторизации сессии' : 'Session Authentication Error',
      userMessage: isRu
        ? 'Не удалось подтвердить вход в торговую сессию (возможно, кратковременно превышен лимит запросов). Подождите несколько секунд и повторите вход.'
        : 'Failed to verify wallet session (rate limit reached or signature rejected). Please wait a few seconds and try again.',
      rawDetails: rawStr,
      isModalRecommended: true
    };
  }

  // 6. Generic Fallback
  return {
    title: isRu ? 'Ошибка выполнения транзакции' : 'Transaction Failed',
    userMessage: isRu
      ? 'Не удалось завершить транзакцию на блокчейне. См. технические детали ниже.'
      : 'Failed to complete transaction on blockchain. See technical details below.',
    rawDetails: rawStr,
    isModalRecommended: true
  };
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  modalItem: NotificationItem | null;
  onDismissToast: (id: string) => void;
  onDismissModal: () => void;
  lang?: LanguageCode;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  modalItem,
  onDismissToast,
  onDismissModal,
  lang = 'ru'
}) => {
  const isRu = lang === 'ru';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [showModalRaw, setShowModalRaw] = useState(false);

  const handleCopy = (text: string, id: string, isModal = false) => {
    try {
      navigator.clipboard.writeText(text);
      if (isModal) {
        setModalCopied(true);
        setTimeout(() => setModalCopied(false), 2500);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {}
  };

  return (
    <>
      {/* Toast Stack in Bottom-Right Corner */}
      <aside aria-label="Notifications" className="fixed bottom-5 right-4 z-[9999] flex flex-col-reverse gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none">
        {notifications.map((item) => {
          const isError = item.type === 'error';
          const isSuccess = item.type === 'success';
          const isWarning = item.type === 'warning';

          const borderColor = isError
            ? 'border-red-500/50'
            : isSuccess
            ? 'border-emerald-500/50'
            : isWarning
            ? 'border-amber-500/50'
            : 'border-sky-500/50';

          const bgGradient = isError
            ? 'from-red-950/90 via-[#18130f]/95 to-[#18130f]/95'
            : isSuccess
            ? 'from-emerald-950/90 via-[#18130f]/95 to-[#18130f]/95'
            : isWarning
            ? 'from-amber-950/90 via-[#18130f]/95 to-[#18130f]/95'
            : 'from-sky-950/90 via-[#18130f]/95 to-[#18130f]/95';

          const badgeColor = isError
            ? 'bg-red-500/20 text-red-400 border-red-500/30'
            : isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : isWarning
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-sky-500/20 text-sky-400 border-sky-500/30';

          const badgeLabel = isError
            ? (isRu ? 'ОШИБКА' : 'FAILED')
            : isSuccess
            ? (isRu ? 'УСПЕШНО' : 'SUCCESS')
            : isWarning
            ? (isRu ? 'ВНИМАНИЕ' : 'WARNING')
            : (isRu ? 'ИНФО' : 'INFO');

          const isExpanded = expandedDetailsId === item.id;
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className={`pointer-events-auto bg-gradient-to-br ${bgGradient} ${borderColor} border rounded-lg p-3.5 shadow-2xl backdrop-blur-md transition-all duration-200 font-sans text-xs`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor} shrink-0`}>
                    {badgeLabel}
                  </span>
                  <span className="font-bold text-primary truncate text-[13px]">
                    {item.title}
                  </span>
                </div>
                <button
                  onClick={() => onDismissToast(item.id)}
                  className="text-muted hover:text-primary transition p-0.5 -mr-1"
                  title={isRu ? 'Закрыть' : 'Dismiss'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message */}
              <p className="text-[#d8cebe] leading-relaxed text-[12px] whitespace-pre-line mb-2">
                {item.message}
              </p>

              {/* Tx Hash Link */}
              {item.txHash && (
                <div className="mt-2 pt-2 border-t border-[#312720]/80 flex items-center justify-between text-[11px]">
                  <span className="text-muted font-mono">
                    Tx: {item.txHash.slice(0, 10)}...{item.txHash.slice(-8)}
                  </span>
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0ecb81] hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    <span>Arbiscan</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Raw Error Details Toggle */}
              {item.rawError && (
                <div className="mt-2 pt-2 border-t border-[#312720]/80">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedDetailsId(isExpanded ? null : item.id)}
                      className="text-[11px] text-muted hover:text-primary transition flex items-center gap-1 font-mono"
                    >
                      <span>{isExpanded ? (isRu ? '▼ Скрыть логи' : '▼ Hide logs') : (isRu ? '► Технические детали' : '► Tech details')}</span>
                    </button>
                    {isExpanded && (
                      <button
                        onClick={() => handleCopy(item.rawError!, item.id)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-mono transition"
                      >
                        {isCopied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Копировать' : 'Copy')}
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="mt-2 p-2 bg-[#0d0907] border border-[#312720] rounded font-mono text-[10px] text-red-300/90 break-all max-h-32 overflow-y-auto select-all">
                      {item.rawError}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* Cyberpunk Modal Dialog for Critical / On-chain Failures */}
      {modalItem && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#18130f] border border-red-500/50 rounded-xl shadow-[0_0_50px_rgba(246,70,93,0.25)] max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-red-950/60 to-[#18130f] border-b border-[#312720] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">
                    {modalItem.title}
                  </h3>
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                    {modalItem.type === 'error' ? 'EVM / RPC Failure' : 'Execution Notice'}
                  </span>
                </div>
              </div>
              <button
                onClick={onDismissModal}
                className="text-muted hover:text-primary transition p-1"
                title={isRu ? 'Закрыть' : 'Close'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4 text-xs">
              <p className="text-[#e2d8ca] text-[13px] leading-relaxed whitespace-pre-line">
                {modalItem.message}
              </p>

              {/* Raw Details Accordion */}
              {modalItem.rawError && (
                <div className="border border-[#312720] rounded-lg bg-[#110d0a]/80 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1c1612] border-b border-[#312720]/50">
                    <button
                      onClick={() => setShowModalRaw(!showModalRaw)}
                      className="text-[11px] font-mono text-muted hover:text-primary flex items-center gap-1.5 transition"
                    >
                      <span>{showModalRaw ? '▼' : '►'}</span>
                      <span>{isRu ? 'Детали вызова RPC' : 'Raw RPC Trace'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(modalItem.rawError!, modalItem.id, true)}
                      className="text-[11px] font-mono text-amber-400 hover:text-amber-300 transition"
                    >
                      {modalCopied ? (isRu ? 'Скопировано' : 'Copied') : (isRu ? 'Копировать трейс' : 'Copy trace')}
                    </button>
                  </div>
                  {showModalRaw && (
                    <pre className="p-3 font-mono text-[11px] text-red-300/90 whitespace-pre-wrap break-all max-h-48 overflow-y-auto select-all bg-[#0d0907]">
                      {modalItem.rawError}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#120e0b] border-t border-[#312720] flex items-center justify-end gap-2.5">
              {modalItem.rawError && (
                <button
                  onClick={() => handleCopy(modalItem.rawError!, modalItem.id, true)}
                  className="px-3.5 py-2 border border-[#312720] hover:border-muted text-muted hover:text-primary rounded text-xs font-medium transition"
                >
                  {modalCopied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Скопировать ошибку' : 'Copy Error')}
                </button>
              )}
              <button
                onClick={onDismissModal}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded text-xs transition shadow-lg active:scale-98"
              >
                {isRu ? 'Понятно' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
