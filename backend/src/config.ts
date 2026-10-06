import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();

function reqEnv(name: string): string {
  const val = process.env[name];
  if (!val || !val.trim()) {
    throw new Error(`[CONFIG ERROR] Missing required environment variable: ${name}`);
  }
  return val.trim();
}

function reqAddress(name: string): string {
  const addr = reqEnv(name);
  if (!ethers.isAddress(addr) || /^0x0{40}$/i.test(addr)) {
    throw new Error(`[CONFIG ERROR] Invalid Ethereum address for ${name}: ${addr}`);
  }
  return ethers.getAddress(addr);
}

export const CONFIG = {
  ARBITRUM_RPC: reqEnv('ARBITRUM_RPC'),
  KEEPER_PRIVATE_KEY: process.env.KEEPER_PRIVATE_KEY?.trim() || '',
  ORDERLY_WS_URL: process.env.ORDERLY_WS_URL || 'wss://ws.orderly.org/ws/v2',
  BROKER_ID: process.env.BROKER_ID || 'trading_pnl_broker',
  
  // Smart Contract Addresses strictly verified
  CONTRACTS: {
    USDC: reqAddress('USDC_ADDRESS'),
    PNL_ROUTER: reqAddress('PNL_ROUTER_ADDRESS'),
    LOTTERY_CORE: reqAddress('LOTTERY_CORE_ADDRESS'),
    SUPER_JACKPOT: reqAddress('SUPER_JACKPOT_ADDRESS'),
    OPTION_VAULT: reqAddress('OPTION_VAULT_ADDRESS'),
    LP_POOL: reqAddress('LP_POOL_ADDRESS'),
    TREASURY: reqAddress('TREASURY_ADDRESS'),
  },

  // Security & Volume Gates
  VOLUME_GATE_HOURLY_MIN_USD: 2_000_000, // $2M hourly turnover to activate lottery
  MIN_QUORUM_PARTICIPANTS: 50,
  HEARTBEAT_PORT: process.env.HEARTBEAT_PORT ? parseInt(process.env.HEARTBEAT_PORT, 10) : 8080
};

