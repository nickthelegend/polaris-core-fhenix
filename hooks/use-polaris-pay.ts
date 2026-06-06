import { useState, useCallback, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { usePolarisWallet } from "@/lib/hooks/usePolarisWallet"
import { CONTRACTS, ABIS, NETWORKS } from '@/lib/contracts';
import { logger } from '@/lib/logger';
import { parseRevertReason } from '@/lib/revert-mapper';

export function usePolarisPay() {
    const { connected: authenticated, address: walletAddress, networkId: walletNetworkId } = usePolarisWallet();

    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Mock wallet for compatibility with existing EVM logic.
    // Since this is Cardano native, but the backend/smart contracts are EVM (Sepolia),
    // we use window.ethereum as the fallback signer for EVM interactions.
    const wallet = {
        address: walletAddress,
        chainId: walletNetworkId?.toString() || '0',
        switchChain: async (id: number) => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    await (window as any).ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${id.toString(16)}` }],
                    });
                } catch (e) {
                    logger.error('POLARIS_PAY', "Failed to switch EVM chain", { error: e, targetChainId: id });
                }
            }
        },
        getEthereumProvider: async () => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                return (window as any).ethereum;
            }
            throw new Error("EVM Provider (Metamask) not found");
        }
    };

    const getSpokeConfig = useCallback((networkId: number) => {
        if (networkId === NETWORKS.SEPOLIA.id) return CONTRACTS.SPOKES.SEPOLIA;
        return CONTRACTS.SPOKES.SEPOLIA; // Default to Sepolia
    }, []);

    const getMasterConfig = useCallback(() => {
        return { config: CONTRACTS.MASTER, id: NETWORKS.SEPOLIA.id };
    }, []);

    const getContract = useCallback(async (address: string, abi: any, networkId: number, useSigner = true) => {
        const net = Object.values(NETWORKS).find(n => n.id === networkId);
        if (!net) throw new Error(`Network config not found for ID ${networkId}`);

        const actualAbi = abi.abi || abi;

        if (useSigner) {
            if (!wallet.address) throw new Error("Wallet not connected");

            const chainIdPart = wallet.chainId.includes(':') ? wallet.chainId.split(':')[1] : wallet.chainId;
            const currentChainId = parseInt(chainIdPart);

            if (currentChainId !== networkId) {
                logger.info('POLARIS_PAY', `Switching chain ${currentChainId} -> ${networkId}`);
                await wallet.switchChain(networkId);
            }
            const provider = new BrowserProvider(await wallet.getEthereumProvider());
            const signer = await provider.getSigner();
            return new Contract(address, actualAbi, signer);
        } else {
            const provider = new JsonRpcProvider(net.rpc);
            return new Contract(address, actualAbi, provider);
        }
    }, [wallet]);

    const depositLiquidity = useCallback(async (tokenAddress: string, amount: string, networkId: number) => {
        setLoading(true);
        try {
            const config = getSpokeConfig(networkId);
            const vault = await getContract(config.LIQUIDITY_VAULT, ABIS.LiquidityVault, networkId);
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId);

            let decimals = 18;
            try {
                const d = await token.decimals();
                decimals = Number(d);
            } catch (e) {
                console.warn("Could not fetch decimals, defaulting to 18");
            }

            const amountWei = parseUnits(amount, decimals);

            if (wallet?.address) {
                const balance = await token.balanceOf(wallet.address);
                if (balance < amountWei) {
                    const isTestnet = networkId === NETWORKS.SEPOLIA.id ||
                        networkId === NETWORKS.LOCAL_HARDHAT.id;
                    if (isTestnet) {
                        logger.info('POLARIS_PAY', `Insufficient balance(${formatUnits(balance, decimals)}). Auto-minting...`, { address: wallet.address, networkId });
                        try {
                            const mintAmount = amountWei * BigInt(10);
                            const mintTx = await token.mint(wallet.address, mintAmount);
                            await mintTx.wait();
                            logger.info('POLARIS_PAY', "Auto-mint successful.");
                        } catch (mintErr) {
                            logger.error('POLARIS_PAY', "Auto-mint failed", { error: mintErr });
                            throw new Error("Insufficient balance and faucet failed.");
                        }
                    } else {
                        throw new Error(`Insufficient Balance.You have ${formatUnits(balance, decimals)} ${await token.symbol()} `);
                    }
                }
            }

            logger.info('POLARIS_PAY', `Approving token on chain ${networkId}...`, { tokenAddress, vault: config.LIQUIDITY_VAULT });
            const approveTx = await token.approve(config.LIQUIDITY_VAULT, amountWei);
            await approveTx.wait();

            logger.info('POLARIS_PAY', `Depositing into vault on chain ${networkId}...`, { tokenAddress });
            const depositTx = await vault.deposit(tokenAddress, amountWei);
            const receipt = await depositTx.wait();

            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_PAY', "Deposit failed", { error, friendlyError, tokenAddress });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getSpokeConfig, getContract, wallet?.address]);

    const addLiquidityFromProof = useCallback(async (proof: {
        chainKey: any;
        blockHeight: any;
        encodedTransaction: string;
        merkleRoot: string;
        siblings: any[];
        lowerEndpointDigest: string;
        continuityRoots: string[];
    }) => {
        setLoading(true);
        const module = 'POLARIS_SYNC';
        try {
            logger.info(module, `Starting proof submission for block ${proof.blockHeight} on chain ${proof.chainKey}`);

            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);

            const continuityBlocks = proof.continuityRoots?.length || 1;
            const calculatedGas = 100000 + (continuityBlocks * 10000) + 100000;
            logger.info(module, `Calculated Gas Limit: ${calculatedGas} for ${continuityBlocks} continuity blocks.`);

            logger.info(module, "Running Pre-Flight staticCall verification...");
            try {
                await poolManager.addLiquidityFromProof.staticCall(
                    proof.chainKey,
                    proof.blockHeight,
                    proof.encodedTransaction,
                    proof.merkleRoot,
                    proof.siblings,
                    proof.lowerEndpointDigest,
                    proof.continuityRoots
                );
                logger.info(module, "Pre-Flight Passed.");
            } catch (staticError: any) {
                const reason = staticError.reason || staticError.message || "";
                logger.warn(module, "Pre-Flight Verification Failed", { reason });

                if (reason.includes("already processed") || reason.includes("replay")) {
                    logger.info(module, "Sync already completed previously.");
                    setTxHash("ALREADY_SYNCED");
                    return { hash: "ALREADY_SYNCED", status: 1 };
                }

                if (reason.includes("Continuity proof") || reason.includes("checkpoint") || reason.includes("match attestation")) {
                    logger.warn(module, "Hub Oracle Delay: Continuity roots not yet pushing to state.");
                    throw new Error("HUB_NOT_SYNCED");
                }

                if (reason.includes("Native verification failed")) {
                    throw new Error("VERIFICATION_FAILED: The specific cryptographic proof failed to verify against the current Hub state.");
                }

                throw new Error(`CONTRACT_REVERT: ${reason} `);
            }

            console.log("[POLARIS] 💸 Sending proof submission to PoolManager...");
            const tx = await poolManager.addLiquidityFromProof(
                proof.chainKey,
                proof.blockHeight,
                proof.encodedTransaction,
                proof.merkleRoot,
                proof.siblings,
                proof.lowerEndpointDigest,
                proof.continuityRoots,
                { gasLimit: calculatedGas }
            );

            logger.info(module, `Transaction Broadcasted: ${tx.hash}`);
            const receipt = await tx.wait();

            if (!receipt || receipt.status === 0) {
                throw new Error("TRANSACTION_FAILED: The transaction was mined but reverted.");
            }

            logger.info(module, `Sync Successful! Hub Tx: ${receipt.hash}`);
            setTxHash(receipt.hash);
            return receipt;

        } catch (error: any) {
            const friendlyError = parseRevertReason(error);
            logger.error(module, "FinalizeSync Failed", { error, friendlyError });
            if (friendlyError.includes("HUB_NOT_SYNCED") || error.message === "HUB_NOT_SYNCED") {
                throw new Error("The Hub hasn't registered this block's continuity roots yet. Please wait 2-3 minutes for the Oracle and try again.");
            }
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract]);

    const getPoolLiquidity = useCallback(async (tokenAddress: string) => {
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);
            const liquidity = await poolManager.getPoolLiquidity(tokenAddress);

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(liquidity, decimals);
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch liquidity failed", { error, tokenAddress });
            return "0";
        }
    }, [getMasterConfig, getContract]);

    const getTokenBalance = useCallback(async (tokenAddress: string, networkId: number) => {
        try {
            if (!wallet?.address) return "0";
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId, false);
            const balance = await token.balanceOf(wallet.address);

            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(balance, decimals);
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch balance failed", { error, tokenAddress });
            return "0";
        }
    }, [wallet?.address, getContract]);

    const getLPBalance = useCallback(async (tokenAddress: string) => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);
            const balance = await poolManager.getAssetBalance(wallet.address, tokenAddress);

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(balance, decimals);
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch LP balance failed", { error, tokenAddress });
            return "0";
        }
    }, [wallet?.address, getMasterConfig, getContract]);

    const getUserTotalCollateral = useCallback(async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);
            const total = await poolManager.getUserTotalCollateral(wallet.address);
            return formatUnits(total, 18);
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch total collateral failed", { error });
            return "0";
        }
    }, [wallet?.address, getMasterConfig, getContract]);

    const getTotalTVL = useCallback(async () => {
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id, false);

            let totalUSD = 0;
            let i = 0;

            while (i < 10) {
                try {
                    const tokenAddr = await poolManager.whitelistedTokens(i);
                    if (!tokenAddr || tokenAddr === ethers.ZeroAddress) break;

                    const liquidity = await poolManager.getPoolLiquidity(tokenAddr);

                    const token = await getContract(tokenAddr, ABIS.MockERC20, id, false);
                    let decimals = 18;
                    try { decimals = Number(await token.decimals()); } catch (e) { }

                    const formatted = parseFloat(formatUnits(liquidity, decimals));
                    totalUSD += formatted;
                    i++;
                } catch (e) {
                    break;
                }
            }
            return totalUSD.toString();
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch total TVL failed", { error });
            return "0";
        }
    }, [getMasterConfig, getContract]);

    const getVaultPhysicalBalance = useCallback(async (tokenAddress: string, networkId: number) => {
        try {
            const config = getSpokeConfig(networkId);
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId, false);
            const balance = await token.balanceOf(config.LIQUIDITY_VAULT);

            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            return formatUnits(balance, decimals);
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch physical vault balance failed", { error, tokenAddress });
            return "0";
        }
    }, [getSpokeConfig, getContract]);

    const getScore = useCallback(async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id, false);
            const score = await scoreManager.getScore(wallet.address);
            const scoreNum = Number(score);
            return scoreNum === 0 ? "300" : scoreNum.toString();
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch score failed", { error });
            return "300";
        }
    }, [wallet?.address, getMasterConfig, getContract]);

    const getCreditLimit = useCallback(async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();

            const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id, false);
            const totalLimit = await scoreManager.getCreditLimit(wallet.address);

            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const activeDebt = await loanEngine.userActiveDebt(wallet.address);

            const available = totalLimit > activeDebt ? totalLimit - activeDebt : BigInt(0);
            const limitVal = parseFloat(formatUnits(available, 18));

            if (limitVal === 0 && activeDebt === BigInt(0)) {
                const equity = await getUserTotalCollateral();
                return (parseFloat(equity) * 0.3).toString();
            }

            return limitVal.toString();
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch credit limit failed", { error });
            return "0";
        }
    }, [wallet?.address, getMasterConfig, getContract, getUserTotalCollateral]);

    const createLoan = useCallback(async (amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

            const tx = await loanEngine.createLoan(wallet?.address, amountWei, tokenAddress, { gasLimit: 5000000 });
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_LENDING', "Create loan failed", { error, friendlyError, amount, tokenAddress });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract, wallet?.address]);

    const repayLoan = useCallback(async (loanId: number, amount: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

            const loan = await loanEngine.loans(loanId);
            const tokenAddress = loan.poolToken;

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

            const tx = await loanEngine.repay(loanId, amountWei);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_LENDING', "Repay loan failed", { error, friendlyError, loanId, amount });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract]);

    const getLoans = useCallback(async () => {
        try {
            if (!wallet?.address) return [];
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const count = await loanEngine.loanCount();
            const loans = [];

            const decimalsCache: Record<string, number> = {};

            for (let i = 0; i < count; i++) {
                const loan = await loanEngine.loans(i);
                if (loan.borrower.toLowerCase() === wallet.address.toLowerCase()) {
                    let decimals = 18;
                    const tokenAddr = loan.poolToken;
                    if (tokenAddr && tokenAddr !== ethers.ZeroAddress) {
                        if (decimalsCache[tokenAddr] !== undefined) {
                            decimals = decimalsCache[tokenAddr];
                        } else {
                            try {
                                const token = await getContract(tokenAddr, ABIS.MockERC20, id, false);
                                decimals = Number(await token.decimals());
                                decimalsCache[tokenAddr] = decimals;
                            } catch { }
                        }
                    }

                    loans.push({
                        id: i,
                        principal: formatUnits(loan.principal, decimals),
                        interest: formatUnits(loan.interestAmount, decimals),
                        totalDebt: formatUnits(loan.principal + loan.interestAmount, decimals),
                        repaid: formatUnits(loan.repaid, decimals),
                        startTime: Number(loan.startTime),
                        status: Number(loan.status),
                        poolToken: loan.poolToken
                    });
                }
            }
            return loans;
        } catch (error) {
            logger.error('POLARIS_READ', "Fetch loans failed", { error });
            return [];
        }
    }, [wallet?.address, getMasterConfig, getContract]);

    const requestWithdrawal = useCallback(async (tokenAddress: string, amount: string, destChainId: number) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
            const amountWei = parseUnits(amount, 18);

            const tx = await poolManager.requestWithdrawal(tokenAddress, amountWei, destChainId);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_SETTLEMENT', "Withdrawal request failed", { error, friendlyError, tokenAddress, amount });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract]);

    const payWithCredit = useCallback(async (merchantAddress: string, amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const router = await getContract((config as any).MERCHANT_ROUTER, ABIS.MerchantRouter, id);

            const token = await getContract(tokenAddress, ABIS.MockERC20, id, false);
            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

            logger.info('POLARIS_PAY', `Paying merchant ${merchantAddress} via Hub...`, { amount, tokenAddress });
            const tx = await router.payWithCredit(merchantAddress, tokenAddress, amountWei, { gasLimit: 1000000 });
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_PAY', "Payment failed", { error, friendlyError, merchantAddress, amount });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract]);

    const mintTokens = useCallback(async (tokenAddress: string, amount: string, networkId: number) => {
        setLoading(true);
        try {
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId);

            let decimals = 18;
            try {
                const d = await token.decimals();
                decimals = Number(d);
            } catch (e) {
                console.warn("Could not fetch decimals, defaulting to 18");
            }

            const amountWei = parseUnits(amount, decimals);

            logger.info('POLARIS_PAY', `Minting tokens on chain ${networkId}...`, { tokenAddress, amount });
            const tx = await token.mint(wallet?.address, amountWei);
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_PAY', "Mint failed", { error, friendlyError, tokenAddress, amount });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getContract, wallet?.address]);

    const getAPY = useCallback(async () => {
        try {
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const rate = await loanEngine.INTEREST_RATE_BPS();
            const fee = await loanEngine.PROTOCOL_FEE_BPS();

            const baseRateNum = Number(rate) / 100; // e.g. 10.00
            const feeFactor = (10000 - Number(fee)) / 10000;
            return (baseRateNum * feeFactor).toFixed(2);
        } catch (e) {
            return "8.00";
        }
    }, [getMasterConfig, getContract]);

    const updateCreditProfile = useCallback(async (attestation: {
        collateral: string;
        debt: string;
        timestamp: number;
        signature: string;
    }) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const oracle = await getContract((config as any).CREDIT_ORACLE, ABIS.CreditOracle, id);

            console.log("[POLARIS] Updating Credit Profile on Hub...");
            const tx = await oracle.updateProfile(
                wallet?.address,
                attestation.collateral,
                attestation.debt,
                attestation.timestamp,
                attestation.signature
            );
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            logger.error('POLARIS_PAY', "Profile update failed", { error });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract, wallet?.address]);

    const getExternalNetValue = useCallback(async () => {
        try {
            if (!wallet?.address) return "0";
            const { config, id } = getMasterConfig();
            const oracle = await getContract((config as any).CREDIT_ORACLE, ABIS.CreditOracle, id, false);
            const value = await oracle.getExternalNetValue(wallet.address);
            return formatUnits(value, 18);
        } catch (error: any) {
            if (error.code === 'BAD_DATA') return "0";
            logger.error('POLARIS_READ', "Fetch external net value failed", { error });
            return "0";
        }
    }, [wallet?.address, getMasterConfig, getContract]);

    return {
        loading,
        txHash,
        depositLiquidity,
        addLiquidityFromProof,
        getPoolLiquidity,
        getTokenBalance,
        getLPBalance,
        getUserTotalCollateral,
        getTotalTVL,
        getVaultPhysicalBalance,
        getScore,
        getCreditLimit,
        createLoan,
        payWithCredit,
        repayLoan,
        getLoans,
        requestWithdrawal,
        mintTokens,
        getMasterConfig,
        getContract,
        authenticated,
        address: wallet?.address,
        chainId: wallet?.chainId,
        getAPY,
        updateCreditProfile,
        getExternalNetValue
    };
}
