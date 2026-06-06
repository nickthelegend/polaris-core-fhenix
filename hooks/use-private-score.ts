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
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_NETWORK_URL || "https://ethereum-sepolia-rpc.publicnode.com");
      const c = new ethers.Contract(getAddr(), [
        "function getScore(address) view returns (bytes32)",
        "function getEncryptedScore(address) view returns (bytes32)",
        "function isInitialized(address) view returns (bool)",
        "function hasScore(address) view returns (bool)"
      ], provider);

      let init = false;
      try {
        init = await c.isInitialized(address);
      } catch {
        try {
          init = await c.hasScore(address);
        } catch {
          try {
            const scoreHandle = await c.getScore(address);
            init = scoreHandle && scoreHandle !== '0x' + '0'.repeat(64);
          } catch {
            try {
              const scoreHandle = await c.getEncryptedScore(address);
              init = scoreHandle && scoreHandle !== '0x' + '0'.repeat(64);
            } catch {}
          }
        }
      }

      setState(s => ({ ...s, isInitialized: init, error: null }));
      return init;
    } catch (e: any) {
      setState(s => ({ ...s, isInitialized: false, error: "Failed to connect to ScoreManager. Please ensure you are on the correct network." }));
      return false;
    }
  }, [address, getAddr, getMasterConfig]);

  const initializeScore = useCallback(async () => {
    if (!address) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const contractAddr = getAddr();
      const signer = await getSigner();
      const contract = new ethers.Contract(contractAddr, [
        "function initializeScore(address) external",
        "function isInitialized(address) view returns (bool)"
      ], signer);
      
      const tx = await contract.initializeScore(address);
      await tx.wait();
      setState(s => ({ ...s, isInitialized: true, loading: false }));
    } catch (e: any) {
      logger.error('PRIVATE_SCORE', 'initializeScore failed', { error: e });
      setState(s => ({ ...s, loading: false, error: e.message }));
    }
  }, [address, getAddr, getSigner]);

  const decryptAll = useCallback(async (): Promise<{ score: number | null; limit: number | null }> => {
    if (!address) return { score: null, limit: null };
    setState(s => ({ ...s, decrypting: true, error: null }));
    try {
      const contractAddr = getAddr();
      
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_NETWORK_URL || "https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(contractAddr, [
        "function getScore(address) view returns (bytes32)",
        "function getCreditLimit(address) view returns (bytes32)",
        "function getEncryptedScore(address) view returns (bytes32)",
        "function getEncryptedLimit(address) view returns (bytes32)"
      ], provider);

      let scoreHandle;
      let limitHandle;
      try {
        scoreHandle = await contract.getScore(address);
        limitHandle = await contract.getCreditLimit(address);
      } catch {
        scoreHandle = await contract.getEncryptedScore(address);
        limitHandle = await contract.getEncryptedLimit(address);
      }

      const signer = await getSigner();
      const client = await getCoFHEClient(signer);

      const parseHandle = (h: any): bigint => {
        if (!h) return 0n;
        if (typeof h === 'bigint') return h;
        if (typeof h === 'object') {
          if (h.data !== undefined) return parseHandle(h.data);
          if (h[0] !== undefined) return parseHandle(h[0]);
        }
        try {
          return BigInt(h);
        } catch {
          return 0n;
        }
      };

      const decryptSingle = async (handle: any, fheType: any) => {
        const handleVal = parseHandle(handle);
        if (handleVal === 0n) return null;
        try {
          const val = await decryptView(client, handleVal, fheType);
          return Number(BigInt(val));
        } catch (e) {
          console.error(`Failed to decrypt handle ${handleVal}:`, e);
          return null;
        }
      };

      const [score, limit] = await Promise.all([
        decryptSingle(scoreHandle, FheTypes.Uint32),
        decryptSingle(limitHandle, FheTypes.Uint64)
      ]);

      setState(s => ({ ...s, decrypting: false, decryptedScore: score, decryptedLimit: limit, error: null }));
      return { score, limit };
    } catch (e: any) {
      logger.error('PRIVATE_SCORE', 'decryptAll failed', { error: e });
      setState(s => ({ ...s, decrypting: false, error: e.message }));
      return { score: null, limit: null };
    }
  }, [address, getAddr, getSigner]);

  return {
    ...state,
    checkInitialized,
    initializeScore,
    decryptScore: decryptAll,
    decryptAll,
    contractAddress: getAddr(),
  };
}
