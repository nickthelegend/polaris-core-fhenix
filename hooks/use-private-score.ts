import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { usePolaris } from '@/hooks/use-polaris';
import { CONTRACTS, ABIS, NETWORKS } from '@/lib/contracts';
import { getCoFHEClient, decryptView } from '@/lib/cofhe';
import { FheTypes } from '@cofhe/sdk';
import { logger } from '@/lib/logger';

interface PrivateScoreState {
  decryptedScore: number | null;
  decryptedLimit: number | null;
  isInitialized: boolean | null;
  loading: boolean;
  decrypting: boolean;
  error: string | null;
}

export function usePrivateScore() {
  const { getContract, address, getMasterConfig } = usePolaris();
  const [state, setState] = useState<PrivateScoreState>({
    decryptedScore: null, decryptedLimit: null,
    isInitialized: null, loading: false, decrypting: false, error: null,
  });

  const getAddr = useCallback(() => {
    const { config } = getMasterConfig();
    return config.SCORE_MANAGER;
  }, [getMasterConfig]);

  const getSigner = useCallback(async () => {
    if (!(window as any).ethereum) throw new Error('Wallet not connected or ethereum provider not found');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    return provider.getSigner();
  }, []);

  const checkInitialized = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    try {
      const { id } = getMasterConfig();
      const c = await getContract(getAddr(), ABIS.ScoreManager, id, false);
      const scoreHandle = await c.getScore(address);
      const init = scoreHandle && scoreHandle !== '0x' + '0'.repeat(64);
      setState(s => ({ ...s, isInitialized: init }));
      return init;
    } catch { return false; }
  }, [address, getAddr, getMasterConfig, getContract]);

  const decryptAll = useCallback(async (): Promise<{ score: number | null; limit: number | null }> => {
    if (!address) return { score: null, limit: null };
    setState(s => ({ ...s, decrypting: true, error: null }));
    try {
      const contractAddr = getAddr();
      const { id } = getMasterConfig();
      const contract = await getContract(contractAddr, ABIS.ScoreManager, id, false);

      const scoreHandle = await contract.getScore(address);
      const limitHandle = await contract.getCreditLimit(address);

      const zero = '0x' + '0'.repeat(64);
      
      const signer = await getSigner();
      const client = await getCoFHEClient(signer);

      const decryptSingle = async (handle: string, fheType: any) => {
        if (!handle || handle === zero) return null;
        try {
          const val = await decryptView(client, BigInt(handle), fheType);
          return Number(BigInt(val));
        } catch (e) {
          console.error(`Failed to decrypt handle ${handle}:`, e);
          return null;
        }
      };

      const [score, limit] = await Promise.all([
        decryptSingle(scoreHandle, FheTypes.Uint32),
        decryptSingle(limitHandle, FheTypes.Uint64)
      ]);

      setState(s => ({ ...s, decrypting: false, decryptedScore: score, decryptedLimit: limit }));
      return { score, limit };
    } catch (e: any) {
      logger.error('PRIVATE_SCORE', 'decryptAll failed', { error: e });
      setState(s => ({ ...s, decrypting: false, error: e.message }));
      return { score: null, limit: null };
    }
  }, [address, getAddr, getMasterConfig, getContract, getSigner]);

  return {
    ...state,
    checkInitialized,
    decryptScore: decryptAll,
    decryptAll,
    contractAddress: getAddr(),
  };
}
