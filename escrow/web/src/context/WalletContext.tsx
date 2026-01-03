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

  // Asegurar red correcta
  const ensureCorrectNetwork = useCallback(async (targetProvider?: ethers.BrowserProvider) => {
    const activeProvider = targetProvider || provider;
    if (!activeProvider) {
      console.warn('ensureCorrectNetwork: No provider available');
      return;
    }

    try {
      const network = await activeProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      console.log('Current Chain ID:', currentChainId, 'Target Chain ID:', CHAIN_ID);

      if (currentChainId !== CHAIN_ID) {
        console.log('Switching to correct network...');
        try {
          await switchNetwork(CHAIN_ID);
        } catch (error) {
          console.warn('Switch failed, attempting to add network:', error);
          // Si falla el cambio, intentar añadir la red
          await addNetwork(CHAIN_ID, 'Anvil Local', RPC_URL);
          await switchNetwork(CHAIN_ID);
        }
      }
    } catch (error) {
      console.error('Error changing red:', error);
      throw error;
    }
  }, [provider]);

  // Conectar wallet
  const connect = useCallback(async () => {
    console.log('Connecting wallet...');
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask no está instalado');
      }

      const accounts = await connectWallet();
      console.log('Accounts connected:', accounts);

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();

      setAccount(accounts[0]);
      setProvider(newProvider);
      setSigner(newSigner);
      setConnected(true);

      // Obtener chain ID y asegurar red correcta inmediatamente
      const network = await newProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      if (currentChainId !== CHAIN_ID) {
        await ensureCorrectNetwork(newProvider);
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      throw error;
    }
  }, [ensureCorrectNetwork]);

  // Desconectar
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setConnected(false);
  }, []);

  const connectingRef = React.useRef(false);

  // Auto-conectar si estaba conectado
  useEffect(() => {
    if (account || connectingRef.current) return;

    const autoConnect = async () => {
      const storedAccount = await getConnectedAccount();
      if (storedAccount && !connectingRef.current) {
        try {
          connectingRef.current = true;
          await connect();
        } catch (error) {
          console.warn('Auto-connect failed:', error);
        } finally {
          connectingRef.current = false;
        }
      }
    };

    autoConnect();
  }, [account, connect]);

  // Escuchar cambios de cuenta
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // Al cambiar de cuenta, refrescamos toda la conexión
        try {
          await connect();
        } catch (error) {
          console.error("Error refreshing account:", error);
        }
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
