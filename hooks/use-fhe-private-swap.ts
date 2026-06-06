import { useState, useCallback } from 'react';
import { usePolaris } from '@/hooks/use-polaris';
import { ABIS, NETWORKS } from '@/lib/contracts';
import { getFhenixInstance, encrypt64 } from '@/lib/fhevm';
import { logger } from '@/lib/logger';
import { parseRevertReason } from '@/lib/revert-mapper';

export function useFhePrivateSwap() {
  const { getContract, address, chainId } = usePolaris();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNetworkId = useCallback((): number => {
    if (!chainId) return NETWORKS.SEPOLIA.id;
    const part = chainId.includes(':') ? chainId.split(':')[1] : chainId;
    return parseInt(part, 10);
  }, [chainId]);

  /**
   * Deposit tokens into the private swap contract.
   */
  const depositEncrypted = useCallback(
    async (swapContractAddress: string, amount: bigint) => {
      setLoading(true);
      setError(null);
      const module = 'FHE_SWAP_DEPOSIT';
      try {
        if (!address) throw new Error('Wallet not connected');

        logger.logFheLifecycle(module, 'ENCRYPTION_START', { amount: amount.toString(), swapContractAddress });
        const { handles, inputProof } = await encrypt64(
          swapContractAddress as `0x${string}`,
          address as `0x${string}`,
          amount
        );
        logger.logFheLifecycle(module, 'ENCRYPTION_SUCCESS', { handle: handles[0] });

        const networkId = getNetworkId();
        const swapContract = await getContract(swapContractAddress, ABIS.PrivateSwapUSDC, networkId);
        
        logger.logFheLifecycle(module, 'BROADCAST');
        // PrivateSwap contracts use einput, which is handles[0]
        const tx = await swapContract.depositEncrypted(handles[0], inputProof);
        const receipt = await tx.wait();
        logger.logFheLifecycle(module, 'CONFIRMED', { txHash: receipt.hash });
        
        setLoading(false);
        return receipt.hash;
      } catch (err: any) {
        const friendlyError = parseRevertReason(err);
        logger.error(module, 'depositEncrypted failed', { error: err, friendlyError, swapContractAddress });
        setError(friendlyError);
        setLoading(false);
        throw new Error(friendlyError);
      }
    },
    [address, getContract, getNetworkId]
  );

  /**
   * Swap encrypted tokens.
   */
  const swapEncrypted = useCallback(
    async (swapContractAddress: string, amountIn: bigint, targetToken: string) => {
      setLoading(true);
      setError(null);
      const module = 'FHE_SWAP_EXECUTE';
      try {
        if (!address) throw new Error('Wallet not connected');

        logger.logFheLifecycle(module, 'ENCRYPTION_START', { amountIn: amountIn.toString(), targetToken, swapContractAddress });
        const { handles, inputProof } = await encrypt64(
          swapContractAddress as `0x${string}`,
          address as `0x${string}`,
          amountIn
        );
        logger.logFheLifecycle(module, 'ENCRYPTION_SUCCESS', { handle: handles[0] });

        const networkId = getNetworkId();
        const swapContract = await getContract(swapContractAddress, ABIS.PrivateSwapUSDC, networkId);
        
        logger.logFheLifecycle(module, 'BROADCAST');
        const tx = await swapContract.swapEncrypted(handles[0], inputProof, targetToken);
        const receipt = await tx.wait();
        logger.logFheLifecycle(module, 'CONFIRMED', { txHash: receipt.hash });
        
        setLoading(false);
        return receipt.hash;
      } catch (err: any) {
        logger.error(module, 'swapEncrypted failed', { error: err, swapContractAddress, targetToken });
        setError(err.message || String(err));
        setLoading(false);
        throw err;
      }
    },
    [address, getContract, getNetworkId]
  );

  return {
    depositEncrypted,
    swapEncrypted,
    loading,
    error
  };
}
