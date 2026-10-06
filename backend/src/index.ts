import { PnLInterceptor } from './interceptor/pnlInterceptor.js';
import { EpochKeeper } from './keeper/epochKeeper.js';
import { FailoverWatchdog } from './keeper/watchdog.js';

console.log('====================================================');
console.log('🚀 TRADING PnL & 0DTE OPTIONS BACKEND DAEMON STARTING');
console.log('====================================================');

const isBackupInstance = process.env.IS_BACKUP_INSTANCE === 'true';

if (isBackupInstance) {
  console.log('[Mode] Running as Hot-Standby Failover Keeper...');
  const watchdog = new FailoverWatchdog();
  watchdog.start();
} else {
  console.log('[Mode] Running as Primary Node (Interceptor + Keeper)...');
  
  // 1. Launch PnL Interceptor (Orderly WebSocket)
  const interceptor = new PnLInterceptor();
  interceptor.start();

  // 2. Launch Epoch Keeper (Hourly resolver with Aegis checks)
  const keeper = new EpochKeeper();
  keeper.start();
}
