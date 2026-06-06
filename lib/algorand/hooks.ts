// React hooks for smart contract interactions
'use client';

import { useState, useEffect } from 'react';
import { useObolusWallet } from '@/lib/hooks/useObolusWallet';
import { PayEaseContracts, ContractStatus } from './contracts';

// Hook for user registration
export function useUserRegistration() {
  const { connected: authenticated, address: activeAddress } = useObolusWallet();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const registerUser = async () => {
    if (!authenticated || !activeAddress) return;

    setIsRegistering(true);
    try {
      const result = await PayEaseContracts.registerUser(activeAddress);
      setRegistrationStatus('success');
      return result;
    } catch (error) {
      setRegistrationStatus('error');
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerUser,
    isRegistering,
    registrationStatus,
    isRegistered: registrationStatus === 'success'
  };
}

// Hook for user credit limit
export function useUserLimit() {
  const { connected: authenticated, address: activeAddress } = useObolusWallet();
  const [limit, setLimit] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated && activeAddress) {
      fetchLimit();
    }
  }, [authenticated, activeAddress]);

  const fetchLimit = async () => {
    if (!activeAddress) return;

    setLoading(true);
    try {
      const userLimit = await PayEaseContracts.getUserLimit(activeAddress);
      setLimit(userLimit);
    } catch (error) {
      console.error('Failed to fetch limit:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    limit,
    loading,
    refetchLimit: fetchLimit
  };
}

// Hook for piggy bank operations
export function usePiggyBank() {
  const { connected: authenticated, address: activeAddress } = useObolusWallet();
  const [balance, setBalance] = useState(0);
  const [isDepositing, setIsDepositing] = useState(false);

  const addDeposit = async (amount: number) => {
    if (!authenticated || !activeAddress) return;

    setIsDepositing(true);
    try {
      const result = await PayEaseContracts.addToPiggyBank(activeAddress, amount);
      setBalance(prev => prev + amount);
      return result;
    } catch (error) {
      console.error('Deposit failed:', error);
      throw error;
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    balance,
    addDeposit,
    isDepositing
  };
}

// Hook for payment processing
export function usePayments() {
  const { connected: authenticated, address: activeAddress } = useObolusWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (
    merchantAddress: string,
    amount: number,
    merchantName: string
  ) => {
    if (!authenticated || !activeAddress) return;

    setIsProcessing(true);
    try {
      const result = await PayEaseContracts.processPayment(
        activeAddress,
        merchantAddress,
        amount,
        merchantName
      );
      return result;
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isProcessing
  };
}

// Hook for contract connection status
export function useContractConnection() {
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const connectionStatus = await PayEaseContracts.checkConnection();
      setStatus(connectionStatus);
      return connectionStatus;
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus({
        isConnected: false,
        mainContract: false,
        userContract: false,
        algodClient: false,
        error: 'Failed to check connection'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return {
    status,
    loading,
    checkConnection,
    isConnected: status?.isConnected || false
  };
}

// Hook for user verification
export function useVerification() {
  const { connected: authenticated, address: activeAddress } = useObolusWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifications, setVerifications] = useState<string[]>([]);

  const verifyWithProvider = async (providerName: string, proofHash: string) => {
    if (!authenticated || !activeAddress) return;

    setIsVerifying(true);
    try {
      const result = await PayEaseContracts.verifyUser(
        activeAddress,
        providerName,
        proofHash
      );

      if (result.success) {
        setVerifications(prev => [...prev, providerName]);
      }

      return result;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyWithProvider,
    isVerifying,
    verifications,
    verificationCount: verifications.length
  };
}
