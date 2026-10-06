import WebSocket from 'ws';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';

export interface ClosedTradeEvent {
  traderAddress: string;
  symbol: string;
  pairId: number;
  positionMarginUsdc: bigint;
  realizedProfitUsdc: bigint;
  leverage: number;
  isProfit: boolean;
}

export class PnLInterceptor {
  private ws: WebSocket | null = null;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.ARBITRUM_RPC);
    if (CONFIG.KEEPER_PRIVATE_KEY) {
      this.signer = new ethers.Wallet(CONFIG.KEEPER_PRIVATE_KEY, this.provider);
    }
  }

  public start() {
    if (!CONFIG.ORDERLY_WS_URL || CONFIG.ORDERLY_WS_URL === 'mock' || CONFIG.ORDERLY_WS_URL.includes('ws-qa')) {
      console.log('[PnL Interceptor] Standalone Mode active (Orderly broker feed skipped).');
      console.log('[PnL Interceptor] On-chain PnLRouter & Epoch Keeper are active on Arbitrum Sepolia.');
      return;
    }
    console.log('[PnL Interceptor] Connecting to Orderly WebSocket feed:', CONFIG.ORDERLY_WS_URL);
    this.connectWs();
  }

  private connectWs() {
    try {
      this.ws = new WebSocket(CONFIG.ORDERLY_WS_URL);

      this.ws.on('open', () => {
        console.log('[PnL Interceptor] WebSocket connected. Subscribing to execution reports...');
        const subscribeMsg = JSON.stringify({
          id: 'pnl_interceptor_sub',
          event: 'subscribe',
          topic: 'executionreport',
          broker_id: CONFIG.BROKER_ID
        });
        this.ws?.send(subscribeMsg);
      });

      this.ws.on('message', async (data: WebSocket.Data) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.topic === 'executionreport' && payload.data) {
            await this.handleExecutionReport(payload.data);
          }
        } catch (err) {
          console.error('[PnL Interceptor] Error parsing message:', err);
        }
      });

      this.ws.on('close', () => {
        console.warn('[PnL Interceptor] WebSocket disconnected. Reconnecting in 5 seconds...');
        setTimeout(() => this.connectWs(), 5000);
      });

      this.ws.on('error', (err: any) => {
        console.warn(`[PnL Interceptor] Notice: Broker feed unreachable (${err?.code || err?.message || 'offline'}). Standalone mode active.`);
      });
    } catch (err: any) {
      console.warn('[PnL Interceptor] WebSocket initialization bypassed:', err?.message);
    }
  }

  public async handleExecutionReport(orderData: any) {
    // Only process fully closed positions with realized profit
    if (orderData.status !== 'FILLED' || !orderData.realized_pnl) return;

    const realizedPnl = parseFloat(orderData.realized_pnl);
    if (realizedPnl <= 0) {
      console.log(`[PnL Interceptor] Trade closed at loss or breakeven (${realizedPnl} USDC). Skipping.`);
      return;
    }

    const margin = parseFloat(orderData.position_margin || '100');
    const leverage = parseInt(orderData.leverage || '10');
    const trader = orderData.user_address;
    const pairId = this.mapSymbolToPairId(orderData.symbol);

    console.log(`[PnL Interceptor] Profitable trade detected! Trader: ${trader}, Profit: +$${realizedPnl} USDC, Margin: $${margin}, Leverage: ${leverage}x`);

    // Verify qualification criteria
    const marginUnits = ethers.parseUnits(margin.toFixed(2), 6);
    const profitUnits = ethers.parseUnits(realizedPnl.toFixed(2), 6);

    await this.dispatchToPnLRouter({
      traderAddress: trader,
      symbol: orderData.symbol,
      pairId,
      positionMarginUsdc: marginUnits,
      realizedProfitUsdc: profitUnits,
      leverage,
      isProfit: true
    });
  }

  private async dispatchToPnLRouter(trade: ClosedTradeEvent) {
    if (!this.signer) {
      console.warn('[PnL Interceptor] No signer configured. Skipping on-chain dispatch.');
      return;
    }

    const routerAbi = [
      'function routeProfit(address trader, uint256 pairId, uint256 positionMargin, uint256 realizedProfit, uint256 leverage) external returns (bool)'
    ];

    try {
      const routerContract = new ethers.Contract(CONFIG.CONTRACTS.PNL_ROUTER, routerAbi, this.signer);
      console.log(`[PnL Interceptor] Dispatching PnL routing on-chain for ${trade.traderAddress}...`);
      
      const tx = await routerContract.routeProfit(
        trade.traderAddress,
        trade.pairId,
        trade.positionMarginUsdc,
        trade.realizedProfitUsdc,
        trade.leverage
      );
      console.log(`[PnL Interceptor] Transaction sent! Tx Hash: ${tx.hash}`);
      await tx.wait(1);
      console.log(`[PnL Interceptor] PnL routing confirmed on Arbitrum!`);
    } catch (err) {
      console.error('[PnL Interceptor] Error executing routeProfit:', err);
    }
  }

  private mapSymbolToPairId(symbol: string): number {
    if (!symbol) return 1;
    if (symbol.includes('BTC')) return 1;
    if (symbol.includes('ETH')) return 2;
    if (symbol.includes('SOL')) return 3;
    return 1;
  }
}
