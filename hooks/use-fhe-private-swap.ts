import { useState, useCallback } from 'react';
import { usePolaris } from '@/hooks/use-polaris';
import { ABIS, NETWORKS } from '@/lib/contracts';
import { getCoFHEClient, encryptUint64 } from '@/lib/cofhe';
import { logger } from '@/lib/logger';
import { parseRevertReason } from '@/lib/revert-mapper';
import { ethers } from 'ethers';

export function useFhePrivateSwap() {
  const { getContract, address, chainId } = usePolaris();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNetworkId = useCallback((): number => {
    if (!chainId) return NETWORKS.SEPOLIA.id;
    const part = chainId.includes(':') ? chainId.split(':')[1] : chainId;
    return parseInt(part, 10);
  }, [chainId]);

  const getSigner = useCallback(async () => {
    if (!(window as any).ethereum) throw new Error('Wallet not connected or ethereum provider not found');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    return provider.getSigner();
  }, []);

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
        
        const signer = await getSigner();
        const client = await getCoFHEClient(signer);
        const encryptedAmount = await encryptUint64(client, amount);
        
        logger.logFheLifecycle(module, 'ENCRYPTION_SUCCESS', { handle: encryptedAmount.handle });

        const networkId = getNetworkId();
        const swapContract = await getContract(swapContractAddress, ABIS.PrivateSwapUSDC, networkId);
        
        logger.logFheLifecycle(module, 'BROADCAST');
        const tx = await swapContract.depositEncrypted(encryptedAmount);
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
    [address, getContract, getNetworkId, getSigner]
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
        
        const signer = await getSigner();
        const client = await getCoFHEClient(signer);
        const encryptedAmountIn = await encryptUint64(client, amountIn);
        
        logger.logFheLifecycle(module, 'ENCRYPTION_SUCCESS', { handle: encryptedAmountIn.handle });

        const networkId = getNetworkId();
        const swapContract = await getContract(swapContractAddress, ABIS.PrivateSwapUSDC, networkId);
        
        logger.logFheLifecycle(module, 'BROADCAST');
        const tx = await swapContract.swapEncrypted(encryptedAmountIn, targetToken);
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
    [address, getContract, getNetworkId, getSigner]
  );

  return {
    depositEncrypted,
    swapEncrypted,
    loading,
    error
  };
}
