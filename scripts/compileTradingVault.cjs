const fs = require('fs');
const path = require('path');
const solc = require('solc');

const vaultSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'core', 'TradingVault.sol'), 'utf8');
const ierc20Source = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'interfaces', 'IERC20.sol'), 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'contracts/core/TradingVault.sol': {
      content: vaultSource
    },
    'contracts/interfaces/IERC20.sol': {
      content: ierc20Source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const fatal = output.errors.filter(e => e.severity === 'error');
  if (fatal.length > 0) {
    console.error('Compilation errors:', fatal);
    process.exit(1);
  }
}

const contract = output.contracts['contracts/core/TradingVault.sol']['TradingVault'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const outPath = path.join(__dirname, '..', 'contracts', 'compiled_trading_vault.json');
fs.writeFileSync(outPath, JSON.stringify({ abi, bytecode }, null, 2), 'utf8');

console.log('✅ TradingVault compiled successfully! Output written to:', outPath);
