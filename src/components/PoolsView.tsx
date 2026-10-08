import React, { useState, useEffect } from 'react';
import {
  ARBITRUM_SEPOLIA_CHAIN_ID,
  ARBITRUM_SEPOLIA_HEX,
  ARBITRUM_SEPOLIA_PARAMS,
  CONTRACT_ADDRESSES
} from '../constants/contracts';
import {
  ShieldCheck,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { TRANSLATIONS, LanguageCode, Translations } from '../i18n/translations';

interface PoolsViewProps {
  userAddress?: string;
  onConnectWallet?: () => void;
  onRefreshBalance?: () => void;
  currentLang?: string;
}

export const PoolsView: React.FC<PoolsViewProps> = ({
  userAddress,
  onConnectWallet,
  onRefreshBalance,
  currentLang = 'en'
}) => {
  const t: Translations = TRANSLATIONS[(currentLang as LanguageCode) || 'en'] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  // Fixed immutable verified contract address (M-R3 security fix)
  const poolAddress = CONTRACT_ADDRESSES.LP_POOL;

  // Pool on-chain stats
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [availableLiquidity, setAvailableLiquidity] = useState<number>(0);
  const [totalLpShares, setTotalLpShares] = useState<number>(0);
  const [userLpShares, setUserLpShares] = useState<number>(0);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number>(0);
  const [allowance, setAllowance] = useState<number>(0);

  // Network & UI status
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [txState, setTxState] = useState<'idle' | 'approving' | 'depositing' | 'withdrawing'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isPoolMisconfigured, setIsPoolMisconfigured] = useState<boolean>(false);

  // Form values
  const [depositAmount, setDepositAmount] = useState<string>('10');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  const usdcAddress = CONTRACT_ADDRESSES.USDC;

  // Track chainId
  const checkChainId = async () => {
    if (typeof (window as any).ethereum === 'undefined') return;
    try {
      const hexChain = await (window as any).ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(hexChain, 16));
    } catch (e) {
      console.warn('Error reading chainId:', e);
    }
  };

  useEffect(() => {
    checkChainId();
    if (typeof (window as any).ethereum !== 'undefined') {
      const handleChainChanged = (cId: string) => {
        setChainId(parseInt(cId, 16));
        loadPoolData();
      };
      (window as any).ethereum.on('chainChanged', handleChainChanged);
      return () => {
        (window as any).ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Fetch real on-chain pool and user balances
  const loadPoolData = async () => {
    if (typeof (window as any).ethereum === 'undefined') return;
    setIsLoadingStats(true);
    setIsPoolMisconfigured(false);

    try {
      // 1. Fetch user USDC balance & allowance if wallet connected
      if (userAddress) {
        const paddedUser = userAddress.toLowerCase().replace('0x', '').padStart(64, '0');
        const paddedPool = poolAddress.toLowerCase().replace('0x', '').padStart(64, '0');

        // balanceOf(userAddress) -> selector 0x70a08231
        try {
          const balHex = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{ to: usdcAddress, data: '0x70a08231' + paddedUser }, 'latest']
          });
          if (balHex && balHex !== '0x') {
            setUserUsdcBalance(Number(BigInt(balHex)) / 1e6);
          }
        } catch (e) {
          console.warn('Failed to fetch USDC balance:', e);
        }

        // allowance(user, pool) -> selector 0xdd62ed3e
        try {
          const allowHex = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{ to: usdcAddress, data: '0xdd62ed3e' + paddedUser + paddedPool }, 'latest']
          });
          if (allowHex && allowHex !== '0x') {
            setAllowance(Number(BigInt(allowHex)) / 1e6);
          }
        } catch (e) {
          console.warn('Failed to fetch allowance:', e);
        }

        // user lpShares(userAddress) -> selector 0xc109a6dc
        try {
          const sharesHex = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{ to: poolAddress, data: '0xc109a6dc' + paddedUser }, 'latest']
          });
          if (sharesHex && sharesHex !== '0x') {
            setUserLpShares(Number(BigInt(sharesHex)) / 1e6);
          }
        } catch (e) {
          console.warn('Failed to fetch user LP shares:', e);
        }
      }

      // 2. Query pool contract: totalAssets() -> selector 0x01e1d114
      try {
        const assetsHex = await (window as any).ethereum.request({
          method: 'eth_call',
          params: [{ to: poolAddress, data: '0x01e1d114' }, 'latest']
        });
        if (assetsHex && assetsHex !== '0x') {
          setTotalAssets(Number(BigInt(assetsHex)) / 1e6);
        }
      } catch (err: any) {
        console.warn('Pool totalAssets call reverted:', err);
        setIsPoolMisconfigured(true);
      }

      // availableLiquidity() -> selector 0x74375359
      try {
        const availHex = await (window as any).ethereum.request({
          method: 'eth_call',
          params: [{ to: poolAddress, data: '0x74375359' }, 'latest']
        });
        if (availHex && availHex !== '0x') {
          setAvailableLiquidity(Number(BigInt(availHex)) / 1e6);
        }
      } catch (e) {}

      // totalLpShares() -> selector 0x0fd4f78d
      try {
        const totalSharesHex = await (window as any).ethereum.request({
          method: 'eth_call',
          params: [{ to: poolAddress, data: '0x0fd4f78d' }, 'latest']
        });
        if (totalSharesHex && totalSharesHex !== '0x') {
          setTotalLpShares(Number(BigInt(totalSharesHex)) / 1e6);
        }
      } catch (e) {}

    } catch (err) {
      console.error('Error loading pool data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadPoolData();
  }, [poolAddress, userAddress]);

  // Switch to Arbitrum Sepolia
  const handleSwitchNetwork = async () => {
    if (typeof (window as any).ethereum === 'undefined') return;
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA_HEX }]
      });
      await checkChainId();
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ARBITRUM_SEPOLIA_PARAMS]
          });
          await checkChainId();
        } catch (addError) {
          console.error('Failed to add Arbitrum Sepolia network:', addError);
        }
      }
    }
  };

  // Poll transaction receipt
  const waitForReceipt = async (txHash: string): Promise<any> => {
    const ethereum = (window as any).ethereum;
    for (let i = 0; i < 40; i++) {
      try {
        const receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
        if (receipt && receipt.blockNumber) {
          return receipt;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1500));
    }
    throw new Error('Transaction confirmation timed out.');
  };

  const getBufferedGasParams = async (txParams: { from: string; to: string; data: string }) => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return {};
      const gpHex = await ethereum.request({ method: 'eth_gasPrice' });
      const currentPrice = gpHex && gpHex !== '0x' ? BigInt(gpHex) : 100_000_000n;
      const priorityFee = 50_000_000n; // 0.05 Gwei
      const maxFee = (currentPrice * 200n) / 100n + priorityFee;

      const gasConfig: any = {
        maxFeePerGas: '0x' + maxFee.toString(16),
        maxPriorityFeePerGas: '0x' + priorityFee.toString(16)
      };

      try {
        const estHex = await ethereum.request({
          method: 'eth_estimateGas',
          params: [txParams]
        });
        if (estHex && estHex !== '0x') {
          const bufferedGas = (BigInt(estHex) * 125n) / 100n;
          gasConfig.gas = '0x' + bufferedGas.toString(16);
        }
      } catch {}

      return gasConfig;
    } catch {
      return {};
    }
  };

  // Step 1: Approve USDC
  const handleApprove = async () => {
    if (!userAddress) {
      onConnectWallet?.();
      return;
    }
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid deposit amount.' });
      return;
    }

    try {
      setTxState('approving');
      setStatusMessage({ type: 'info', text: 'Confirming USDC approval in your wallet...' });

      const paddedSpender = poolAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      // Exact allowance for the deposit amount (Audit Item 4)
      const amountUnits = BigInt(Math.floor(val * 1e6));
      const paddedAmount = amountUnits.toString(16).padStart(64, '0');
      const approveData = '0x095ea7b3' + paddedSpender + paddedAmount;

      const gasConfig = await getBufferedGasParams({ from: userAddress, to: usdcAddress, data: approveData });
      const tx = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: usdcAddress,
          data: approveData,
          ...gasConfig
        }]
      });

      setTxHash(tx);
      setStatusMessage({ type: 'info', text: `Approval broadcasted. Waiting for confirmation on Arbitrum...` });

      const receipt = await waitForReceipt(tx);
      if (receipt.status === '0x1' || receipt.status === 1) {
        setStatusMessage({ type: 'success', text: `USDC approved successfully! You can now proceed to Deposit.` });
        setAllowance(val);
      } else {
        throw new Error('Approval transaction failed on-chain.');
      }
    } catch (err: any) {
      console.error('Approval failed:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Approval failed or rejected by user.' });
    } finally {
      setTxState('idle');
    }
  };

  // Step 2: Deposit USDC
  const handleDeposit = async () => {
    if (!userAddress) {
      onConnectWallet?.();
      return;
    }
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid deposit amount.' });
      return;
    }
    if (val > userUsdcBalance) {
      setStatusMessage({ type: 'error', text: `Insufficient USDC balance (${userUsdcBalance.toFixed(2)} USDC available).` });
      return;
    }

    try {
      setTxState('depositing');
      setStatusMessage({ type: 'info', text: 'Confirming deposit transaction in your wallet...' });

      const amountUnits = BigInt(Math.floor(val * 1e6));
      const paddedAmount = amountUnits.toString(16).padStart(64, '0');
      // depositLP(uint256) selector: 0xeb37acfc
      const depositData = '0xeb37acfc' + paddedAmount;

      const gasConfig = await getBufferedGasParams({ from: userAddress, to: poolAddress, data: depositData });
      const tx = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: poolAddress,
          data: depositData,
          ...gasConfig
        }]
      });

      setTxHash(tx);
      setStatusMessage({ type: 'info', text: `Deposit transaction submitted: ${tx.slice(0, 10)}... Waiting for block confirmation...` });

      const receipt = await waitForReceipt(tx);
      if (receipt.status === '0x1' || receipt.status === 1) {
        setStatusMessage({
          type: 'success',
          text: `Successfully deposited ${val.toFixed(2)} USDC into Option Underwriting Pool!`
        });
        setDepositAmount('');
        await loadPoolData();
        onRefreshBalance?.();
      } else {
        throw new Error('Deposit transaction reverted on Arbitrum.');
      }
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Deposit transaction reverted or rejected.' });
    } finally {
      setTxState('idle');
    }
  };

  // Withdraw LP shares
  const handleWithdraw = async () => {
    if (!userAddress) {
      onConnectWallet?.();
      return;
    }
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid withdraw amount.' });
      return;
    }

    const maxUsdcWithdrawable = totalLpShares > 0 ? (userLpShares * totalAssets) / totalLpShares : userLpShares;
    if (val > maxUsdcWithdrawable) {
      setStatusMessage({ type: 'error', text: `Exceeds your deposited balance (${maxUsdcWithdrawable.toFixed(2)} USDC).` });
      return;
    }

    try {
      setTxState('withdrawing');
      setStatusMessage({ type: 'info', text: 'Confirming withdrawal in your wallet...' });

      // Calculate shares to burn
      const sharesToBurn = totalAssets > 0 ? (val * totalLpShares) / totalAssets : val;
      const sharesUnits = BigInt(Math.floor(sharesToBurn * 1e6));
      const paddedShares = sharesUnits.toString(16).padStart(64, '0');
      // withdrawLP(uint256) selector: 0xe4456ecb
      const withdrawData = '0xe4456ecb' + paddedShares;

      const gasConfig = await getBufferedGasParams({ from: userAddress, to: poolAddress, data: withdrawData });
      const tx = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAddress,
          to: poolAddress,
          data: withdrawData,
          ...gasConfig
        }]
      });

      setTxHash(tx);
      setStatusMessage({ type: 'info', text: `Withdrawal broadcasted. Waiting for confirmation...` });

      const receipt = await waitForReceipt(tx);
      if (receipt.status === '0x1' || receipt.status === 1) {
        setStatusMessage({
          type: 'success',
          text: `Successfully withdrew ${val.toFixed(2)} USDC to your wallet!`
        });
        setWithdrawAmount('');
        await loadPoolData();
        onRefreshBalance?.();
      } else {
        throw new Error('Withdrawal reverted.');
      }
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Withdrawal failed or rejected.' });
    } finally {
      setTxState('idle');
    }
  };

  const isArbitrum = chainId === ARBITRUM_SEPOLIA_CHAIN_ID || chainId === 42161;
  const userUsdcDeposited = totalLpShares > 0 ? (userLpShares * totalAssets) / totalLpShares : userLpShares;
  const parsedDeposit = parseFloat(depositAmount) || 0;
  const needsApproval = allowance < parsedDeposit;

  return (
    <div className="flex-1 p-4 md:p-6 bg-panel text-primary overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-panel gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-primary tracking-wide">{t.liquidityPoolsTitle}</h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded">
                {t.liveOnChain}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {t.poolsSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {chainId && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border ${
                isArbitrum
                  ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                  : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isArbitrum ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
                {isArbitrum ? 'Arbitrum Sepolia' : `Wrong Network (Chain ${chainId})`}
              </div>
            )}

            {!isArbitrum && userAddress && (
              <button
                onClick={handleSwitchNetwork}
                className="px-3 py-1 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold rounded transition-colors"
              >
                {t.switchNetwork}
              </button>
            )}

            <button
              onClick={loadPoolData}
              disabled={isLoadingStats}
              title={t.refreshData}
              className="p-1.5 bg-subpanel hover:bg-panel text-muted hover:text-primary rounded border border-panel transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Diagnostics / Misconfiguration Alert Banner */}
        {isPoolMisconfigured && (
          <div className="p-4 bg-[#78350f]/20 border border-[#d97706]/40 rounded-lg space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
              <div className="flex-1 text-xs space-y-1">
                <div className="font-bold text-[#f59e0b] text-sm">{t.poolMisconfiguredTitle}</div>
                <div className="text-muted leading-relaxed">
                  {t.poolMisconfiguredDesc}
                </div>
                <div className="pt-2 flex flex-wrap gap-2 items-center">
                  <button
                    onClick={loadPoolData}
                    className="px-3 py-1.5 bg-subpanel hover:bg-panel text-primary font-semibold text-xs rounded border border-panel inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t.retryConnection}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
              : statusMessage.type === 'error'
              ? 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/40'
              : 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/40'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            {txHash && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center gap-1 font-mono hover:text-white"
              >
                Arbiscan <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Main Vault Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Card 1: USDC Option Underwriting Pool */}
          <div className="md:col-span-2 bg-subpanel border border-panel rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-panel pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#10b981]/10 rounded-lg text-[#10b981] border border-[#10b981]/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-primary text-sm">{t.usdcOptionPoolTitle}</h2>
                  <p className="text-[11px] text-muted">{t.usdcOptionPoolDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted">{t.protocolApr}</span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 rounded">
                  34.2% APR
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-panel p-3 rounded-lg border border-panel">
                <div className="text-[10px] text-muted uppercase tracking-wider">{t.totalTvl}</div>
                <div className="text-base font-bold font-mono text-primary mt-0.5">
                  ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[#10b981] font-mono mt-0.5">{t.usdcOnChain}</div>
              </div>

              <div className="bg-panel p-3 rounded-lg border border-panel">
                <div className="text-[10px] text-muted uppercase tracking-wider">{t.availableLiq}</div>
                <div className="text-base font-bold font-mono text-primary mt-0.5">
                  ${availableLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted font-mono mt-0.5">{t.uncommitted}</div>
              </div>

              <div className="bg-panel p-3 rounded-lg border border-panel">
                <div className="text-[10px] text-muted uppercase tracking-wider">{t.myDeposited}</div>
                <div className="text-base font-bold font-mono text-[#f59e0b] mt-0.5">
                  ${userUsdcDeposited.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted font-mono mt-0.5">
                  {userLpShares > 0 ? `${userLpShares.toFixed(2)} ${t.lpShares}` : `0 ${t.lpShares}`}
                </div>
              </div>

              <div className="bg-panel p-3 rounded-lg border border-panel">
                <div className="text-[10px] text-muted uppercase tracking-wider">{t.walletBalance}</div>
                <div className="text-base font-bold font-mono text-primary mt-0.5">
                  ${userUsdcBalance.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted font-mono mt-0.5">Arbitrum Sepolia</div>
              </div>
            </div>

            {/* Interactive Tabs */}
            <div className="flex border-b border-panel gap-1">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'deposit'
                    ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/5'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                {t.depositUsdc}
              </button>

              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'withdraw'
                    ? 'border-[#d97706] text-[#d97706] bg-[#d97706]/5'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                {t.withdrawUsdc}
              </button>
            </div>

            {/* Tab 1: Deposit View */}
            {activeTab === 'deposit' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">{t.amountToDeposit}</span>
                    <span className="font-mono text-muted">
                      {t.walletBalance}: <span className="text-primary font-bold">{userUsdcBalance.toFixed(2)} USDC</span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-panel border border-panel focus:border-[#10b981] rounded-lg px-3 py-2.5 text-primary font-mono text-base outline-none pr-16"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-xs text-muted font-mono pointer-events-none">
                      USDC
                    </span>
                  </div>

                  {/* Quick percentage buttons */}
                  <div className="flex gap-2">
                    {[
                      { label: '$5', val: '5' },
                      { label: '$10', val: '10' },
                      { label: '$25', val: '25' },
                      { label: '50%', val: (userUsdcBalance * 0.5).toFixed(2) },
                      { label: 'MAX', val: userUsdcBalance.toFixed(2) }
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setDepositAmount(btn.val)}
                        className="flex-1 py-1 text-[11px] font-mono font-semibold bg-panel hover:bg-subpanel text-muted hover:text-primary border border-panel rounded transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deposit Details Breakdown */}
                <div className="bg-panel p-3 rounded-lg border border-panel space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-muted">
                    <span>{t.expectedLpShares}</span>
                    <span className="text-primary font-semibold">
                      ~{parsedDeposit > 0 ? parsedDeposit.toFixed(2) : '0.00'} LP
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{t.yieldSource}</span>
                    <span className="text-[#10b981]">{t.yieldSourceVal}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{t.lockupPeriod}</span>
                    <span className="text-primary">{t.noLockup}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{t.riskProtection}</span>
                    <span className="text-[#f59e0b]">{t.riskProtectionVal}</span>
                  </div>
                </div>

                {/* Dynamic Action Buttons */}
                {!userAddress ? (
                  <button
                    onClick={onConnectWallet}
                    className="w-full py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {t.connectToDeposit}
                  </button>
                ) : !isArbitrum ? (
                  <button
                    onClick={handleSwitchNetwork}
                    className="w-full py-3 bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    {t.switchToArbitrum}
                  </button>
                ) : isPoolMisconfigured ? (
                  <button
                    onClick={loadPoolData}
                    className="w-full py-3 bg-[#181614] border border-[#d97706]/40 hover:bg-[#262320] text-[#f59e0b] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t.poolOffline}
                  </button>
                ) : needsApproval ? (
                  <button
                    onClick={handleApprove}
                    disabled={txState === 'approving' || parsedDeposit <= 0}
                    className="w-full py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1f2937] disabled:text-[#6b7280] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {txState === 'approving' ? t.approvingUsdc : t.approveUsdc}
                  </button>
                ) : (
                  <button
                    onClick={handleDeposit}
                    disabled={txState === 'depositing' || parsedDeposit <= 0 || parsedDeposit > userUsdcBalance}
                    className="w-full py-3 bg-[#10b981] hover:bg-[#059669] disabled:bg-[#1f2937] disabled:text-[#6b7280] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    {txState === 'depositing'
                      ? t.depositingUsdc
                      : t.depositAction.replace('{amount}', parsedDeposit.toFixed(2))}
                  </button>
                )}
              </div>
            )}

            {/* Tab 2: Withdraw View */}
            {activeTab === 'withdraw' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">{t.amountToWithdraw}</span>
                    <span className="font-mono text-muted">
                      {t.myDeposited}: <span className="text-[#f59e0b] font-bold">{userUsdcDeposited.toFixed(2)} USDC</span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-panel border border-panel focus:border-[#d97706] rounded-lg px-3 py-2.5 text-primary font-mono text-base outline-none pr-16"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-xs text-muted font-mono pointer-events-none">
                      USDC
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { label: '25%', val: (userUsdcDeposited * 0.25).toFixed(2) },
                      { label: '50%', val: (userUsdcDeposited * 0.5).toFixed(2) },
                      { label: '75%', val: (userUsdcDeposited * 0.75).toFixed(2) },
                      { label: 'MAX', val: userUsdcDeposited.toFixed(2) }
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setWithdrawAmount(btn.val)}
                        className="flex-1 py-1 text-[11px] font-mono font-semibold bg-panel hover:bg-subpanel text-muted hover:text-primary border border-panel rounded transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-panel p-3 rounded-lg border border-panel space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-muted">
                    <span>{t.availableLiq}:</span>
                    <span className="text-primary font-semibold">${availableLiquidity.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{t.exitFee}</span>
                    <span className="text-[#10b981]">{t.zeroFee}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Settlement:</span>
                    <span className="text-primary">{t.instantTransfer}</span>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={
                    txState === 'withdrawing' ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > userUsdcDeposited
                  }
                  className="w-full py-3 bg-[#d97706] hover:bg-[#b45309] disabled:bg-subpanel disabled:text-muted text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  {txState === 'withdrawing' ? t.processingWithdraw : t.withdrawAction}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Other Protocol Vaults */}
          <div className="space-y-4">

            {/* Hourly Sheriff Protocol Pool */}
            <div className="bg-subpanel border border-panel rounded-xl p-4 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center font-sans border-b border-panel pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#d97706]" />
                  <span className="font-bold text-primary text-xs">{t.hourlyProtocolPool}</span>
                </div>
                <span className="text-[10px] text-[#10b981] font-mono font-semibold">{t.activeEpoch}</span>
              </div>

              <div className="space-y-2 text-muted">
                <div className="flex justify-between">
                  <span>{t.revenueStream}</span>
                  <span className="text-primary font-bold">20% PnL Turnover</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.epochDuration}</span>
                  <span className="text-primary">60 Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.distributionSplit}</span>
                  <span className="text-primary">50% / 25% / 25%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.quorumBarrier}</span>
                  <span className="text-[#f59e0b]">50+ Active Entrants</span>
                </div>
              </div>
            </div>

            {/* 30-Day Reserve Vault */}
            <div className="bg-subpanel border border-panel rounded-xl p-4 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center font-sans border-b border-panel pb-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#3b82f6]" />
                  <span className="font-bold text-primary text-xs">{t.reserveVault}</span>
                </div>
                <span className="text-[10px] text-muted font-mono">{t.monthlyJackpot}</span>
              </div>

              <div className="space-y-2 text-muted">
                <div className="flex justify-between">
                  <span>{t.firstPlace}</span>
                  <span className="text-primary font-bold">35% {t.accumulatedPot}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.secondPlace}</span>
                  <span className="text-primary">20% {t.accumulatedPot}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.thirdPlace}</span>
                  <span className="text-primary">15% {t.accumulatedPot}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.otherPlaces}</span>
                  <span className="text-primary">{t.sharedProRata}</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="bg-panel border border-panel rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-[#10b981] font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.securityTitle}
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                {t.securityDesc}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
