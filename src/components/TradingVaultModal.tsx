import React, { useState, useEffect } from 'react';
import { CONTRACT_ADDRESSES } from '../constants/contracts';
import { X, ArrowDownCircle, ArrowUpCircle, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface TradingVaultModalProps {
  isOpen: boolean;
  initialTab?: 'deposit' | 'withdraw';
  onClose: () => void;
  userAddress: string | null;
  userBalance: number;        // Available platform trading balance
  rawWalletBalance: number;   // On-chain USDC in MetaMask wallet
  currentLang: string;
  onSuccess: () => void;
}

export const TradingVaultModal: React.FC<TradingVaultModalProps> = ({
  isOpen,
  initialTab = 'deposit',
  onClose,
  userAddress,
  userBalance,
  rawWalletBalance,
  currentLang,
  onSuccess
}) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>(initialTab);
  const [amount, setAmount] = useState<string>('50');
  const [status, setStatus] = useState<'idle' | 'approving' | 'submitting' | 'success' | 'error'>('idle');
  const [statusText, setStatusText] = useState<string>('');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [vaultLiquidity, setVaultLiquidity] = useState<number | null>(null);

  const isRu = currentLang === 'ru';
  const vaultAddress = CONTRACT_ADDRESSES.TRADING_VAULT;
  const usdcAddress = CONTRACT_ADDRESSES.USDC;

  useEffect(() => {
    setTab(initialTab);
    setStatus('idle');
    setStatusText('');
    setLastTxHash(null);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/vault/info')
        .then(r => r.json())
        .then(data => {
          if (typeof data.vaultLiquidity === 'number') {
            setVaultLiquidity(data.vaultLiquidity);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const maxWithdrawable = vaultLiquidity !== null ? Math.min(userBalance, vaultLiquidity) : userBalance;


  const waitForTxReceipt = async (txHash: string): Promise<any> => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return null;
    for (let i = 0; i < 40; i++) {
      try {
        const receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
        if (receipt && receipt.blockNumber) return receipt;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1500));
    }
    return null;
  };

  const handleDeposit = async () => {
    if (!userAddress || numAmount <= 0) return;
    if (numAmount > rawWalletBalance) {
      setStatus('error');
      setStatusText(isRu ? 'Недостаточно USDC в кошельке' : 'Insufficient USDC in wallet');
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('MetaMask not detected');

      setStatus('approving');
      setStatusText(isRu ? 'Проверка разрешения USDC...' : 'Checking USDC allowance...');

      const paddedUser = userAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      const paddedVault = vaultAddress.toLowerCase().replace('0x', '').padStart(64, '0');

      // allowance(user, vault) -> selector 0xdd62ed3e
      const allowHex = await ethereum.request({
        method: 'eth_call',
        params: [{ to: usdcAddress, data: '0xdd62ed3e' + paddedUser + paddedVault }, 'latest']
      });
      const currentAllowance = allowHex && allowHex !== '0x' ? Number(BigInt(allowHex)) / 1e6 : 0;

      if (currentAllowance < numAmount) {
        setStatusText(isRu ? 'Подтвердите Approve в кошельке...' : 'Confirm Approve in your wallet...');
        const approveUnits = BigInt(Math.floor(numAmount * 1e6));
        const paddedApproveAmount = approveUnits.toString(16).padStart(64, '0');
        const approveData = '0x095ea7b3' + paddedVault + paddedApproveAmount;

        const approveTx = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: userAddress, to: usdcAddress, data: approveData }]
        });
        setStatusText(isRu ? 'Ожидание подтверждения Approve в сети...' : 'Waiting for Approve confirmation...');
        await waitForTxReceipt(approveTx);
      }

      // deposit(uint256) -> selector 0xb6b55f25
      setStatus('submitting');
      setStatusText(isRu ? 'Подтвердите депозит в Trading Vault...' : 'Confirm deposit to Trading Vault...');
      const amountUnits = BigInt(Math.floor(numAmount * 1e6));
      const paddedAmount = amountUnits.toString(16).padStart(64, '0');
      const depositData = '0xb6b55f25' + paddedAmount;

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: userAddress, to: vaultAddress, data: depositData }]
      });

      setStatusText(isRu ? 'Транзакция отправлена! Ожидание блока...' : 'Transaction submitted! Waiting for block...');
      setLastTxHash(txHash);

      await waitForTxReceipt(txHash);

      // Sync backend balance
      await fetch('/api/sync-balance', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(() => {});

      setStatus('success');
      setStatusText(
        isRu
          ? `Успешно внесен депозит $${numAmount.toFixed(2)} USDC в Trading Vault!`
          : `Successfully deposited $${numAmount.toFixed(2)} USDC into Trading Vault!`
      );
      onSuccess();
    } catch (err: any) {
      console.error('Deposit error:', err);
      setStatus('error');
      setStatusText(err?.message || (isRu ? 'Ошибка при внесении депозита' : 'Deposit failed'));
    }
  };

  const handleWithdraw = async () => {
    if (!userAddress || numAmount <= 0) return;
    if (numAmount > userBalance) {
      setStatus('error');
      setStatusText(isRu ? 'Сумма превышает доступный баланс' : 'Amount exceeds available balance');
      return;
    }
    if (vaultLiquidity !== null && numAmount > vaultLiquidity) {
      setStatus('error');
      setStatusText(
        isRu
          ? `В смарт-контракте TradingVault сейчас доступно $${vaultLiquidity.toFixed(2)} USDC. Вы можете вывести до $${vaultLiquidity.toFixed(2)} USDC сейчас.`
          : `Only $${vaultLiquidity.toFixed(2)} USDC liquidity is available in the contract now. You can withdraw up to $${vaultLiquidity.toFixed(2)} USDC.`
      );
      return;
    }

    try {
      setStatus('submitting');
      setStatusText(isRu ? 'Генерация расчетного ваучера на сервере...' : 'Requesting clearing voucher...');

      // Request signed voucher from server
      const voucherRes = await fetch('/api/vault/withdraw-voucher', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount })
      });

      if (!voucherRes.ok) {
        const errJson = await voucherRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server rejected withdrawal voucher');
      }

      const { voucher } = await voucherRes.json();
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('MetaMask not detected');

      setStatusText(isRu ? 'Подтвердите вывод в кошельке...' : 'Confirm withdrawal in your wallet...');

      // encode withdrawWithSignature(uint256,uint256,uint256,uint256,uint8,bytes32,bytes32) -> selector 0xfaa9a8e5
      const amountUnits = BigInt(Math.floor(voucher.amount * 1e6)).toString(16).padStart(64, '0');
      const feeUnits = BigInt(Math.floor(voucher.fee * 1e6)).toString(16).padStart(64, '0');
      const nonceUnits = BigInt(voucher.nonce).toString(16).padStart(64, '0');
      const expiryUnits = BigInt(voucher.expiry).toString(16).padStart(64, '0');
      const vUnits = BigInt(voucher.v).toString(16).padStart(64, '0');
      const rUnits = voucher.r.replace('0x', '').padStart(64, '0');
      const sUnits = voucher.s.replace('0x', '').padStart(64, '0');

      const withdrawData = '0xfaa9a8e5' + amountUnits + feeUnits + nonceUnits + expiryUnits + vUnits + rUnits + sUnits;

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: userAddress, to: vaultAddress, data: withdrawData }]
      });

      setStatusText(isRu ? 'Вывод отправлен в сеть! Ожидание блока...' : 'Withdrawal submitted! Waiting for block...');
      setLastTxHash(txHash);

      await waitForTxReceipt(txHash);

      // Confirm with server to update account state
      await fetch('/api/vault/confirm-withdraw', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, amount: numAmount })
      }).catch(() => {});

      setStatus('success');
      setStatusText(
        isRu
          ? `Успешно выведено $${numAmount.toFixed(2)} USDC на ваш кошелек!`
          : `Successfully withdrawn $${numAmount.toFixed(2)} USDC to your wallet!`
      );
      onSuccess();
    } catch (err: any) {
      console.error('Withdraw error:', err);
      setStatus('error');
      setStatusText(err?.message || (isRu ? 'Ошибка при выводе средств' : 'Withdrawal failed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="bg-[#140f0c] border border-[#2b221a] rounded-2xl w-full max-w-[440px] p-5 text-[#f5efe8] shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#251e18]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f5efe8]">
                {isRu ? 'Торговый депозит (Trading Vault)' : 'Trading Vault Account'}
              </h3>
              <p className="text-[10px] text-muted font-mono">
                Contract: {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#998b7e] hover:text-[#f5efe8] transition-colors p-1 rounded-lg hover:bg-[#201813]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 mt-4 p-1 bg-[#1a130e] rounded-xl border border-[#2d2117]">
          <button
            type="button"
            onClick={() => { setTab('deposit'); setStatus('idle'); }}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'deposit'
                ? 'bg-[#291e15] text-[#0ecb81] border border-[#0ecb81]/30 shadow-sm'
                : 'text-muted hover:text-primary hover:bg-[#201711]'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            {isRu ? 'Депозит' : 'Deposit'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('withdraw'); setStatus('idle'); }}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'withdraw'
                ? 'bg-[#291e15] text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-muted hover:text-primary hover:bg-[#201711]'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            {isRu ? 'Вывод баланса' : 'Withdraw'}
          </button>
        </div>

        {/* Balance Display */}
        <div className="mt-4 p-3 bg-[#18110c] rounded-xl border border-[#2b2017] space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-muted">
            <span>{isRu ? 'USDC в кошельке (MetaMask):' : 'Wallet Balance (MetaMask):'}</span>
            <span className="text-primary font-semibold">${rawWalletBalance.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between text-muted border-t border-[#251e18] pt-1.5">
            <span>{isRu ? 'Баланс трейдера (Trading Vault):' : 'Trader Balance (Trading Vault):'}</span>
            <span className="text-[#0ecb81] font-bold">${userBalance.toFixed(2)} USDC</span>
          </div>
          {tab === 'withdraw' && vaultLiquidity !== null && (
            <div className="flex justify-between text-muted border-t border-[#251e18] pt-1.5">
              <span>{isRu ? 'Ликвидность смарт-контракта:' : 'Contract Liquidity:'}</span>
              <span className={`font-semibold ${vaultLiquidity < userBalance ? 'text-amber-400' : 'text-primary'}`}>
                ${vaultLiquidity.toFixed(2)} USDC
              </span>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="mt-4 bg-[#1b140f] border border-[#30251c] rounded-xl p-3 focus-within:border-amber-500 transition-colors">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1 flex justify-between">
            <span>{tab === 'deposit' ? (isRu ? 'Сумма депозита' : 'Deposit Amount') : (isRu ? 'Сумма вывода' : 'Withdraw Amount')}</span>
            <span className="text-[#a89d91] font-mono">
              Max: ${tab === 'deposit' ? rawWalletBalance.toFixed(2) : maxWithdrawable.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="bg-transparent text-xl font-bold font-mono text-[#f5efe8] outline-none w-full"
            />
            <span className="text-sm font-semibold text-amber-400 font-mono ml-2">USDC</span>
          </div>
        </div>

        {/* Quick Percent Buttons */}
        <div className="flex gap-2 mt-2 font-mono text-xs">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => {
                const maxVal = tab === 'deposit' ? rawWalletBalance : maxWithdrawable;
                setAmount(((maxVal * pct) / 100).toFixed(2));
              }}
              className="flex-1 py-1 bg-[#1d1510] hover:bg-[#271d15] border border-[#302318] rounded-lg text-muted hover:text-primary transition-colors text-[11px]"
            >
              {pct === 100 ? 'MAX' : `${pct}%`}
            </button>
          ))}
        </div>

        {/* Contract Liquidity Notice */}
        {tab === 'withdraw' && vaultLiquidity !== null && numAmount > vaultLiquidity && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono leading-relaxed">
            {isRu
              ? `⚠️ В смарт-контракте сейчас $${vaultLiquidity.toFixed(2)} USDC ликвидности. Вы можете вывести до $${vaultLiquidity.toFixed(2)} USDC прямо сейчас.`
              : `⚠️ Contract currently holds $${vaultLiquidity.toFixed(2)} USDC. You can withdraw up to $${vaultLiquidity.toFixed(2)} USDC right now.`}
          </div>
        )}

        {/* Status Message */}
        {statusText && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
            status === 'error'
              ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
              : status === 'success'
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
              : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
          }`}>
            {status === 'submitting' || status === 'approving' ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />
            ) : status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0ecb81]" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p>{statusText}</p>
              {lastTxHash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] underline text-amber-400 hover:text-amber-300"
                >
                  <span>{isRu ? 'Посмотреть транзакцию в Arbiscan' : 'View on Arbiscan'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-5">
          {tab === 'deposit' ? (
            <button
              type="button"
              disabled={status === 'approving' || status === 'submitting' || numAmount <= 0}
              onClick={handleDeposit}
              className="w-full py-3 bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-[#080b11] font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'approving' || status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusText || (isRu ? 'Обработка...' : 'Processing...')}</span>
                </>
              ) : (
                <span>{isRu ? `Пополнить Trading Vault ($${numAmount.toFixed(2)} USDC)` : `Deposit $${numAmount.toFixed(2)} USDC`}</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={status === 'submitting' || numAmount <= 0}
              onClick={handleWithdraw}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-[#080b11] font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusText || (isRu ? 'Вывод средств...' : 'Withdrawing...')}</span>
                </>
              ) : (
                <span>{isRu ? `Вывести на кошелек ($${numAmount.toFixed(2)} USDC)` : `Withdraw $${numAmount.toFixed(2)} USDC`}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
