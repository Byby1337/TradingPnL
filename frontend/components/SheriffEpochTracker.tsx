import React, { useState, useEffect } from 'react';

export const SheriffEpochTracker: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState<number>(1420);
  const [participantsCount, setParticipantsCount] = useState<number>(42);
  const quorumTarget = 50;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const quorumProgress = Math.min((participantsCount / quorumTarget) * 100, 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white max-w-md w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
          Лотерея • BTC/USDC
        </span>
        <span className="text-xs font-mono text-slate-400">Эпоха #482</span>
      </div>

      <h3 className="text-xl font-black text-white mb-2">Охота за «Шерифом часа»</h3>
      <p className="text-xs text-slate-400 mb-4">
        Победитель забирает чистые <strong>0.01% с торгового объема BTC/USDC</strong> за следующие 60 минут!
      </p>

      {/* Countdown Timer */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold">До закрытия раунда:</div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Приз раунда:</div>
          <div className="text-base font-bold text-emerald-400 font-mono">~$420.00 USDC</div>
        </div>
      </div>

      {/* Quorum Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium">Кворум для старта (Aegis Barrier):</span>
          <span className="font-bold text-amber-400">{participantsCount} / {quorumTarget} трейдеров</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${quorumProgress}%` }}
          ></div>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          {participantsCount >= quorumTarget
            ? '✓ Кворум набран! Розыгрыш состоится в конце часа.'
            : `Еще ${quorumTarget - participantsCount} квалифицированных трейдов до фиксации эпохи (иначе Rollover).`}
        </div>
      </div>

      {/* Active Sheriff Card */}
      <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
          👑
        </div>
        <div className="text-xs">
          <div className="font-bold text-white">Текущий Шериф: 0x8a...4b12</div>
          <div className="text-slate-400 text-[11px]">
            Trading Freeze активен (осталось 18 мин) • Заработано: <strong>$382.40 USDC</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
