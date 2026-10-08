import React, { useState, useEffect } from 'react';
import { Market, Position, ActiveOption, TradeHistoryItem, LiveTrade } from './types';
import { MARKETS } from './constants/markets';
import { Navbar } from './components/Navbar';
import { MarketRibbon } from './components/MarketRibbon';
import { TradingViewChart } from './components/TradingViewChart';
import { OrderTicket } from './components/OrderTicket';
import { OrderBook } from './components/OrderBook';
import { PositionsTable } from './components/PositionsTable';
import { OptionsBoard } from './components/OptionsBoard';
import { Portfolio } from './components/Portfolio';
import { PoolsView } from './components/PoolsView';
import { HourlyPoolView } from './components/HourlyPoolView';
import { InfoPage } from './components/InfoPage';
import { CONTRACT_ADDRESSES } from './constants/contracts';
import { LanguageCode, TRANSLATIONS } from './i18n/translations';
import { NotificationCenter, NotificationItem, parseWeb3Error } from './components/NotificationCenter';
import { DecreasePositionModal } from './components/DecreasePositionModal';
import { TradingVaultModal } from './components/TradingVaultModal';

export const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<'perpetual' | 'options' | 'pools' | 'hourly-pool' | 'portfolio' | 'privacy' | 'help'>('perpetual');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [currentMarket, setCurrentMarket] = useState<Market>(MARKETS['BTC-PERP']);
  const [chartInterval, setChartInterval] = useState<string>('15');
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('23trade_lang');
      return (saved as LanguageCode) || 'ru';
    } catch {
      return 'ru';
    }
  });
  const [bookWidth, setBookWidth] = useState<'compact' | 'normal' | 'wide'>('normal');

  const [price, setPrice] = useState<number>(84610.50);
  const [chg24h, setChg24h] = useState<number>(2.45);
  const [high24h, setHigh24h] = useState<number>(85200.00);
  const [low24h, setLow24h] = useState<number>(83900.00);
  const [vol24h, setVol24h] = useState<number>(0);
  const [marketVolumes, setMarketVolumes] = useState<Record<string, number>>({});

  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [rawWalletBalance, setRawWalletBalance] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [realizedPnl, setRealizedPnl] = useState<number>(0);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [vaultModalTab, setVaultModalTab] = useState<'deposit' | 'withdraw'>('deposit');

  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({
    'BTC-PERP': 85189,
    'ETH-PERP': 2696,
    'SOL-PERP': 121.64,
    'DOGE-PERP': 0.0934,
    'NVDA-PERP': 230.86,
    'SPY-PERP': 763.99,
    'TSLA-PERP': 354.11
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [activeOptions, setActiveOptions] = useState<ActiveOption[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [modalItem, setModalItem] = useState<NotificationItem | null>(null);
  const [decreasePositionTarget, setDecreasePositionTarget] = useState<Position | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    options?: { rawError?: string; txHash?: string; isModal?: boolean; autoDismissMs?: number }
  ) => {
    const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const item: NotificationItem = {
      id,
      type,
      title,
      message,
      rawError: options?.rawError,
      txHash: options?.txHash,
      isModal: options?.isModal,
      autoDismissMs: options?.autoDismissMs ?? (type === 'error' ? 12000 : 7000)
    };

    setNotifications(prev => [item, ...prev.slice(0, 4)]);

    if (options?.isModal) {
      setModalItem(item);
    }

    if (item.autoDismissMs && item.autoDismissMs > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, item.autoDismissMs);
    }
  };

  const dismissToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissModal = () => {
    setModalItem(null);
  };

  const handleWeb3Error = (err: any, fallbackTitle?: string) => {
    console.error('Web3/Execution error:', err);
    const parsed = parseWeb3Error(err, currentLang);
    showNotification('error', parsed.title || fallbackTitle || (currentLang === 'ru' ? 'Ошибка транзакции' : 'Transaction Failed'), parsed.userMessage, {
      rawError: parsed.rawDetails,
      isModal: parsed.isModalRecommended
    });
  };

  const ensureAuthenticated = async (address: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/account', { credentials: 'include' });
      if (res.ok) return true;
      showNotification('info',
        currentLang === 'ru' ? 'Авторизация входа' : 'Sign-In Required',
        currentLang === 'ru'
          ? 'Пожалуйста, подтвердите подпись в кошельке для входа в торговую сессию.'
          : 'Please sign the login challenge in your wallet to authorize your trading session.'
      );
      await authenticateWallet(address);
      return true;
    } catch (err: any) {
      handleWeb3Error(err, currentLang === 'ru' ? 'Ошибка входа' : 'Login Failed');
      return false;
    }
  };

  // Purge any legacy financial keys from localStorage on startup (Audit Item 4)
  useEffect(() => {
    try {
      const keysToRemove = [
        '23trade_positions',
        '23trade_active_options',
        '23trade_trade_history',
        '23trade_pnl_adj',
        '23trade_lp_pool_address'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('23trade_positions_') ||
          key.startsWith('23trade_active_options_') ||
          key.startsWith('23trade_trade_history_')
        )) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  }, []);

  // When wallet connects/disconnects, update or clear states
  useEffect(() => {
    if (!userAddress) {
      setPositions([]);
      setActiveOptions([]);
      setTradeHistory([]);
    }
  }, [userAddress]);

  useEffect(() => {
    try {
      localStorage.setItem('23trade_lang', currentLang);
    } catch {}
  }, [currentLang]);

  // Synchronize account state whenever wallet changes
  useEffect(() => {
    if (userAddress) {
      syncAccountState();
    }
  }, [userAddress]);

  // Apply dark/light theme to document body
  useEffect(() => {
    document.body.className = `theme-${currentTheme} min-h-screen flex flex-col text-[12px] antialiased select-none`;
  }, [currentTheme]);

  // Synchronize active market price whenever market selection changes
  useEffect(() => {
    if (marketPrices[currentMarket.ticker]) {
      setPrice(marketPrices[currentMarket.ticker]);
    }
  }, [currentMarket]);

  // Market streaming: subscribe to all crypto feeds & poll stock feeds simultaneously
  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: any = null;

    // 1. Background poll for real stock quotes (NVDA, SPY, TSLA)
    const fetchStocks = async () => {
      for (const sym of ['NVDA', 'SPY', 'TSLA']) {
        try {
          const res = await fetch(`/api/stock-quote?ticker=${sym}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.price) {
              const tickerKey = `${sym}-PERP`;
              setMarketPrices((prev) => ({ ...prev, [tickerKey]: data.price }));
              if (currentMarket.ticker === tickerKey) {
                setPrice(data.price);
                setChg24h(data.chgPct || 0);
                setHigh24h(data.high || data.price * 1.01);
                setLow24h(data.low || data.price * 0.99);
              }
            }
          }
        } catch (e) {}
      }
    };
    fetchStocks();
    timer = setInterval(fetchStocks, 3500);

    // 2. Real-time WebSocket: subscribe to ALL crypto products simultaneously
    const productMap: Record<string, string> = {
      'BTC-USD': 'BTC-PERP',
      'ETH-USD': 'ETH-PERP',
      'SOL-USD': 'SOL-PERP',
      'DOGE-USD': 'DOGE-PERP',
      'BNB-USD': 'BNB-PERP',
      'ZEC-USD': 'ZEC-PERP',
      'ARB-USD': 'ARB-PERP',
      'NEAR-USD': 'NEAR-PERP',
      'UNI-USD': 'UNI-PERP',
      'XRP-USD': 'XRP-PERP'
    };

    let krakenWs: WebSocket | null = null;
    let liveTimer: any = null;

    // Background poll for all server live prices as fallback & sync
    const fetchLivePrices = async () => {
      try {
        const res = await fetch('/api/markets/live-prices');
        if (res.ok) {
          const data = await res.json();
          if (data && data.prices) {
            setMarketPrices((prev) => ({ ...prev, ...data.prices }));
            const curLive = data.prices[currentMarket.ticker];
            if (curLive && (!price || price === 0)) {
              setPrice(curLive);
            }
          }
        }
      } catch (e) {}
    };
    fetchLivePrices();
    liveTimer = setInterval(fetchLivePrices, 3000);

    try {
      ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      ws.onopen = () => {
        ws?.send(JSON.stringify({
          type: 'subscribe',
          product_ids: [
            'BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD',
            'BNB-USD', 'ZEC-USD', 'ARB-USD', 'NEAR-USD',
            'UNI-USD', 'XRP-USD'
          ],
          channels: ['ticker']
        }));
      };
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'ticker' && data.price && data.product_id) {
            const cur = parseFloat(data.price);
            const marketKey = productMap[data.product_id];

            if (marketKey) {
              setMarketPrices((prev) => ({ ...prev, [marketKey]: cur }));
            }

            // If this message belongs to currently displayed chart
            if (currentMarket.cbProduct === data.product_id || currentMarket.ticker === marketKey) {
              const op = parseFloat(data.open_24h || cur);
              setPrice(cur);
              setChg24h(((cur - op) / op) * 100);
              if (data.high_24h) setHigh24h(parseFloat(data.high_24h));
              if (data.low_24h) setLow24h(parseFloat(data.low_24h));

              const now = new Date();
              const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
              setTrades((prev) => [
                {
                  price: cur.toFixed(currentMarket.decimals),
                  size: parseFloat(data.last_size || 0.05).toFixed(3),
                  time: timeStr,
                  side: data.side || 'buy'
                },
                ...prev.slice(0, 24)
              ]);
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    // Kraken WebSocket for pairs not on Coinbase Exchange orderbook (LIT, GMX)
    try {
      krakenWs = new WebSocket('wss://ws.kraken.com');
      krakenWs.onopen = () => {
        krakenWs?.send(JSON.stringify({
          event: 'subscribe',
          pair: ['LIT/USD', 'GMX/USD'],
          subscription: { name: 'ticker' }
        }));
      };
      krakenWs.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (Array.isArray(data) && data[1] && data[3]) {
            const pair = data[3];
            const ticker = pair === 'LIT/USD' ? 'LIT-PERP' : pair === 'GMX/USD' ? 'GMX-PERP' : null;
            if (ticker && data[1].c && data[1].c[0]) {
              const cur = parseFloat(data[1].c[0]);
              setMarketPrices((prev) => ({ ...prev, [ticker]: cur }));
              if (currentMarket.ticker === ticker) {
                const op = parseFloat(data[1].o?.[0] || cur);
                setPrice(cur);
                setChg24h(((cur - op) / op) * 100);
                if (data[1].h?.[0]) setHigh24h(parseFloat(data[1].h[0]));
                if (data[1].l?.[0]) setLow24h(parseFloat(data[1].l[0]));

                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                setTrades((prev) => [
                  {
                    price: cur.toFixed(currentMarket.decimals),
                    size: parseFloat(data[1].v?.[0] || '1').toFixed(3),
                    time: timeStr,
                    side: data[1].a ? 'buy' : 'sell'
                  },
                  ...prev.slice(0, 24)
                ]);
              }
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
      if (krakenWs) krakenWs.close();
      if (timer) clearInterval(timer);
      if (liveTimer) clearInterval(liveTimer);
    };
  }, [currentMarket]);

  // Fetch real platform 24h trading volume
  const fetchMarketVolumes = async () => {
    try {
      const res = await fetch('/api/markets/volume');
      if (res.ok) {
        const vols = await res.json();
        setMarketVolumes(vols);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMarketVolumes();
    const interval = setInterval(fetchMarketVolumes, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update vol24h whenever currentMarket or marketVolumes updates
  useEffect(() => {
    const vol = marketVolumes[currentMarket.ticker] ?? marketVolumes[`${currentMarket.ticker}-PERP`] ?? marketVolumes[currentMarket.base] ?? 0;
    setVol24h(vol);
  }, [currentMarket, marketVolumes]);

  // Fetch real on-chain USDC ERC-20 balance
  const fetchUsdcBalance = async (address: string) => {
    if (typeof (window as any).ethereum === 'undefined' || !address) return;
    try {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(chainId, 16);

      // Native USDC on Arbitrum Sepolia (421614) vs Arbitrum One Mainnet (42161)
      const usdcAddress = chainIdNum === 421614
        ? '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' // Arbitrum Sepolia Verified Circle USDC
        : '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // Arbitrum One Mainnet Native USDC

      // ERC-20 balanceOf(address) selector: 0x70a08231
      const data = '0x70a08231' + address.toLowerCase().replace('0x', '').padStart(64, '0');
      const hexBal = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: usdcAddress, data }, 'latest']
      });

      if (hexBal && hexBal !== '0x') {
        const usdc = Number(BigInt(hexBal)) / 1e6;
        setRawWalletBalance(usdc);
        try {
          const accRes = await fetch('/api/account', { credentials: 'include' });
          if (accRes.ok) {
            const accData = await accRes.json();
            setUserBalance(accData.availableBalance);
            if (accData.realizedPnl !== undefined) setRealizedPnl(Number(accData.realizedPnl));
            if (accData.positions) setPositions(accData.positions);
            if (accData.activeOptions) setActiveOptions(accData.activeOptions);
            if (accData.tradeHistory) setTradeHistory(accData.tradeHistory);

            await fetch('/api/sync-balance', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
          }
        } catch {}
      } else {
        setRawWalletBalance(0);
      }
    } catch (err) {
      console.error('Error fetching real USDC balance:', err);
      setRawWalletBalance(0);
    }
  };

  const authenticateWallet = async (address: string) => {
    const nonceRes = await fetch('/api/auth/nonce', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    if (!nonceRes.ok) throw new Error('Unable to start wallet authentication');
    const { message } = await nonceRes.json();
    const signature = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature })
    });
    if (!loginRes.ok) throw new Error('Wallet authentication failed');
  };

  // Sync complete account state from the authenticated server session.
  const syncAccountState = async () => {
    try {
      const res = await fetch('/api/account', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.availableBalance);
        if (data.realizedPnl !== undefined) setRealizedPnl(Number(data.realizedPnl));
        if (data.positions) setPositions(data.positions);
        if (data.activeOptions) setActiveOptions(data.activeOptions);
        if (data.tradeHistory) setTradeHistory(data.tradeHistory);
        if (data.platformVolumes) setMarketVolumes(data.platformVolumes);
      }
    } catch (e) {
      console.warn('API sync failed:', e);
    }
  };

  // Connect Web3 Wallet
  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setUserAddress(accounts[0]);
          await authenticateWallet(accounts[0]);
          await fetchUsdcBalance(accounts[0]);
          showNotification('success',
            currentLang === 'ru' ? 'Кошелёк подключен' : 'Wallet Connected',
            `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
          );
        }
      } catch (e: any) {
        console.error('Wallet connection error:', e);
        handleWeb3Error(e, currentLang === 'ru' ? 'Ошибка подключения' : 'Connection Error');
      }
    } else {
      showNotification('warning',
        currentLang === 'ru' ? 'Кошелёк не найден' : 'Wallet Not Found',
        'No Web3 wallet extension found! Please install MetaMask or Rabby.'
      );
    }
  };

  // Keep USDC balance synced on account or network changes
  useEffect(() => {
    if (typeof (window as any).ethereum !== 'undefined') {
      const handleAccounts = (accounts: string[]) => {
        if (!userAddress) return;
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          fetchUsdcBalance(accounts[0]);
        } else {
          setUserAddress(null);
          setRawWalletBalance(0);
          setUserBalance(0);
        }
      };

      const handleChain = () => {
        if (userAddress) {
          fetchUsdcBalance(userAddress);
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccounts);
      (window as any).ethereum.on('chainChanged', handleChain);

      return () => {
        (window as any).ethereum.removeListener?.('accountsChanged', handleAccounts);
        (window as any).ethereum.removeListener?.('chainChanged', handleChain);
      };
    }
  }, [userAddress]);

  // Perpetual Execution with REAL on-chain transfer to Pool on open, and calculated return on close
  // Wait for transaction receipt helper
  const waitForTxReceipt = async (txHash: string): Promise<any> => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return null;
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
    return null;
  };

  // Perpetual Execution directly against platform account balance (no LP pool minting)
  const handleExecuteOrder = async (
    side: 'Long' | 'Short',
    margin: number,
    leverage: number
  ) => {
    if (!userAddress) {
      showNotification('warning',
        currentLang === 'ru' ? 'Кошелёк не подключен' : 'Wallet Not Connected',
        currentLang === 'ru' ? 'Пожалуйста, подключите кошелек Web3!' : 'Please connect your Web3 wallet first!'
      );
      return;
    }

    try {
      // 0. Ensure user has a valid backend session
      const isAuthed = await ensureAuthenticated(userAddress);
      if (!isAuthed) return;

      const positionSizeUsd = margin * leverage;
      const takerFee = Number((positionSizeUsd * 0.00055).toFixed(2));
      const totalRequired = Number((margin + takerFee).toFixed(2));

      if (userBalance < totalRequired) {
        showNotification('warning',
          currentLang === 'ru' ? 'Недостаточно средств' : 'Insufficient Balance',
          currentLang === 'ru'
            ? `Недостаточно доступного баланса: требуется $${totalRequired.toFixed(2)} ($${margin.toFixed(2)} маржа + $${takerFee.toFixed(2)} комиссия taker 0.055%). Доступно: $${userBalance.toFixed(2)} USDC`
            : `Insufficient available balance: requires $${totalRequired.toFixed(2)} ($${margin.toFixed(2)} margin + $${takerFee.toFixed(2)} taker fee 0.055%). Available: $${userBalance.toFixed(2)} USDC`
        );
        return;
      }

      // Register position on backend
      const orderPayload = {
        symbol: currentMarket.ticker || currentMarket.name,
        side,
        leverage,
        margin
      };

      let res = await fetch('/api/orders/open', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.status === 401) {
        await authenticateWallet(userAddress);
        res = await fetch('/api/orders/open', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
      }

      if (res.ok) {
        const state = await res.json();
        setUserBalance(state.availableBalance);
        if (state.realizedPnl !== undefined) setRealizedPnl(Number(state.realizedPnl));
        setPositions(state.positions || []);
        fetchMarketVolumes();
        showNotification('success',
          currentLang === 'ru' ? 'Ордер исполнен' : 'Order Filled',
          currentLang === 'ru'
            ? `${side === 'Long' ? 'Лонг (Buy)' : 'Шорт (Sell)'} ${leverage}x на ${currentMarket.name} ($${price.toFixed(currentMarket.decimals)}).\nМаржа: $${margin.toFixed(2)} USDC | Комиссия taker (0.055%): -$${takerFee.toFixed(2)} USDC.`
            : `${side} ${leverage}x on ${currentMarket.name} at $${price.toFixed(currentMarket.decimals)}.\nMargin: $${margin.toFixed(2)} USDC | Taker fee (0.055%): -$${takerFee.toFixed(2)} USDC.`
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('warning',
          currentLang === 'ru' ? 'Ошибка ордера' : 'Order Error',
          err.error || 'Server error'
        );
      }
    } catch (err: any) {
      handleWeb3Error(err, currentLang === 'ru' ? 'Ошибка исполнения ордера' : 'Order Execution Failed');
    }
  };

  const handleOpenCloseModal = (pos: Position) => {
    setDecreasePositionTarget(pos);
  };

  const handleConfirmDecrease = async (id: string, percent: number, closeAmountUsd: number) => {
    if (!userAddress) return;
    const targetPos = positions.find((p) => p.id === id);
    if (!targetPos) return;

    const exitPrice = (marketPrices[targetPos.symbol] || marketPrices[`${targetPos.base}-PERP`] || marketPrices[targetPos.base]) || price;
    const pct = Math.min(100, Math.max(0.1, percent || 100));
    const fraction = pct / 100;
    const isFullClose = pct >= 99.9;

    const diff = targetPos.side === 'Long' ? exitPrice - targetPos.entry : targetPos.entry - exitPrice;
    const closedCoins = targetPos.sizeCoins * fraction;
    const closedMargin = targetPos.margin * fraction;
    const notionalClosed = closedCoins * exitPrice;
    const closeFee = Number((notionalClosed * 0.00055).toFixed(2));
    const grossPnl = parseFloat((diff * closedCoins).toFixed(2));
    const netPnl = parseFloat((grossPnl - closeFee).toFixed(2));
    const returnAmount = Math.max(0, parseFloat((closedMargin + netPnl).toFixed(2)));

    try {
      // 0. Ensure user has an active session before closing
      const isAuthed = await ensureAuthenticated(userAddress);
      if (!isAuthed) return;

      // 1. Close or decrease on database & calculate final settlement
      let res = await fetch('/api/orders/close', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: id,
          percent: pct
        })
      });

      if (res.status === 401) {
        await authenticateWallet(userAddress);
        res = await fetch('/api/orders/close', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positionId: id,
            percent: pct
          })
        });
      }

      if (res.ok) {
        const state = await res.json();
        setUserBalance(state.availableBalance);
        if (state.realizedPnl !== undefined) setRealizedPnl(Number(state.realizedPnl));
        setPositions(state.positions || []);
        setTradeHistory(state.tradeHistory || []);
        fetchMarketVolumes();

        const closeMsg = currentLang === 'ru'
          ? `${isFullClose ? 'Позиция закрыта' : 'Позиция уменьшена на ' + pct.toFixed(1) + '%'} по цене $${exitPrice.toFixed(currentMarket.decimals)}!\nОсвобождено маржи: $${closedMargin.toFixed(2)} USDC, PnL: ${grossPnl >= 0 ? '+' : ''}$${grossPnl.toFixed(2)} USDC, комиссия taker (0.055%): -$${closeFee.toFixed(2)} USDC.\nЧистый PnL: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)} USDC. На баланс зачислено: $${returnAmount.toFixed(2)} USDC.`
          : `${isFullClose ? 'Position Closed' : 'Position Decreased by ' + pct.toFixed(1) + '%'} at $${exitPrice.toFixed(currentMarket.decimals)}!\nReleased Margin: $${closedMargin.toFixed(2)} USDC, Gross PnL: ${grossPnl >= 0 ? '+' : ''}$${grossPnl.toFixed(2)} USDC, Taker Fee (0.055%): -$${closeFee.toFixed(2)} USDC.\nNet PnL: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)} USDC. Credited to balance: $${returnAmount.toFixed(2)} USDC.`;
        showNotification('success',
          currentLang === 'ru' ? (isFullClose ? 'Позиция закрыта' : 'Позиция уменьшена') : (isFullClose ? 'Position Closed' : 'Position Decreased'),
          closeMsg
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('warning',
          currentLang === 'ru' ? 'Ошибка закрытия' : 'Close Failed',
          `Не удалось закрыть позицию: ${err.error || 'Server error'}`
        );
      }
    } catch (err: any) {
      handleWeb3Error(err, currentLang === 'ru' ? 'Ошибка закрытия позиции' : 'Close Position Error');
    }
  };

  // Options Execution via Server Database
  const handleBuyOption = async (instrument: string, strike: number, type: 'CALL' | 'PUT', contracts: number, cost: number) => {
    if (!userAddress) {
      showNotification('warning',
        currentLang === 'ru' ? 'Требуется кошелек' : 'Wallet Required',
        currentLang === 'ru' ? 'Сначала подключите Web3-кошелек!' : 'Please connect your Web3 wallet first!'
      );
      return;
    }
    try {
      const isAuthed = await ensureAuthenticated(userAddress);
      if (!isAuthed) return;

      let res = await fetch('/api/options/buy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument,
          contracts
        })
      });

      if (res.status === 401) {
        await authenticateWallet(userAddress);
        res = await fetch('/api/options/buy', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instrument,
            contracts
          })
        });
      }

      if (res.ok) {
        const state = await res.json();
        setUserBalance(state.availableBalance);
        if (state.realizedPnl !== undefined) setRealizedPnl(Number(state.realizedPnl));
        setActiveOptions(state.activeOptions || []);
        showNotification('success',
          currentLang === 'ru' ? 'Опцион куплен' : 'Option Purchased',
          currentLang === 'ru'
            ? `Куплен контракт ${instrument} за $${cost.toFixed(2)} USDC!`
            : `Purchased ${instrument} for $${cost.toFixed(2)} USDC!`
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('warning',
          currentLang === 'ru' ? 'Ошибка покупки опциона' : 'Option Buy Failed',
          err.error || 'Server error'
        );
      }
    } catch (err: any) {
      handleWeb3Error(err, currentLang === 'ru' ? 'Ошибка опциона' : 'Option Error');
    }
  };

  const handleCloseOption = async (id: string) => {
    if (!userAddress) return;
    try {
      const res = await fetch('/api/options/close', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId: id
        })
      });
      if (res.ok) {
        const state = await res.json();
        setUserBalance(state.availableBalance);
        if (state.realizedPnl !== undefined) setRealizedPnl(Number(state.realizedPnl));
        setActiveOptions(state.activeOptions || []);
        setTradeHistory(state.tradeHistory || []);
      }
    } catch (err: any) {
      console.error('Error closing option:', err);
    }
  };

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ru;

  const chartColSpan = bookWidth === 'wide' ? 'lg:col-span-5' : bookWidth === 'compact' ? 'lg:col-span-7' : 'lg:col-span-6';
  const bookColSpan = bookWidth === 'wide' ? 'lg:col-span-4' : bookWidth === 'compact' ? 'lg:col-span-2' : 'lg:col-span-3';

  return (
    <div className="min-h-screen flex flex-col bg-panel text-primary">
      <Navbar
        currentSection={currentSection}
        onSelectSection={(s: any) => setCurrentSection(s)}
        currentTheme={currentTheme}
        onToggleTheme={() => setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark')}
        userAddress={userAddress}
        onConnectWallet={connectWallet}
        onDisconnectWallet={() => {
          setUserAddress(null);
          setRawWalletBalance(0);
          setUserBalance(0);
          setRealizedPnl(0);
        }}
        currentLang={currentLang}
        onSelectLang={(lang) => setCurrentLang(lang)}
        userBalance={userBalance}
        rawWalletBalance={rawWalletBalance}
        onOpenDeposit={() => {
          setVaultModalTab('deposit');
          setIsVaultModalOpen(true);
        }}
        onOpenWithdraw={() => {
          setVaultModalTab('withdraw');
          setIsVaultModalOpen(true);
        }}
      />

      {(currentSection === 'perpetual' || currentSection === 'options') && (
        <MarketRibbon
          currentMarket={currentMarket}
          onSelectMarket={(m) => setCurrentMarket(m)}
          price={price}
          change24h={chg24h}
          high24h={high24h}
          low24h={low24h}
          volume24h={vol24h}
          marketPrices={marketPrices}
          marketVolumes={marketVolumes}
          labels={t}
        />
      )}

      {currentSection === 'perpetual' && (
        <div className="flex-1 grid grid-cols-12 gap-[1px] bg-panel overflow-hidden min-h-0 lg:h-[calc(100vh-88px)]">
          <section className={`col-span-12 ${chartColSpan} flex flex-col bg-panel overflow-hidden border-r border-panel h-full min-h-0`}>
            <TradingViewChart
              currentMarket={currentMarket}
              theme={currentTheme}
              interval={chartInterval}
              onIntervalChange={(tf) => setChartInterval(tf)}
            />
            <PositionsTable
              userAddress={userAddress}
              positions={positions}
              tradeHistory={tradeHistory}
              currentPrice={price}
              marketPrices={marketPrices}
              decimals={currentMarket.decimals}
              onClosePosition={handleOpenCloseModal}
              labels={t}
            />
          </section>

          <OrderTicket
            currentMarket={currentMarket}
            currentPrice={price}
            userBalance={userBalance}
            onExecuteOrder={handleExecuteOrder}
            onOpenDeposit={() => {
              setVaultModalTab('deposit');
              setIsVaultModalOpen(true);
            }}
            onNotify={(type, title, msg) => showNotification(type, title, msg)}
            labels={t}
          />

          <OrderBook
            midPrice={price}
            decimals={currentMarket.decimals}
            baseAsset={currentMarket.base}
            trades={trades}
            bookWidth={bookWidth}
            onToggleBookWidth={(w) => setBookWidth(w)}
            colSpanClass={`col-span-12 md:col-span-6 ${bookColSpan}`}
            labels={t}
          />
        </div>
      )}

      {currentSection === 'options' && (
        <OptionsBoard
          currentMarket={currentMarket}
          spotPrice={price}
          userBalance={userBalance}
          activeOptions={activeOptions}
          onBuyOption={handleBuyOption}
          onCloseOption={handleCloseOption}
          onNotify={(type, title, msg) => showNotification(type, title, msg)}
          currentLang={currentLang}
        />
      )}

      {currentSection === 'pools' && (
        <PoolsView
          userAddress={userAddress}
          onConnectWallet={connectWallet}
          onRefreshBalance={() => {
            if (userAddress) fetchUsdcBalance(userAddress);
          }}
          currentLang={currentLang}
        />
      )}

      {currentSection === 'hourly-pool' && (
        <HourlyPoolView
          userAddress={userAddress}
          userBalance={userBalance}
          positions={positions}
          onNavigateToTrade={() => setCurrentSection('perpetual')}
          labels={t}
          currentLang={currentLang}
        />
      )}

      {currentSection === 'portfolio' && (
        <Portfolio
          userAddress={userAddress}
          userBalance={userBalance}
          tradeHistory={tradeHistory}
          theme={currentTheme}
          currentLang={currentLang}
        />
      )}

      {(currentSection === 'privacy' || currentSection === 'help') && (
        <InfoPage
          type={currentSection}
          onBack={() => setCurrentSection('perpetual')}
          currentLang={currentLang}
        />
      )}

      {/* Modern Cyberpunk Notification Center (Toasts & Error Modal) */}
      <NotificationCenter
        notifications={notifications}
        modalItem={modalItem}
        onDismissToast={dismissToast}
        onDismissModal={dismissModal}
        lang={currentLang}
      />

      {/* Decrease & Close Position Modal */}
      <DecreasePositionModal
        isOpen={!!decreasePositionTarget}
        position={decreasePositionTarget}
        currentMarkPrice={
          decreasePositionTarget 
            ? ((marketPrices[decreasePositionTarget.symbol] || marketPrices[`${decreasePositionTarget.base}-PERP`] || marketPrices[decreasePositionTarget.base]) || price)
            : price
        }
        currentLang={currentLang}
        onClose={() => setDecreasePositionTarget(null)}
        onConfirmDecrease={handleConfirmDecrease}
      />

      {/* Trading Vault Deposit / Withdraw Modal */}
      <TradingVaultModal
        isOpen={isVaultModalOpen}
        initialTab={vaultModalTab}
        onClose={() => setIsVaultModalOpen(false)}
        userAddress={userAddress}
        userBalance={userBalance}
        rawWalletBalance={rawWalletBalance}
        currentLang={currentLang}
        onSuccess={() => {
          if (userAddress) {
            fetchUsdcBalance(userAddress);
            syncAccountState();
          }
        }}
      />
    </div>
  );
};

