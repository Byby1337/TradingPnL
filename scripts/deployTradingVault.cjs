/**
 * Deploy Script for TradingVault on Arbitrum Sepolia
 *
 * Usage:
 *   node scripts/deployTradingVault.cjs [PRIVATE_KEY]
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Safe .env loader
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const RPC_URL = process.env.ARBITRUM_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = process.argv[2] || process.env.PRIVATE_KEY;

const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const TREASURY_ADDRESS = '0xd75E692a2B5c1B0059E2107FAAb9e933D4Ecc22c';

if (!PRIVATE_KEY) {
  console.log(`
========================================================================
🚀 ДЕПЛОЙ КОНТРАКТА TRADING VAULT НА ARBITRUM SEPOLIA
========================================================================
Укажите приватный ключ деплоера:
  node scripts/deployTradingVault.cjs 0xВАШ_ПРИВАТНЫЙ_КЛЮЧ

Или укажите PRIVATE_KEY=0x... в файле .env
========================================================================
  `);
  process.exit(1);
}

async function main() {
  console.log('\n======================================================');
  console.log('🚀 РАЗВЕРТЫВАНИЕ TRADING VAULT В ARBITRUM SEPOLIA');
  console.log('======================================================');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📡 Сеть RPC: ${RPC_URL}`);
  console.log(`👛 Адрес деплоера: ${wallet.address}`);

  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`💰 Баланс ETH: ${ethers.formatEther(ethBalance)} ETH`);

  if (ethBalance === 0n) {
    console.error('❌ Ошибка: на кошельке нет тестового ETH на Arbitrum Sepolia для оплаты газа.');
    process.exit(1);
  }

  const compiled = require('../contracts/compiled_trading_vault.json');
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);

  console.log('\n⏳ Отправка транзакции развертывания TradingVault...');
  console.log(`   - USDC: ${USDC_ADDRESS}`);
  console.log(`   - Admin: ${wallet.address}`);
  console.log(`   - Clearing Gateway: ${wallet.address}`);
  console.log(`   - Treasury: ${TREASURY_ADDRESS}`);

  const contract = await factory.deploy(
    USDC_ADDRESS,
    wallet.address,
    wallet.address,
    TREASURY_ADDRESS
  );

  console.log(`📝 Tx Hash: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Ожидание включения в блок Arbitrum Sepolia...');

  await contract.waitForDeployment();
  const vaultAddress = await contract.getAddress();

  console.log('\n======================================================');
  console.log(`🎉 TradingVault успешно развернут по адресу:`);
  console.log(`👉 ${vaultAddress}`);
  console.log(`🔍 Arbiscan: https://sepolia.arbiscan.io/address/${vaultAddress}`);
  console.log('======================================================\n');

  // Update src/constants/contracts.ts
  const contractsPath = path.join(__dirname, '..', 'src', 'constants', 'contracts.ts');
  if (fs.existsSync(contractsPath)) {
    let src = fs.readFileSync(contractsPath, 'utf8');
    if (src.includes('TRADING_VAULT:')) {
      src = src.replace(/TRADING_VAULT:\s*"0x[a-fA-F0-9]{40}"/, `TRADING_VAULT: "${vaultAddress}"`);
    } else {
      src = src.replace(
        /CONTRACT_ADDRESSES\s*=\s*{/,
        `CONTRACT_ADDRESSES = {\n  TRADING_VAULT: "${vaultAddress}",`
      );
    }
    fs.writeFileSync(contractsPath, src, 'utf8');
    console.log('✅ Адрес TRADING_VAULT добавлен в src/constants/contracts.ts!');
  }

  // Update .env
  const envPath = path.join(__dirname, '..', '.env');
  let envSrc = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (envSrc.includes('TRADING_VAULT_ADDRESS=')) {
    envSrc = envSrc.replace(/TRADING_VAULT_ADDRESS=.*/, `TRADING_VAULT_ADDRESS=${vaultAddress}`);
  } else {
    envSrc += `\nTRADING_VAULT_ADDRESS=${vaultAddress}\n`;
  }
  fs.writeFileSync(envPath, envSrc.trim() + '\n', 'utf8');
  console.log('✅ Адрес TRADING_VAULT_ADDRESS записан в .env!');
}

main().catch((err) => {
  console.error('❌ Ошибка развертывания:', err);
  process.exit(1);
});
