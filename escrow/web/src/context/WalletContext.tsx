'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getConnectedAccount, switchNetwork, addNetwork } from '@/lib/ethers';
import { CHAIN_ID, RPC_URL } from '@/lib/constants';

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  ensureCorrectNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  // Conectar wallet
  const connect = useCallback(async () => {
    try {
      const accounts = await connectWallet();
      const newProvider = new ethers.BrowserProvider(window.ethereum!);
      const newSigner = await newProvider.getSigner();

      setAccount(accounts[0]);
      setProvider(newProvider);
      setSigner(newSigner);
      setConnected(true);

      // Obtener chain ID
      const network = await newProvider.getNetwork();
      setChainId(Number(network.chainId));

      // Cambiar a red correcta si es necesario
      if (Number(network.chainId) !== CHAIN_ID) {
        await ensureCorrectNetwork();
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      throw error;
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setConnected(false);
  }, []);

  // Asegurar red correcta
  const ensureCorrectNetwork = useCallback(async () => {
    if (!provider) return;

    try {
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== CHAIN_ID) {
        try {
          await switchNetwork(CHAIN_ID);
        } catch (error) {
          // Si falla el cambio, intentar añadir la red
          await addNetwork(CHAIN_ID, 'Anvil Local', RPC_URL);
          await switchNetwork(CHAIN_ID);
        }
      }
    } catch (error) {
      console.error('Error cambiando red:', error);
      throw error;
    }
  }, [provider]);

  // Auto-conectar si estaba conectado
  useEffect(() => {
    const autoConnect = async () => {
      const account = await getConnectedAccount();
      if (account) {
        try {
          await connect();
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, [connect]);

  // Escuchar cambios de cuenta
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        connected,
        connect,
        disconnect,
        ensureCorrectNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
