const fs = require('fs');
const path = require('path');

const sourceDir = 'd:/Project/fhenix/polaris-protocol-fhenix/artifacts/contracts';
const targetCoreDir = 'd:/Project/fhenix/polaris-core-fhenix/lib/abis';
const targetMerchantDir = 'd:/Project/fhenix/polaris-merchant-app-fhenix/lib/abis';

const contracts = [
    { name: 'PoolManager', path: 'PoolManager.sol/PoolManager.json' },
    { name: 'LoanEngine', path: 'LoanEngine.sol/LoanEngine.json' },
    { name: 'CreditOracle', path: 'CreditOracle.sol/CreditOracle.json' },
    { name: 'ScoreManager', path: 'ScoreManager.sol/ScoreManager.json' },
    { name: 'ProtocolFunds', path: 'ProtocolFunds.sol/ProtocolFunds.json' },
    { name: 'MerchantRouter', path: 'MerchantRouter.sol/MerchantRouter.json' },
    { name: 'PrivateCollateralVault', path: 'PrivateCollateralVault.sol/PrivateCollateralVault.json' },
    { name: 'PrivateBorrowManager', path: 'PrivateBorrowManager.sol/PrivateBorrowManager.json' },
    { name: 'PrivateLendingPool', path: 'PrivateLendingPool.sol/PrivateLendingPool.json' },
    { name: 'PrivateLiquidationEngine', path: 'PrivateLiquidationEngine.sol/PrivateLiquidationEngine.json' },
    { name: 'PrivateScoreManager', path: 'PrivateScoreManager.sol/PrivateScoreManager.json' },
    { name: 'MockERC20', path: 'mocks/MockERC20.sol/MockERC20.json' }
];

contracts.forEach(contract => {
    const fullPath = path.join(sourceDir, contract.path);
    if (fs.existsSync(fullPath)) {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        
        // Write to core abis
        const coreAbiPath = path.join(targetCoreDir, `${contract.name}.json`);
        fs.writeFileSync(coreAbiPath, JSON.stringify(data, null, 2)); // Keep as full compiler artifact or just data.abi? Let's write the full artifact to keep compatibility, wait, getAbi handles both! Let's write full artifact.
        
        // Write to merchant abis
        if (fs.existsSync(targetMerchantDir)) {
            const merchantAbiPath = path.join(targetMerchantDir, `${contract.name}.json`);
            fs.writeFileSync(merchantAbiPath, JSON.stringify(data, null, 2));
        }
        
        console.log(`✅ Extracted ABI for ${contract.name}`);
    } else {
        console.error(`❌ Source not found for ${contract.name} at ${fullPath}`);
    }
});
