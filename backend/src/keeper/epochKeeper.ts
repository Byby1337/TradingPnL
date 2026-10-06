import { ethers } from 'ethers';
import { CONFIG } from '../config.js';
import http from 'http';

export class EpochKeeper {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private isRunning: boolean = false;
  private lastHeartbeatTime: number = Date.now();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.ARBITRUM_RPC);
    if (CONFIG.KEEPER_PRIVATE_KEY) {
      this.signer = new ethers.Wallet(CONFIG.KEEPER_PRIVATE_KEY, this.provider);
    }
  }

  public start() {
    this.isRunning = true;
    console.log('[Epoch Keeper] Service started. Monitoring hourly epochs across pairs...');
    this.startHeartbeatServer();
    this.epochCheckLoop();
  }

  private startHeartbeatServer() {
    const server = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/heartbeat') {
        const timeSinceHeartbeat = Date.now() - this.lastHeartbeatTime;
        if (timeSinceHeartbeat < 30000) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'OK', lastHeartbeat: this.lastHeartbeatTime }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'STALE', timeSinceHeartbeat }));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.on('error', (err: any) => {
      console.warn(`[Epoch Keeper] Heartbeat port ${CONFIG.HEARTBEAT_PORT} busy, continuing without local HTTP heartbeat.`);
    });

    server.listen(CONFIG.HEARTBEAT_PORT, () => {
      console.log(`[Epoch Keeper] Health/Watchdog heartbeat listening on port ${CONFIG.HEARTBEAT_PORT}`);
    });
  }

  private async epochCheckLoop() {
    while (this.isRunning) {
      try {
        this.lastHeartbeatTime = Date.now();
        // Check core trading pairs: 1 (BTC), 2 (ETH), 3 (SOL)
        for (const pairId of [1, 2, 3]) {
          await this.checkAndResolvePair(pairId);
        }
      } catch (err) {
        console.error('[Epoch Keeper] Error in loop:', err);
      }
      // Poll every 30 seconds
      await new Promise((r) => setTimeout(r, 30000));
    }
  }

  private async checkAndResolvePair(pairId: number) {
    if (!this.signer) return;

    const lotteryAbi = [
      'function currentEpochId(uint256 pairId) external view returns (uint256)',
      'function epochs(uint256 pairId, uint256 epochId) external view returns (uint256 startTime, uint256 totalBurnedPool, uint256 pairVolume, address crownedSheriff, bool isResolved, bool isRolledOver)',
      'function resolveEpoch(uint256 pairId, uint256 randomSeed) external'
    ];

    const lotteryContract = new ethers.Contract(CONFIG.CONTRACTS.LOTTERY_CORE, lotteryAbi, this.signer);

    try {
      const currentEpochId = await lotteryContract.currentEpochId(pairId);
      const epochData = await lotteryContract.epochs(pairId, currentEpochId);

      const startTime = Number(epochData.startTime);
      const isResolved = epochData.isResolved;
      const now = Math.floor(Date.now() / 1000);

      // Check if 1 hour has elapsed
      if (startTime > 0 && !isResolved && (now - startTime >= 3600)) {
        console.log(`[Epoch Keeper] Pair ${pairId} Epoch ${currentEpochId} is ready for resolution!`);
        
        // Generate cryptographic random seed
        const randomSeed = ethers.hexlify(ethers.randomBytes(32));

        console.log(`[Epoch Keeper] Calling resolveEpoch for pair ${pairId}...`);
        const tx = await lotteryContract.resolveEpoch(pairId, randomSeed);
        console.log(`[Epoch Keeper] Resolution tx sent: ${tx.hash}`);
        await tx.wait(1);
        console.log(`[Epoch Keeper] Epoch ${currentEpochId} on pair ${pairId} successfully resolved on Arbitrum!`);
      }
    } catch (err) {
      console.error(`[Epoch Keeper] Check failed for pair ${pairId}:`, err);
    }
  }
}
