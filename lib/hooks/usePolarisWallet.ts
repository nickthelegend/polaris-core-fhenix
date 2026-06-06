import { useAccount } from 'wagmi';

export function usePolarisWallet() {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  return {
    address,
    connected: isConnected,
    connecting: isConnecting,
    networkId: chainId
  };
}
