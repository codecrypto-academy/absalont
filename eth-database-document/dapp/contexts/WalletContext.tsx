'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Wallet } from 'ethers';
import { ethersUtils, ANVIL_ACCOUNTS, EthersUtils } from '../utils/ethers';

interface WalletContextType {
  // Estado
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Wallet actual
  currentWallet: Wallet | null;
  currentAddress: string | null;
  currentBalance: string;
  selectedAccountIndex: number;
  
  // Cuentas disponibles
  accounts: typeof ANVIL_ACCOUNTS;
  
  // Acciones
  selectAccount: (index: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  signMessage: (hash: string, timestamp: number) => Promise<string>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<string>('0');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);

  // Refrescar balance
  const refreshBalance = useCallback(async () => {
    if (!currentAddress) return;
    try {
      const balance = await ethersUtils.getBalance(currentAddress);
      setCurrentBalance(balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, [currentAddress]);

  // Seleccionar cuenta
  const selectAccount = useCallback(async (index: number) => {
    if (index < 0 || index >= ANVIL_ACCOUNTS.length) {
      setError('Invalid account index');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const account = ANVIL_ACCOUNTS[index];
      const wallet = ethersUtils.createWallet(account.privateKey);
      const balance = await ethersUtils.getBalance(account.address);

      setCurrentWallet(wallet);
      setCurrentAddress(account.address);
      setCurrentBalance(balance);
      setSelectedAccountIndex(index);
      setIsConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select account';
      setError(message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Firmar mensaje
  const signMessage = useCallback(async (hash: string, timestamp: number): Promise<string> => {
    if (!currentWallet) {
      throw new Error('No wallet connected');
    }
    return await ethersUtils.signMessage(currentWallet, hash, timestamp);
  }, [currentWallet]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Inicializar con la primera cuenta
  useEffect(() => {
    selectAccount(0);
  }, [selectAccount]);

  // Actualizar balance periódicamente
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(refreshBalance, 10000);
    return () => clearInterval(interval);
  }, [isConnected, refreshBalance]);

  const value: WalletContextType = {
    isConnected,
    isLoading,
    error,
    currentWallet,
    currentAddress,
    currentBalance,
    selectedAccountIndex,
    accounts: ANVIL_ACCOUNTS,
    selectAccount,
    refreshBalance,
    signMessage,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;
