import React, { useState } from 'react';

interface InfoPageProps {
  type: 'privacy' | 'help';
  onBack: () => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({ type, onBack }) => {
  const [helpCategory, setHelpCategory] = useState<'all' | 'wallets' | 'perps' | 'options' | 'pools' | 'orders' | 'security'>('all');

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-subpanel hover:bg-panel border border-panel rounded-xl text-xs text-primary flex items-center gap-2 transition group shadow-sm font-sans"
            >
              <span className="text-amber-500 group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Trading</span>
            </button>
            <h1 className="text-xl md:text-2xl font-black text-primary font-sans tracking-tight">
              {type === 'privacy' ? 'Privacy Policy & Terms' : 'Help Center & Documentation'}
            </h1>
          </div>

          {type === 'privacy' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[11px] font-mono self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Last Updated: October 2, 2026</span>
            </div>
          )}
        </div>

        {/* PRIVACY POLICY PAGE */}
        {type === 'privacy' && (
          <div className="space-y-6 text-xs font-sans text-muted leading-relaxed">
            <div className="p-4 rounded-2xl bg-subpanel border border-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Protocol Legal Statement</span>
                <span className="text-[10px] font-mono text-muted">Version 2.4.0 (Production Release)</span>
              </div>
              <p className="text-primary text-[13px] font-medium leading-normal">
                23Trade operates as an institutional non-custodial decentralized exchange. We respect user privacy by design, enforcing mathematical pseudonymity with zero personal data collection.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">1</span>
                  <span>Non-Custodial Architecture & Self-Sovereignty</span>
                </div>
                <p>
                  23Trade is fully non-custodial. Users maintain exclusive control over their cryptographic private keys and assets at all times. When you connect via Web3 (MetaMask, Rabby, Coinbase Wallet, WalletConnect), smart contracts only receive isolated execution authorizations. We never hold, escrow, custody, or possess access to user seed phrases or wallet credentials.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">2</span>
                  <span>Zero Identity Verification (No KYC) & Pseudonymous Trading</span>
                </div>
                <p>
                  We do not collect names, residential addresses, government identification numbers, telephone contacts, or email addresses. All interactions are pseudonymous, verified exclusively through cryptographic signatures compliant with EIP-712 and EIP-1193 protocols. No centralized user profiling or behavioral tracking databases exist on our infrastructure.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">3</span>
                  <span>Public Ledger Immutability & On-Chain Transparency</span>
                </div>
                <p>
                  All executed perpetual fills, options settlements, margin allocations, and pool distributions are cryptographically committed to public blockchain networks (Arbitrum, Base, Ethereum). Public wallet addresses and transaction hashes recorded on-chain are inherently transparent and verifiable through public block explorers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">4</span>
                  <span>Local Client Storage & Cookies</span>
                </div>
                <p>
                  The interface only utilizes client-side browser storage (<code className="text-amber-400 font-mono">localStorage</code>) to preserve non-identifiable user preferences, specifically: selected display theme (dark/light), active chart timeframe, language preference, and recent interface volume toggles. We do not use third-party analytics pixels, behavioral tracking beacons, or invasive marketing cookies.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">5</span>
                  <span>Market Data Transmission & Oracle Feeds</span>
                </div>
                <p>
                  Price quotes, order book depth, and option Greeks are streamed directly via secure TLS WebSockets from institutional liquidity endpoints (Coinbase Institutional, Deribit, Pyth Network). Client requests do not pass through intermediary harvesting proxies.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">6</span>
                  <span>Risk Disclosures & Regulatory Exclusions</span>
                </div>
                <p>
                  Cryptocurrency perpetuals and zero-day options involve substantial risk of capital loss due to leverage. Users are solely responsible for ensuring compliance with applicable laws, tax regulations, and sanctions restrictions within their respective jurisdictions before deploying capital.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTION HELP CENTER */}
        {type === 'help' && (
          <div className="space-y-6 text-xs font-sans text-muted leading-relaxed">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-subpanel border border-panel rounded-2xl">
              {[
                { id: 'all', label: 'All Topics' },
                { id: 'wallets', label: '1. Wallet & Deposits' },
                { id: 'perps', label: '2. Perpetual Futures' },
                { id: 'options', label: '3. 0DTE Options' },
                { id: 'pools', label: '4. Liquidity & Vaults' },
                { id: 'orders', label: '5. Order Execution' },
                { id: 'security', label: '6. Risk & Security' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setHelpCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    helpCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                      : 'text-muted hover:text-primary hover:bg-panel'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Help Content Cards */}
            <div className="grid gap-4">
              {(helpCategory === 'all' || helpCategory === 'wallets') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">01</span>
                    <span>Non-Custodial Wallet Connection & Collateral Funding</span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>Supported Wallets:</strong> Connect seamlessly using MetaMask, Rabby, Coinbase Wallet, OKX Wallet, or any WalletConnect v2 provider.
                    </p>
                    <p>
                      <strong>Base Collateral:</strong> All perpetual contracts and option premiums are denominated and settled in <strong>USDC</strong>. To begin trading, ensure your connected wallet holds USDC and native gas tokens (e.g. ETH on Arbitrum or Base) for the initial smart contract approval.
                    </p>
                    <p>
                      <strong>Gasless Order Signing:</strong> Once your one-time USDC margin approval is granted, trade orders and cancellations are authenticated off-chain via standard <strong>EIP-712 cryptographic signatures</strong>, eliminating per-trade blockchain gas fees.
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'perps') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">02</span>
                    <span>Perpetual Contracts & Leverage Mechanics</span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>Available Markets:</strong> Trade crypto perpetuals (BTC-PERP, ETH-PERP up to 100x; SOL-PERP up to 50x; DOGE-PERP up to 20x) and tokenized equity indexes (NVDA-PERP, SPY-PERP, TSLA-PERP up to 20x).
                    </p>
                    <p>
                      <strong>Isolated Margin & Sliders:</strong> Each position is collateralized independently. Use the margin slider (with 25%, 50%, 75%, 100% quick presets) to dial your exact collateral size.
                    </p>
                    <p>
                      <strong>Index vs. Mark Price:</strong> To protect traders against malicious exchange wick liquidations, liquidation checks reference the median <em>Mark Price</em> calculated from multi-exchange index oracles (Coinbase, Binance, Pyth).
                    </p>
                    <p>
                      <strong>Dynamic Funding Rate:</strong> Funding payments occur every 8 hours between Longs and Shorts to tether perpetual contract prices to underlying spot indexes.
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'options') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">03</span>
                    <span>US 0DTE (Same-Day Expiration) Options Trading</span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>Directional View:</strong> Switch between <strong>Calls (Bullish ↗)</strong> and <strong>Puts (Bearish ↘)</strong> on the options trading board.
                    </p>
                    <p>
                      <strong>Live Pricing & Deribit Feeds:</strong> Option cards fetch real-time bid, ask, and mark premiums directly from Deribit institutional order flow.
                    </p>
                    <p>
                      <strong>Transparent Breakeven:</strong> Every strike card displays your exact breakeven spot price at expiry:
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel">Call Breakeven = Strike Price + Premium Paid</span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel mt-1 inline-block">Put Breakeven = Strike Price - Premium Paid</span>
                    </p>
                    <p>
                      <strong>Automatic Cash Settlement:</strong> Contracts expire daily at 08:00 UTC. In-the-money (ITM) options settle automatically into your USDC balance without requiring manual exercise or underlying token delivery.
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'pools') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">04</span>
                    <span>Liquidity Pools & Yield Vaults</span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>USDC Option LP Pool:</strong> Provides counterparty liquidity for options writers and traders. LPs earn trading fee cuts, bid-ask spreads, and option decay premiums.
                    </p>
                    <p>
                      <strong>30-Day Reserve Vault:</strong> Senior protocol backstop pool. Capital deposited into the Reserve Vault receives institutional yield shares distributed from platform liquidations and perpetual borrow interest.
                    </p>
                    <p>
                      <strong>Real-Time Yield:</strong> APRs reflect actual fee generation from settled protocol volume with 0 artificial inflationary mints.
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'orders') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">05</span>
                    <span>Order Types & Central Limit Order Book (CLOB)</span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>Market Orders:</strong> Fill immediately at the optimal available price on the order book. Taker fee: 0.05%.
                    </p>
                    <p>
                      <strong>Limit Orders:</strong> Enter passive orders at specified prices to capture maker fee discounts (Maker fee: 0.02%).
                    </p>
                    <p>
                      <strong>Order Book & Depth:</strong> The central book provides sub-second depth visualization. Inspect recent executions in the <strong>Trades</strong> tab directly beside the order ticket.
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'security') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">06</span>
                    <span>Audits, Multi-Sig Governance & Risk Parameters</span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>Smart Contract Security:</strong> Protocol contracts are immutable and audited by top tier security researchers. Emergency parameter adjustments require multi-signature approvals with a 48-hour timelock delay.
                    </p>
                    <p>
                      <strong>Liquidation Buffer:</strong> Automatic de-risking engines trigger before margin depletion, preventing protocol bad debt and ensuring solvent trader settlements under all market volatility conditions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
