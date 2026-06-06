import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { usePolaris } from '@/hooks/use-polaris';
import { CONTRACTS, ABIS, NETWORKS } from '@/lib/contracts';
import { getCoFHEClient, encryptUint64, decryptView, decryptForTransaction } from '@/lib/cofhe';
import { FheTypes } from '@cofhe/sdk';
import { logger } from '@/lib/logger';
import { parseRevertReason } from '@/lib/revert-mapper';

interface FhePrivateLendingState {
  collateralBalance: bigint | null;
  debtBalance: bigint | null;
  suppliedBalance: bigint | null;
  creditScore: number | null;
  creditLimit: bigint | null;
  loading: boolean;
  error: string | null;
}

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

  const getSigner = useCallback(async () => {
    if (!(window as any).ethereum) throw new Error('Wallet not connected or ethereum provider not found');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    return provider.getSigner();
  }, []);

  const decryptAllPositions = useCallback(async (tokenAddress: string) => {
    if (!address) return;
    setState(s => ({ ...s, loading: true, error: null }));
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

      const signer = await getSigner();
      const client = await getCoFHEClient(signer);

      const decryptSingle = async (handle: string, fheType: any) => {
        if (!handle || handle === '0x' + '0'.repeat(64)) return 0n;
        try {
          const val = await decryptView(client, BigInt(handle), fheType);
          return BigInt(val);
        } catch (e) {
          console.error(`Failed to decrypt handle ${handle}:`, e);
          return 0n;
        }
      };

      const [supplied, debt, collateral, score, limit] = await Promise.all([
        decryptSingle(sHandle, FheTypes.Uint64),
        decryptSingle(dHandle, FheTypes.Uint64),
        decryptSingle(cHandle, FheTypes.Uint64),
        decryptSingle(scoreHandle, FheTypes.Uint32),
        decryptSingle(limitHandle, FheTypes.Uint64)
      ]);

      setState(s => ({
        ...s,
        suppliedBalance: supplied,
        debtBalance: debt,
        collateralBalance: collateral,
        creditScore: Number(score),
        creditLimit: limit,
        loading: false
      }));
    } catch (err: any) {
      logger.error('FHE_PRIVATE_LENDING', 'decryptAllPositions failed', { error: err });
      setState(s => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  }, [address, getMasterConfig, getContract, getSigner]);

  const supply = useCallback(async (amount: bigint, tokenAddress: string): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const signer = await getSigner();
      const client = await getCoFHEClient(signer);
      const encryptedAmount = await encryptUint64(client, amount);

      const { config, id } = getMasterConfig();
      const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
      
      const tx = await poolManager.supply(tokenAddress, encryptedAmount, amount);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [getContract, getMasterConfig, getSigner]);

  const borrow = useCallback(async (amount: bigint, tokenAddress: string): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const signer = await getSigner();
      const client = await getCoFHEClient(signer);
      const encryptedAmount = await encryptUint64(client, amount);

      const { config, id } = getMasterConfig();
      const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);
      
      const tx = await loanEngine.createLoan(address, encryptedAmount, tokenAddress);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [getContract, getMasterConfig, address, getSigner]);

  const repay = useCallback(async (loanId: number, amount: bigint): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const signer = await getSigner();
      const client = await getCoFHEClient(signer);
      const encryptedAmount = await encryptUint64(client, amount);

      const { config, id } = getMasterConfig();
      const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);
      
      const tx = await loanEngine.repay(loanId, encryptedAmount);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [getContract, getMasterConfig, getSigner]);

  /** Repay a loan — triggers on-chain audit reveal flow */
  const repayLoan = useCallback(async (loanId: number) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const signer = await getSigner();
      const client = await getCoFHEClient(signer);

      const { config, id } = getMasterConfig();
      const loanEngine = await getContract(config.LOAN_ENGINE, ABIS.LoanEngine, id);

      // Step 1: Trigger audit → marks handle publicly decryptable on-chain
      const auditTx = await loanEngine.auditRepayment(loanId);
      const receipt = await auditTx.wait();

      // Step 2: Parse handle from event
      const auditEvent = receipt.logs.find((l: any) =>
        l.topics[0] === ethers.id("RepaymentAuditRequested(uint256,bytes32)")
      );
      if (!auditEvent) {
        throw new Error("RepaymentAuditRequested event not found in transaction receipt");
      }
      const handle = BigInt(auditEvent.topics[2]);

      // Step 3: Obtain MPC threshold signature (off-chain via Fhenix network)
      const { decryptedValue, signature } = await decryptForTransaction(client, handle);

      // Step 4: Finalize on-chain with the cleartext + MPC proof
      const finalizeTx = await loanEngine.finalizeRepaymentAudit(
        loanId,
        decryptedValue,  // boolean: isFullyRepaid
        signature
      );
      const finalizeReceipt = await finalizeTx.wait();
      setState(s => ({ ...s, loading: false }));
      return finalizeReceipt.hash;
    } catch (e: any) {
      const msg = parseRevertReason(e);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [getContract, getMasterConfig, getSigner]);

  const requestWithdrawal = useCallback(async (tokenAddress: string, amount: bigint, destChainId: number): Promise<string> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const signer = await getSigner();
      const client = await getCoFHEClient(signer);
      const encryptedAmount = await encryptUint64(client, amount);

      const { config, id } = getMasterConfig();
      const poolManager = await getContract(config.POOL_MANAGER, ABIS.PoolManager, id);
      
      const tx = await poolManager.requestWithdrawal(tokenAddress, encryptedAmount, destChainId);
      const receipt = await tx.wait();
      setState(s => ({ ...s, loading: false }));
      return receipt.hash;
    } catch (err: any) {
      const msg = parseRevertReason(err);
      setState(s => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }
  }, [getContract, getMasterConfig, getSigner]);

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
    repayLoan,
    requestWithdrawal,
    finalizeWithdrawal
  };
}
