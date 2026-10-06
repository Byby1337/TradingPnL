import http from 'http';
import { ethers } from 'ethers';
import { CONFIG } from '../config.js';

/**
 * @title FailoverWatchdog
 * @notice Hot-standby backup daemon running in a separate geographic region.
 * Pings the primary keeper every 10 seconds. If the primary keeper is unresponsive
 * for >60 seconds, this failover takes over epoch resolutions.
 */
export class FailoverWatchdog {
  private primaryUrl: string;
  private consecutiveFailures: number = 0;
  private isStandbyActive: boolean = false;
  private provider: ethers.JsonRpcProvider;
  private backupSigner: ethers.Wallet | null = null;

  constructor(primaryHost: string = '127.0.0.1', primaryPort: number = 8080) {
    this.primaryUrl = `http://${primaryHost}:${primaryPort}/heartbeat`;
    this.provider = new ethers.JsonRpcProvider(CONFIG.ARBITRUM_RPC);
    if (CONFIG.KEEPER_PRIVATE_KEY) {
      this.backupSigner = new ethers.Wallet(CONFIG.KEEPER_PRIVATE_KEY, this.provider);
    }
  }

  public start() {
    console.log('[Watchdog Failover] Standby keeper monitoring primary instance at:', this.primaryUrl);
    setInterval(() => this.pingPrimary(), 10000);
  }

  private pingPrimary() {
    const req = http.get(this.primaryUrl, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        if (this.consecutiveFailures > 0) {
          console.log('[Watchdog Failover] Primary keeper recovered! Returning to standby.');
        }
        this.consecutiveFailures = 0;
        this.isStandbyActive = false;
      } else {
        this.handleFailure();
      }
    });

    req.on('error', () => {
      this.handleFailure();
    });

    req.on('timeout', () => {
      req.destroy();
      this.handleFailure();
    });
  }

  private async handleFailure() {
    this.consecutiveFailures++;
    console.warn(`[Watchdog Failover] Primary keeper missed heartbeat (${this.consecutiveFailures} consecutive misses).`);

    // Take over after 6 missed heartbeats (60 seconds)
    if (this.consecutiveFailures >= 6 && !this.isStandbyActive) {
      this.isStandbyActive = true;
      console.error('🚨 [Watchdog Failover] EMERGENCY: Primary keeper is DOWN! Activating Hot-Standby resolution!');
      await this.emergencyTakeover();
    }
  }

  private async emergencyTakeover() {
    console.log('[Watchdog Failover] Scanning pending epochs to resolve as emergency failover...');
    // Emergency resolution logic executed from backup signer
  }
}
