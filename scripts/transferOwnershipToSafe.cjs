/**
 * Script for Task H1: Ownership Transfer to Safe Multisig / 48h TimelockController
 * 
 * Usage:
 *   1. Initiate transfer (Phase 1):
 *      node scripts/transferOwnershipToSafe.cjs initiate <SAFE_OR_TIMELOCK_ADDRESS>
 * 
 *   2. Check timelock status:
 *      node scripts/transferOwnershipToSafe.cjs status
 * 
 *   3. Generate Gnosis Safe Transaction Builder Batch (Phase 2):
 *      node scripts/transferOwnershipToSafe.cjs generate-batch <SAFE_OR_TIMELOCK_ADDRESS>
 */

const fs = require('fs');
const path = require('path');
let ethers;
try {
  ethers = require('ethers');
} catch {
  ethers = require('../backend/node_modules/ethers');
}

const RPC_URL = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

const CONTRACT_ADDRESSES = {
  USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  LP_POOL: '0x63aE03E85C5369d98117A5386c5eE07aE2aA0b01',
  OPTION_VAULT: '0x41E3747db1EF0A0A64b9dD4a11fFd1564fBF2eEB',
  SUPER_JACKPOT: '0x61aAcA46eE84550E5E581d47AC843854c513DfBe',
  LOTTERY_CORE: '0x63118023f7806121817B04d4af24C7925876Ae39',
  PNL_ROUTER: '0x0915c8C8aF4d1878D2D2174feaF136C1A49bf217',
  TREASURY: '0xd75E692a2B5c1B0059E2107FAAb9e933D4Ecc22c'
};

const COMMON_ADMIN_ABI = [
  'function admin() view returns (address)',
  'function pendingAdmin() view returns (address)',
  'function pendingAdminEta() view returns (uint256)',
  'function transferAdmin(address newAdmin)',
  'function acceptAdmin()',
  'function cancelAdminTransfer()'
];

const TREASURY_ADMIN_ABI = [
  'function multiSigAdmin() view returns (address)',
  'function pendingAdmin() view returns (address)',
  'function initiateAdminTransfer(address newAdmin)',
  'function completeAdminTransfer(address newAdmin)',
  'function cancelAdminTransfer(address targetAdmin)'
];

