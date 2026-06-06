import { useState, useCallback, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACTS, ABIS, NETWORKS } from '@/lib/contracts';
import { logger } from '@/lib/logger';
import { parseRevertReason } from '@/lib/revert-mapper';
import { computeCreditLine, generateBNPLSchedule } from '@/lib/credit-utils';
import { getFhenixInstance, encrypt64 } from '@/lib/fhevm';

export function usePolaris() {
    const { address, isConnected, chainId: wagmiChainId } = useAccount();
    const { data: walletClient } = useWalletClient();

    const chainId = wagmiChainId ? String(wagmiChainId) : undefined;
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const getSpokeConfig = useCallback((networkId: number) => {
        if (networkId === 11155111) return CONTRACTS.SPOKES.SEPOLIA;
        return CONTRACTS.SPOKES.SEPOLIA;
    }, []);

    const getMasterConfig = useCallback(() => {
        return { config: CONTRACTS.MASTER, id: 11155111 };
    }, []);

    const getContract = useCallback(async (contractAddress: string, abi: any, networkId: number, useSigner = true) => {
        const actualAbi = abi.abi || abi;
        if (useSigner) {
            if (!address) throw new Error("Wallet not connected");
            const provider = new BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            return new Contract(contractAddress, actualAbi, signer);
        } else {
            const rpc = process.env.NEXT_PUBLIC_NETWORK_URL || "https://ethereum-sepolia-rpc.publicnode.com";
            const provider = new JsonRpcProvider(rpc);
            return new Contract(contractAddress, actualAbi, provider);
        }
    }, [address]);

    const encryptAmount = useCallback(
        async (amount: bigint, contractAddress: string): Promise<{ handle: string; proof: string }> => {
            if (!address) throw new Error('Wallet not connected');
            const { handles, inputProof } = await encrypt64(contractAddress as `0x${string}`, address as `0x${string}`, amount);
            return { handle: handles[0], proof: inputProof };
        },
        [address]
    );

    const depositLiquidity = useCallback(async (tokenAddress: string, amount: string, networkId: number) => {
        setLoading(true);
        try {
            const config = getSpokeConfig(networkId);
            const vault = await getContract(config.LIQUIDITY_VAULT, ABIS.LiquidityVault, networkId);
            const token = await getContract(tokenAddress, ABIS.MockERC20, networkId);

            let decimals = 18;
            try { decimals = Number(await token.decimals()); } catch (e) { }

            const amountWei = parseUnits(amount, decimals);

            if (address) {
                const balance = await token.balanceOf(address);
                if (balance < amountWei) {
                    if (networkId === NETWORKS.SEPOLIA.id) {
                        try {
                            const mintTx = await token.mint(address, amountWei * BigInt(10));
                            await mintTx.wait();
                        } catch (e) { }
                    }
                }
            }

            const approveTx = await token.approve(config.LIQUIDITY_VAULT, amountWei);
            await approveTx.wait();

            const depositTx = await vault.deposit(tokenAddress, amountWei);
            const receipt = await depositTx.wait();

            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_CORE', "Deposit failed", { error, friendlyError });
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getSpokeConfig, getContract, address]);

    const addLiquidityFromProof = useCallback(async (proof: any) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
            
            const tx = await poolManager.addLiquidityFromProof(
                proof.chainKey, proof.blockHeight, proof.encodedTransaction,
                proof.merkleRoot, proof.siblings, proof.lowerEndpointDigest, proof.continuityRoots,
                { gasLimit: 2000000 }
            );
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            logger.error('POLARIS_SYNC', "Sync failed", { error, friendlyError });
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
            return formatUnits(liquidity, 18);
        } catch (error) {
            return "0";
        }
    }, [getMasterConfig, getContract]);

    const getLPBalanceHandle = useCallback(async (tokenAddress: string) => {
        if (!address) return ethers.ZeroHash;
        const { config, id } = getMasterConfig();
        const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
        return await poolManager.getLpShares(address, tokenAddress);
    }, [address, getMasterConfig, getContract]);

    const getUserTotalCollateralHandle = useCallback(async () => {
        if (!address) return ethers.ZeroHash;
        const { config, id } = getMasterConfig();
        const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
        return await poolManager.getUserTotalCollateral(address);
    }, [address, getMasterConfig, getContract]);

    const getScoreHandle = useCallback(async () => {
        if (!address) return ethers.ZeroHash;
        const { config, id } = getMasterConfig();
        const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id);
        return await scoreManager.getScore(address);
    }, [address, getMasterConfig, getContract]);

    const getCreditLimitHandle = useCallback(async () => {
        if (!address) return ethers.ZeroHash;
        const { config, id } = getMasterConfig();
        const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id);
        return await scoreManager.getCreditLimit(address);
    }, [address, getMasterConfig, getContract]);

    const createLoan = useCallback(async (amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const amountWei = parseUnits(amount, 18); // Default to 18 for Hub internal math
            const { handle, proof } = await encryptAmount(amountWei, config.LOAN_ENGINE);
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

            const tx = await loanEngine.createLoan(address, handle, proof, tokenAddress, { gasLimit: 2000000 });
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract, address, encryptAmount]);

    const repayLoan = useCallback(async (loanId: number, amount: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const amountWei = parseUnits(amount, 18);
            const { handle, proof } = await encryptAmount(amountWei, config.LOAN_ENGINE);
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

            const tx = await loanEngine.repay(loanId, handle, proof);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract, encryptAmount]);

    const requestWithdrawal = useCallback(async (tokenAddress: string, amount: string, destChainId: number) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const amountWei = parseUnits(amount, 18);
            const { handle, proof } = await encryptAmount(amountWei, config.POOL_MANAGER);
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);

            const tx = await poolManager.requestWithdrawal(tokenAddress, handle, proof, destChainId);
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract, encryptAmount]);

    const finalizeWithdrawal = useCallback(async (nonce: number, clearResult: string, proof: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
            const tx = await poolManager.finalizeWithdrawal(nonce, clearResult, proof);
            const receipt = await tx.wait();
            return receipt;
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract]);

    const payWithCredit = useCallback(async (merchantAddress: string, amount: string, tokenAddress: string) => {
        setLoading(true);
        try {
            const { config, id } = getMasterConfig();
            const amountWei = parseUnits(amount, 18);
            const { handle, proof } = await encryptAmount(amountWei, config.MERCHANT_ROUTER);
            const router = await getContract(config.MERCHANT_ROUTER, ABIS.MerchantRouter, id);

            const tx = await router.payWithCredit(merchantAddress, tokenAddress, handle, proof, { gasLimit: 2000000 });
            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            return receipt;
        } catch (error) {
            const friendlyError = parseRevertReason(error);
            throw new Error(friendlyError);
        } finally {
            setLoading(false);
        }
    }, [getMasterConfig, getContract, encryptAmount]);

    const getLoans = useCallback(async () => {
        try {
            if (!address) return [];
            const { config, id } = getMasterConfig();
            const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id, false);
            const count = await loanEngine.loanCount();
            const loans = [];

            for (let i = 0; i < Number(count); i++) {
                const loan = await loanEngine.loans(i);
                if (loan.borrower.toLowerCase() === address.toLowerCase()) {
                    loans.push({
                        id: i,
                        principal: formatUnits(loan.principal, 18),
                        interest: formatUnits(loan.interestAmount, 18),
                        totalDebt: formatUnits(BigInt(loan.principal) + BigInt(loan.interestAmount), 18),
                        repaid: formatUnits(loan.repaid, 18),
                        startTime: Number(loan.startTime),
                        status: Number(loan.status),
                        poolToken: loan.poolToken
                    });
                }
            }
            return loans;
        } catch (error) {
            return [];
        }
    }, [address, getMasterConfig, getContract]);

    return {
        loading, txHash,
        depositLiquidity, addLiquidityFromProof, getPoolLiquidity,
        getLPBalanceHandle, getUserTotalCollateralHandle,
        getScoreHandle, getCreditLimitHandle,
        createLoan, payWithCredit, repayLoan, getLoans,
        requestWithdrawal, finalizeWithdrawal,
        getMasterConfig, getContract,
        authenticated: isConnected, address, chainId,
        encryptAmount
    };
}
