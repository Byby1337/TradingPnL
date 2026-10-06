import React, { useState, useEffect } from 'react';
import { MARKETS } from '../constants/markets';
import { Position } from '../types';
import {
  Coins,
  Trophy,
  Clock,
  Users,
  Percent,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface HourlyPoolViewProps {
  userAddress: string | null;
  userBalance: number;
  positions: Position[];
  onNavigateToTrade?: () => void;
  labels?: {
    hourlyPool?: string;
    allPairs?: string;
    crypto?: string;
    stocks?: string;
    symbol?: string;
    positions?: string;
  };
}

interface Participant {
  id: string;
  address: string;
  pair: string;
  base: string;
  positionSizeUsdc: number;
  poolContributionUsdc: number;
  poolSharePct: number;
  estPayoutUsdc: number;
  timestamp: string;
  status: 'Active' | 'Locked';
  isUser?: boolean;
}



export const HourlyPoolView: React.FC<HourlyPoolViewProps> = ({
  userAddress,
  userBalance,
  positions,
  onNavigateToTrade,
  labels
}) => {
  const [selectedPair, setSelectedPair] = useState<string>('all');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const now = new Date();
    return (59 - now.getMinutes()) * 60 + (60 - now.getSeconds());
  });

  // Epoch countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          const now = new Date();
          return (59 - now.getMinutes()) * 60 + (60 - now.getSeconds());
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const [dbParticipants, setDbParticipants] = useState<Participant[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);

  // Fetch real participants from database
  useEffect(() => {
    let isMounted = true;
    const fetchDbParticipants = async () => {
      try {
        const res = await fetch(`/api/hourly-pool?pair=${selectedPair}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.participants)) {
            setDbParticipants(data.participants);
          }
        }
      } catch (err) {
        console.error('Error fetching hourly pool participants from DB:', err);
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    };

    fetchDbParticipants();
    const interval = setInterval(fetchDbParticipants, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedPair]);

  // Combine DB participants with user's local active positions if not yet indexed in DB
  const userParticipants: Participant[] = (userAddress && positions.length > 0)
    ? positions
        .filter((pos) => !dbParticipants.some((p) => p.id === pos.id || (p.address.toLowerCase() === userAddress.toLowerCase() && p.pair === pos.symbol)))
        .map((pos) => {
          const notional = pos.margin * pos.leverage;
          const contrib = pos.margin * 0.10; // 10% default routing
          return {
            id: `user-${pos.id}`,
            address: userAddress,
            pair: pos.symbol,
            base: pos.base,
            positionSizeUsdc: notional,
            poolContributionUsdc: contrib,
            poolSharePct: 0,
            estPayoutUsdc: contrib * 2.5,
            timestamp: pos.timestamp,
            status: 'Active',
            isUser: true
          };
        })
    : [];

  const allParticipants = [...dbParticipants, ...userParticipants];

  const filteredParticipants = allParticipants.filter((p) => {
    if (selectedPair === 'all') return true;
    return p.pair === selectedPair || p.base === selectedPair;
  });

  const rawPoolSize = filteredParticipants.reduce((sum, p) => sum + p.poolContributionUsdc, 0);
  const totalPoolSize = rawPoolSize;
  const activeParticipantsCount = filteredParticipants.length;

  const participantsWithShare = filteredParticipants.map((p) => {
    const share = totalPoolSize > 0 ? (p.poolContributionUsdc / totalPoolSize) * 100 : 0;
    return {
      ...p,
      poolSharePct: share,
      estPayoutUsdc: totalPoolSize > 0 ? totalPoolSize * 0.50 * (share / 100) : 0
    };
  });

  const userContribution = filteredParticipants
    .filter((p) => userAddress && p.address.toLowerCase() === userAddress.toLowerCase())
    .reduce((sum, p) => sum + p.poolContributionUsdc, 0);

  return (
    <div className="flex-1 bg-[#110d0a] text-[#f5efe8] p-4 lg:p-6 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#1c140d] via-[#221810] to-[#17100a] border border-[#3b2d22] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Epoch #{Math.floor(Date.now() / 3600000)} Live
                </span>
                <span className="text-muted text-xs font-mono">Arbitrum Sepolia</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                Hourly Sheriff Lottery Pool
                <Trophy className="w-6 h-6 text-amber-400" />
              </h1>
              <p className="text-muted text-xs max-w-2xl leading-relaxed">
                Часовая лотерея «Шериф часа»: 10%–20% PnL с закрытых прибыльных сделок покупают 1 билет Шерифа (правило: 1 кошелёк = 1 билет на пару, кулдаун победы 24ч). Победитель часа получает статус Шерифа и 0.01% с торгового оборота пары, а со сгоревших билетов: 50% возвращается трейдерам (Soft Loss), 25% уходит в Treasury и 25% аккумулируется в месячный SuperJackpot.
              </p>
            </div>

            {/* Countdown Badge & Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#140e0a]/80 p-4 rounded-xl border border-[#35271d]">
              <div className="flex items-center gap-3 pr-4 sm:border-r border-[#35271d]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Next Settlement In</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 tracking-wider">
                    {formatCountdown(secondsRemaining)}
                  </div>
                </div>
              </div>

              {onNavigateToTrade && (
                <button
                  onClick={onNavigateToTrade}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:brightness-110 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Trade to Participate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#31251b]">
            <div className="bg-subpanel/50 border border-panel rounded-xl p-3">
              <span className="text-muted text-[11px] block mb-1">Total Hourly Prize Pot</span>
              <span className="text-lg lg:text-xl font-bold font-mono text-amber-400">
                {activeParticipantsCount === 0 ? 'None' : `$${totalPoolSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
              </span>
            </div>

            <div className="bg-subpanel/50 border border-panel rounded-xl p-3">
              <span className="text-muted text-[11px] block mb-1">Participating Wallets</span>
              <span className="text-lg lg:text-xl font-bold font-mono text-primary flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted" />
                {activeParticipantsCount === 0 ? 'None' : activeParticipantsCount}
              </span>
            </div>

            <div className="bg-subpanel/50 border border-panel rounded-xl p-3">
              <span className="text-muted text-[11px] block mb-1">Sheriff (1 Winner) Payout</span>
              <span className="text-lg lg:text-xl font-bold font-mono text-[#0ecb81]">
                {activeParticipantsCount === 0 ? 'None' : `$${(totalPoolSize * 0.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
              </span>
            </div>

            <div className="bg-subpanel/50 border border-panel rounded-xl p-3">
              <span className="text-muted text-[11px] block mb-1">Your Active Routing</span>
              <span className="text-lg lg:text-xl font-bold font-mono text-primary">
                {userContribution > 0 ? `$${userContribution.toFixed(2)} USDC` : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Pair Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedPair('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              selectedPair === 'all'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'bg-subpanel text-muted hover:text-primary border border-panel'
            }`}
          >
            <span>{labels?.allPairs || 'All Pairs'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {allParticipants.length}
            </span>
          </button>

          {Object.values(MARKETS).map((m) => {
            const count = allParticipants.filter((p) => p.pair === m.ticker || p.base === m.base).length;
            const isSel = selectedPair === m.ticker || selectedPair === m.base;

            return (
              <button
                key={m.ticker}
                onClick={() => setSelectedPair(m.ticker)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                  isSel
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'bg-subpanel text-muted hover:text-primary border border-panel'
                }`}
              >
                {m.icon && (
                  <img src={m.icon} alt="" className="w-4 h-4 rounded-full object-contain" />
                )}
                <span>{m.base}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 font-mono">
                  {m.maxLeverage}x
                </span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-muted font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Participating Wallets Table */}
        <div className="bg-panel border border-panel rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-subpanel/30">
            <div>
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <span>Participating Wallets & Distributions</span>
                <span className="text-xs font-normal text-muted font-mono">
                  ({filteredParticipants.length} active entries)
                </span>
              </h2>
              <p className="text-[11px] text-muted">
                List of trader wallets currently contributing settlement PnL for {selectedPair === 'all' ? 'all markets' : selectedPair}.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <span className="w-2 h-2 rounded-full bg-[#0ecb81] animate-ping" />
              <span>Real-Time Epoch Sync</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs numeric">
              <thead>
                <tr className="text-muted border-b border-panel text-[11px] bg-subpanel/40 font-sans">
                  <th className="py-3 px-4 font-normal">Rank</th>
                  <th className="py-3 px-4 font-normal">Wallet Address</th>
                  <th className="py-3 px-4 font-normal">Trading Pair</th>
                  <th className="py-3 px-4 font-normal">Route Volume</th>
                  <th className="py-3 px-4 font-normal">Pool Share</th>
                  <th className="py-3 px-4 font-normal">PnL Contribution</th>
                  <th className="py-3 px-4 font-normal">Est. Payout</th>
                  <th className="py-3 px-4 font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-panel">
                {participantsWithShare.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center font-sans">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-muted">
                        <span className="font-mono text-sm font-bold text-amber-500/80">None</span>
                        <span className="text-xs">No active participants recorded in the database for this epoch.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  participantsWithShare.map((p, idx) => {
                    const isCurrentUser = userAddress && p.address.toLowerCase() === userAddress.toLowerCase();
                    const market = MARKETS[p.pair] || Object.values(MARKETS).find((m) => m.base === p.base);

                    return (
                      <tr
                        key={p.id}
                        className={`transition hover:bg-subpanel/70 ${
                          isCurrentUser ? 'bg-amber-500/10 border-l-2 border-amber-400' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4">
                          {idx === 0 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-[10px]">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-black font-extrabold flex items-center justify-center text-[10px]">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center text-[10px]">
                              3
                            </span>
                          ) : (
                            <span className="text-muted pl-2">#{idx + 1}</span>
                          )}
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={isCurrentUser ? 'text-amber-400 font-bold' : 'text-primary'}>
                              {p.address.slice(0, 6)}...{p.address.slice(-4)}
                            </span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                                YOU
                              </span>
                            )}
                            <button
                              onClick={() => handleCopy(p.address)}
                              className="p-1 hover:text-amber-400 text-muted transition"
                              title="Copy address"
                            >
                              {copiedAddress === p.address ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#0ecb81]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={`https://sepolia.arbiscan.io/address/${p.address}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:text-amber-400 text-muted transition"
                              title="View on Arbiscan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Pair with Logo & Max Leverage */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {market?.icon && (
                              <img
                                src={market.icon}
                                alt=""
                                className="w-5 h-5 rounded-full object-contain"
                              />
                            )}
                            <span className="text-primary font-semibold">{p.pair}</span>
                            {market && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                {market.maxLeverage}x
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Position Size */}
                        <td className="py-3.5 px-4 text-primary">
                          ${p.positionSizeUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDC
                        </td>

                        {/* Pool Share */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-subpanel rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${Math.min(100, p.poolSharePct * 3)}%` }}
                              />
                            </div>
                            <span className="font-bold text-amber-400">{p.poolSharePct.toFixed(1)}%</span>
                          </div>
                        </td>

                        {/* Contribution */}
                        <td className="py-3.5 px-4 text-[#0ecb81] font-semibold">
                          +${p.poolContributionUsdc.toFixed(2)} USDC
                        </td>

                        {/* Est Payout */}
                        <td className="py-3.5 px-4 text-amber-400 font-bold">
                          ${p.estPayoutUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