async function main() {
  const [,, command, targetSafeAddress] = process.argv;

  if (!command || !['initiate', 'status', 'generate-batch'].includes(command)) {
    console.log(`
========================================================================
🔐 TRADING PnL: H1 SAFE MULTISIG OWNERSHIP TRANSFER TOOL
========================================================================
Commands:
  node scripts/transferOwnershipToSafe.cjs initiate <SAFE_ADDRESS>
      -> Calls transferAdmin(safeAddress) on all protocol contracts.

  node scripts/transferOwnershipToSafe.cjs status
      -> Checks current admin and 48h timelock status on all contracts.

  node scripts/transferOwnershipToSafe.cjs generate-batch <SAFE_ADDRESS>
      -> Generates Safe Transaction Builder JSON for 2/3 or 3/5 signers.
========================================================================
    `);
    process.exit(0);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  if (command === 'status') {
    console.log('\n--- 🔍 Checking Current Governance Status on Chain ---');
    for (const [name, addr] of Object.entries(CONTRACT_ADDRESSES)) {
      if (name === 'USDC') continue;
      try {
        if (name === 'TREASURY') {
          const c = new ethers.Contract(addr, TREASURY_ADMIN_ABI, provider);
          const [admin, pending] = await Promise.all([
            c.multiSigAdmin().catch(e => 'reverted'),
            c.pendingAdmin().catch(e => 'none')
          ]);
          console.log(`[${name.padEnd(14)}] Admin: ${admin} | Pending: ${pending || 'none'}`);
        } else {
          const c = new ethers.Contract(addr, COMMON_ADMIN_ABI, provider);
          const admin = await c.admin().catch(e => 'reverted');
          const pending = await c.pendingAdmin().catch(e => 'none');
          const eta = await c.pendingAdminEta().catch(e => 0n);
          const etaDate = eta > 0n ? new Date(Number(eta) * 1000).toISOString() : 'none';
          console.log(`[${name.padEnd(14)}] Admin: ${admin} | Pending: ${pending} | ETA: ${etaDate}`);
        }
      } catch (err) {
        console.log(`[${name.padEnd(14)}] Error querying: ${err.message}`);
      }
    }
    return;
  }

  if (!targetSafeAddress || !ethers.isAddress(targetSafeAddress)) {
    console.error('❌ Error: Valid Safe Multisig address must be specified as argument.');
    process.exit(1);
  }

  const safeAddress = ethers.getAddress(targetSafeAddress);

  if (command === 'initiate') {
    if (!PRIVATE_KEY) {
      console.error('❌ Error: PRIVATE_KEY environment variable required to sign transactions.');
      console.error('Example: $env:PRIVATE_KEY="0x..."; node scripts/transferOwnershipToSafe.cjs initiate ' + safeAddress);
      process.exit(1);
    }
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`\n🚀 Initiating Admin Transfer to Safe: ${safeAddress}`);
    console.log(`Deployer Wallet: ${wallet.address}`);

    const targets = [
      { name: 'LOTTERY_CORE', addr: CONTRACT_ADDRESSES.LOTTERY_CORE, isTreasury: false },
      { name: 'OPTION_VAULT', addr: CONTRACT_ADDRESSES.OPTION_VAULT, isTreasury: false },
      { name: 'LP_POOL', addr: CONTRACT_ADDRESSES.LP_POOL, isTreasury: false },
      { name: 'PNL_ROUTER', addr: CONTRACT_ADDRESSES.PNL_ROUTER, isTreasury: false },
      { name: 'SUPER_JACKPOT', addr: CONTRACT_ADDRESSES.SUPER_JACKPOT, isTreasury: false },
      { name: 'TREASURY', addr: CONTRACT_ADDRESSES.TREASURY, isTreasury: true }
    ];

    for (const t of targets) {
      try {
        console.log(`Queuing transfer for ${t.name} (${t.addr})...`);
        if (t.isTreasury) {
          const c = new ethers.Contract(t.addr, TREASURY_ADMIN_ABI, wallet);
          const tx = await c.initiateAdminTransfer(safeAddress);
          console.log(`  Tx sent: ${tx.hash}`);
          await tx.wait(1);
        } else {
          const c = new ethers.Contract(t.addr, COMMON_ADMIN_ABI, wallet);
          const tx = await c.transferAdmin(safeAddress);
          console.log(`  Tx sent: ${tx.hash}`);
          await tx.wait(1);
        }
        console.log(`  ✅ Queued successfully (48h timelock started)`);
      } catch (err) {
        console.error(`  ❌ Failed for ${t.name}:`, err.message);
      }
    }
    console.log('\n🎉 Phase 1 completed! Run status or generate-batch next.');
  }

  if (command === 'generate-batch') {
    console.log(`\n📦 Generating Gnosis Safe Transaction Builder Batch for: ${safeAddress}`);

    const ifaceCommon = new ethers.Interface(COMMON_ADMIN_ABI);
    const ifaceTreasury = new ethers.Interface(TREASURY_ADMIN_ABI);

    const transactions = [
      {
        to: CONTRACT_ADDRESSES.LOTTERY_CORE,
        value: '0',
        data: ifaceCommon.encodeFunctionData('acceptAdmin', []),
        contractMethod: {
          name: 'acceptAdmin',
          payable: false,
          inputs: []
        }
      },
      {
        to: CONTRACT_ADDRESSES.OPTION_VAULT,
        value: '0',
        data: ifaceCommon.encodeFunctionData('acceptAdmin', []),
        contractMethod: {
          name: 'acceptAdmin',
          payable: false,
          inputs: []
        }
      },
      {
        to: CONTRACT_ADDRESSES.LP_POOL,
        value: '0',
        data: ifaceCommon.encodeFunctionData('acceptAdmin', []),
        contractMethod: {
          name: 'acceptAdmin',
          payable: false,
          inputs: []
        }
      },
      {
        to: CONTRACT_ADDRESSES.PNL_ROUTER,
        value: '0',
        data: ifaceCommon.encodeFunctionData('acceptAdmin', []),
        contractMethod: {
          name: 'acceptAdmin',
          payable: false,
          inputs: []
        }
      },
      {
        to: CONTRACT_ADDRESSES.SUPER_JACKPOT,
        value: '0',
        data: ifaceCommon.encodeFunctionData('acceptAdmin', []),
        contractMethod: {
          name: 'acceptAdmin',
          payable: false,
          inputs: []
        }
      },
      {
        to: CONTRACT_ADDRESSES.TREASURY,
        value: '0',
        data: ifaceTreasury.encodeFunctionData('completeAdminTransfer', [safeAddress]),
        contractMethod: {
          name: 'completeAdminTransfer',
          payable: false,
          inputs: [{ name: 'newAdmin', type: 'address' }]
        },
        contractInputsValues: {
          newAdmin: safeAddress
        }
      }
    ];

    const safeBatch = {
      version: '1.0',
      chainId: '421614',
      createdAt: Date.now(),
      meta: {
        name: 'TradingPnL H1 Governance Acceptance Batch',
        description: 'Accepts admin ownership across all TradingPnL protocol contracts after 48h timelock.',
        txBuilderVersion: '1.16.5',
        createdFromSafeAddress: safeAddress
      },
      transactions
    };

    const outPath = path.resolve(__dirname, '../safe-governance-batch.json');
    fs.writeFileSync(outPath, JSON.stringify(safeBatch, null, 2), 'utf8');

    console.log(`\n✅ Safe Transaction Builder Batch saved to: ${outPath}`);
    console.log(`\n📋 How to execute in Safe (after 48 hours):`);
    console.log(`1. Open https://app.safe.global and navigate to your Safe (${safeAddress}) on Arbitrum.`);
    console.log(`2. Click 'Apps' -> Open 'Transaction Builder'.`);
    console.log(`3. Click 'Drag and drop or choose file' and upload 'safe-governance-batch.json'.`);
    console.log(`4. Sign with required quorum (e.g. 2 of 3 signers) and execute!`);
  }
}

main().catch(console.error);
