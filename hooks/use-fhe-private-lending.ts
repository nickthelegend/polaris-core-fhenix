import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { usePolaris } from '@/hooks/use-polaris';
import { CONTRACTS, ABIS, NETWORKS } from '@/lib/contracts';
import { getFhenixInstance, encrypt64 } from '@/lib/fhevm';
import { logger } from '@/lib/logger';
import { parseRevertReason } from '@/lib/revert-mapper';

// ─── State shape ────────────────────────────────────────────────────────────

interface FhePrivateLendingState {
  collateralBalance: bigint | null;
  debtBalance: bigint | null;
  suppliedBalance: bigint | null;
  creditScore: number | null;
  creditLimit: bigint | null;
  loading: boolean;
  error: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFhePrivateLending() {
  const { getContract, address, getMasterConfig } = usePolaris();

  const [state, setState] = useState<FhePrivateLendingState>({
    collateralBalance: null,
    debtBalance: null,
    suppliedBalance: null,
    creditScore: null,
    creditLimit: null,
    loading: false,
    error: null,
  });

  const encryptAmount = useCallback(
    async (amount: bigint, contractAddress: string): Promise<{ handle: string; proof: string }> => {
      if (!address) throw new Error('Wallet not connected');
      const { handles, inputProof } = await encrypt64(contractAddress as `0x${string}`, address as `0x${string}`, amount);
      return { handle: handles[0], proof: inputProof };
    },
    [address]
  );

  const decryptAllPositions = useCallback(async (tokenAddress: string) => {
    if (!address) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const { config, id } = getMasterConfig();
      const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
      const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);
      const scoreManager = await getContract(config.SCORE_MANAGER, ABIS.ScoreManager, id);

      const [sHandle, dHandle, cHandle, scoreHandle, limitHandle] = await Promise.all([
        poolManager.getLpShares(address, tokenAddress),
        loanEngine.getUserActiveDebt(address),
        poolManager.getUserTotalCollateral(address),
        scoreManager.getScore(address),
        scoreManager.getCreditLimit(address)
      ]);

      const fhevm = await getFhenixInstance();
      const { publicKey, privateKey } = fhevm.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1;
      
      const contractAddresses = [config.POOL_MANAGER, config.LOAN_ENGINE, config.SCORE_MANAGER];
      const handleContractPairs = [
        { handle: sHandle, contractAddress: config.POOL_MANAGER },
        { handle: dHandle, contractAddress: config.LOAN_ENGINE },
        { handle: cHandle, contractAddress: config.POOL_MANAGER },
        { handle: scoreHandle, contractAddress: config.SCORE_MANAGER },
        { handle: limitHandle, contractAddress: config.SCORE_MANAGER }
      ].filter(p => p.handle && p.handle !== '0x' + '0'.repeat(64));

      if (handleContractPairs.length === 0) {
        setState(s => ({ ...s, suppliedBalance: 0n, debtBalance: 0n, collateralBalance: 0n, creditScore: 300, creditLimit: 0n, loading: false }));
        return;
      }

      const eip712 = fhevm.createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const { EIP712Domain, ...types } = (eip712 as any).types;
      const signature = await signer.signTypedData((eip712 as any).domain, types, (eip712 as any).message);

      const results = await fhevm.userDecrypt(
        handleContractPairs,
        privateKey,
        publicKey,
        signature,
        contractAddresses,
        address,
        startTimestamp,
        durationDays
      );

      const parse = (h: string) => {
        const val = results[h as `0x${string}`];
        return val === undefined ? 0n : BigInt(val);
      };

      setState(s => ({
        ...s,
        suppliedBalance: parse(sHandle),
        debtBalance: parse(dHandle),
        collateralBalance: parse(cHandle),
        creditScore: Number(parse(scoreHandle)),
        creditLimit: parse(limitHandle),
        loading: false
      }));
    } catch (err) {
      logger.error('FHE_PRIVATE_LENDING', 'decryptAllPositions failed', { error: err });
      setState(s => ({ ...s, loading: false }));
      throw err;
    }
  }, [address, getMasterConfig, getContract]);

  const supply = useCallback(async (amount: bigint, tokenAddress: string): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { config, id } = getMasterConfig();
      const { handle, proof } = await encryptAmount(amount, config.POOL_MANAGER);
      const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
      
      const tx = await poolManager.supply(tokenAddress, handle, proof, Number(amount));
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [encryptAmount, getContract, getMasterConfig]);

  const borrow = useCallback(async (amount: bigint, tokenAddress: string): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { config, id } = getMasterConfig();
      const { handle, proof } = await encryptAmount(amount, config.LOAN_ENGINE);
      const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);
      
      // createLoan(address user, euint64 amount, address poolToken)
      const tx = await loanEngine.createLoan(address, handle, proof, tokenAddress);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [encryptAmount, getContract, getMasterConfig, address]);

  const repay = useCallback(async (loanId: number, amount: bigint): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { config, id } = getMasterConfig();
      const { handle, proof } = await encryptAmount(amount, config.LOAN_ENGINE);
      const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);
      
      // repay(uint256 loanId, euint64 amount, bytes calldata inputProof)
      const tx = await loanEngine.repay(loanId, handle, proof);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [encryptAmount, getContract, getMasterConfig]);

  const requestWithdrawal = useCallback(async (tokenAddress: string, amount: bigint, destChainId: number): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { config, id } = getMasterConfig();
      const { handle, proof } = await encryptAmount(amount, config.POOL_MANAGER);
      const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
      
      // requestWithdrawal(address tokenOnSource, externalEuint64 encryptedAmount, bytes calldata inputProof, uint64 destChainId)
      const tx = await poolManager.requestWithdrawal(tokenAddress, handle, proof, destChainId);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [encryptAmount, getContract, getMasterConfig]);

  const finalizeWithdrawal = useCallback(async (nonce: number, clearResult: string, proof: string): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { config, id } = getMasterConfig();
      const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
      
      const tx = await poolManager.finalizeWithdrawal(nonce, clearResult, proof);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [getContract, getMasterConfig]);

  return {
    ...state,
    decryptAllPositions,
    supply,
    borrow,
    repay,
    requestWithdrawal,
    finalizeWithdrawal,
    encryptAmount
  };
}
