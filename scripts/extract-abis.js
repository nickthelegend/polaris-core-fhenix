const fs = require('fs');
const path = require('path');

const sourceDir = 'd:/Project/ctc/obolus-protocol/artifacts/contracts';
const targetDir = 'd:/Project/ctc/PayEase/lib/abis';

const contracts = [
    { name: 'PoolManager', path: 'PoolManager.sol/PoolManager.json' },
    { name: 'LiquidityVault', path: 'LiquidityVault.sol/LiquidityVault.json' },
    { name: 'CreditVault', path: 'CreditVault.sol/CreditVault.json' },
    { name: 'LoanEngine', path: 'LoanEngine.sol/LoanEngine.json' },
    { name: 'InsurancePool', path: 'InsurancePool.sol/InsurancePool.json' },
    { name: 'MerchantRouter', path: 'MerchantRouter.sol/MerchantRouter.json' },
    { name: 'MockERC20', path: 'mocks/MockERC20.sol/MockERC20.json' }
];

contracts.forEach(contract => {
    const fullPath = path.join(sourceDir, contract.path);
    if (fs.existsSync(fullPath)) {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const abiPath = path.join(targetDir, `${contract.name}.json`);
        fs.writeFileSync(abiPath, JSON.stringify(data.abi, null, 2));
        console.log(`Extracted ABI for ${contract.name}`);
    } else {
        console.error(`Source not found for ${contract.name} at ${fullPath}`);
    }
});
