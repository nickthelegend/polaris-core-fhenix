import PoolManagerABI from './abis/PoolManager.json';
import LiquidityVaultABI from './abis/LiquidityVault.json';
import CreditVaultABI from './abis/CreditVault.json';
import LoanEngineABI from './abis/LoanEngine.json';
import InsurancePoolABI from './abis/InsurancePool.json';
import MerchantRouterABI from './abis/MerchantRouter.json';
import ObolusMerchantEscrowABI from './abis/ObolusMerchantEscrow.json';
import MockERC20ABI from './abis/MockERC20.json';
import MockOracleRelayerABI from './abis/MockOracleRelayer.json';
import ScoreManagerABI from './abis/ScoreManager.json';
import ProtocolFundsABI from './abis/ProtocolFunds.json';
import CreditOracleABI from './abis/CreditOracle.json';
import PrivateCollateralVaultABI from './abis/PrivateCollateralVault.json';
import PrivateBorrowManagerABI from './abis/PrivateBorrowManager.json';
import PrivateLendingPoolABI from './abis/PrivateLendingPool.json';
import PrivateLiquidationEngineABI from './abis/PrivateLiquidationEngine.json';
import PrivateSwapUSDCABI from './abis/PrivateSwapUSDC.json';
import PrivateSwapUSDTABI from './abis/PrivateSwapUSDT.json';
import PrivateSwapWETHABI from './abis/PrivateSwapWETH.json';
import PrivateSwapBNBABI from './abis/PrivateSwapBNB.json';
import PrivateScoreManagerABI from './abis/PrivateScoreManager.json';

export const CONTRACTS = {
    MASTER: {
        POOL_MANAGER: process.env.NEXT_PUBLIC_POOL_MANAGER || "",
        LOAN_ENGINE: process.env.NEXT_PUBLIC_LOAN_ENGINE || "",
        SCORE_MANAGER: process.env.NEXT_PUBLIC_SCORE_MANAGER || "",
        PROTOCOL_FUNDS: process.env.NEXT_PUBLIC_PROTOCOL_FUNDS || "",
        MERCHANT_ROUTER: process.env.NEXT_PUBLIC_MERCHANT_ROUTER || "",
        CREDIT_ORACLE: process.env.NEXT_PUBLIC_CREDIT_ORACLE || "",
        USDC: process.env.NEXT_PUBLIC_MOCK_USDC || "",
        ORACLE: "0x0000000000000000000000000000000000000FD2"
    },
    SPOKES: {
        SEPOLIA: {
            LIQUIDITY_VAULT: process.env.NEXT_PUBLIC_POOL_MANAGER || "",
            USDC: process.env.NEXT_PUBLIC_MOCK_USDC || "",
            USDT: process.env.NEXT_PUBLIC_MOCK_USDT || "",
            WETH: process.env.NEXT_PUBLIC_MOCK_WETH || "",
            BNB: process.env.NEXT_PUBLIC_MOCK_BNB || "",
            PRIVATE_SWAPS: {
                WETH: process.env.NEXT_PUBLIC_PRIVATE_SWAP_WETH || "",
                BNB: process.env.NEXT_PUBLIC_PRIVATE_SWAP_BNB || "",
                USDC: process.env.NEXT_PUBLIC_PRIVATE_SWAP_USDC || "",
                USDT: process.env.NEXT_PUBLIC_PRIVATE_SWAP_USDT || ""
            },
            PRIVATE_LENDING: {
                PRIVATE_LENDING_POOL: process.env.NEXT_PUBLIC_PRIVATE_LENDING_POOL || "",
                PRIVATE_BORROW_MANAGER: process.env.NEXT_PUBLIC_PRIVATE_BORROW_MANAGER || "",
                PRIVATE_COLLATERAL_VAULT: process.env.NEXT_PUBLIC_PRIVATE_COLLATERAL_VAULT || ""
            },
            id: 11155111
        }
    },
    SOURCE: {
        LIQUIDITY_VAULT: process.env.NEXT_PUBLIC_POOL_MANAGER || "",
        USDC: process.env.NEXT_PUBLIC_MOCK_USDC || "",
        USDT: process.env.NEXT_PUBLIC_MOCK_USDT || ""
    },
    PRIVATE_LENDING: {
        PRIVATE_COLLATERAL_VAULT: process.env.NEXT_PUBLIC_PRIVATE_COLLATERAL_VAULT || "",
        PRIVATE_BORROW_MANAGER: process.env.NEXT_PUBLIC_PRIVATE_BORROW_MANAGER || "",
        PRIVATE_LENDING_POOL: process.env.NEXT_PUBLIC_PRIVATE_LENDING_POOL || "",
        PRIVATE_LIQUIDATION_ENGINE: process.env.NEXT_PUBLIC_PRIVATE_LIQUIDATION_ENGINE || "",
        PRIVATE_SCORE_MANAGER: process.env.NEXT_PUBLIC_PRIVATE_SCORE_MANAGER || ""
    },
    LOCAL_HARDHAT: {
        PRIVATE_COLLATERAL_VAULT: process.env.NEXT_PUBLIC_PRIVATE_COLLATERAL_VAULT || "",
        PRIVATE_BORROW_MANAGER: process.env.NEXT_PUBLIC_PRIVATE_BORROW_MANAGER || "",
        PRIVATE_LENDING_POOL: process.env.NEXT_PUBLIC_PRIVATE_LENDING_POOL || "",
        PRIVATE_LIQUIDATION_ENGINE: process.env.NEXT_PUBLIC_PRIVATE_LIQUIDATION_ENGINE || ""
    }
};


export const ABIS = {
    PoolManager: PoolManagerABI,
    LiquidityVault: LiquidityVaultABI,
    CreditVault: CreditVaultABI,
    LoanEngine: LoanEngineABI,
    InsurancePool: InsurancePoolABI,
    MerchantRouter: MerchantRouterABI,
    ObolusMerchantEscrow: ObolusMerchantEscrowABI,
    MockERC20: MockERC20ABI,
    MockOracleRelayer: MockOracleRelayerABI,
    ScoreManager: ScoreManagerABI,
    ProtocolFunds: ProtocolFundsABI,
    CreditOracle: CreditOracleABI,
    PrivateCollateralVault: PrivateCollateralVaultABI,
    PrivateBorrowManager: PrivateBorrowManagerABI,
    PrivateLendingPool: PrivateLendingPoolABI,
    PrivateLiquidationEngine: PrivateLiquidationEngineABI,
    PrivateSwapUSDC: PrivateSwapUSDCABI,
    PrivateSwapUSDT: PrivateSwapUSDTABI,
    PrivateSwapWETH: PrivateSwapWETHABI,
    PrivateSwapBNB: PrivateSwapBNBABI,
    PrivateScoreManager: PrivateScoreManagerABI
};

export const NETWORKS = {
    SEPOLIA: {
        id: 11155111,
        name: "Eth Sepolia",
        rpc: "https://eth-sepolia.g.alchemy.com/v2/3qRB0TMQQv3hyKgav_6lF",
        explorer: "https://sepolia.etherscan.io",
        icon: "ethereum"
    },
    LOCAL_HARDHAT: {
        id: 31337,
        name: "Hardhat Local",
        rpc: "http://127.0.0.1:8545",
        explorer: "https://sepolia.etherscan.io",
        icon: "ethereum"
    }
};
