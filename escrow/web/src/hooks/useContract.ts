'use client';

import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useEscrow } from './useEscrow';
import { useToken } from './useToken';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from '@/lib/constants';

/**
 * Hook unificado que contiene todos los métodos de smart contract
 * Combina funcionalidades de escrow, balance y token
 */
export function useContract() {
  const escrow = useEscrow();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Método para obtener balance de un token para una dirección
  const getBalance = useCallback(
    async (tokenAddress: string, account: string): Promise<string> => {
      try {
        if (!wallet.provider) throw new Error('Provider no disponible');

        const contract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          wallet.provider
        );

        const balance = await contract.balanceOf(account);
        return ethers.formatEther(balance);
      } catch (err) {
        console.error('Error fetching balance:', err);
        return '0';
      }
    },
    [wallet.provider]
  );

  // Método para obtener balance en el contrato escrow
  const getEscrowBalance = useCallback(
    async (account: string): Promise<string> => {
      try {
        if (!wallet.provider) throw new Error('Provider no disponible');

        const contract = new ethers.Contract(
          ESCROW_ADDRESS,
          ESCROW_ABI,
          wallet.provider
        );

        const balance = await contract.getEscrowBalance(account);
        return ethers.formatEther(balance);
      } catch (err) {
        console.error('Error fetching escrow balance:', err);
        return '0';
      }
    },
    [wallet.provider]
  );

  // Método para agregar un token permitido
  const addToken = useCallback(
    async (tokenAddress: string) => {
      try {
        setLoading(true);
        setError(null);

        if (!wallet.signer) throw new Error('Wallet no conectada');

        const contract = new ethers.Contract(
          ESCROW_ADDRESS,
          ESCROW_ABI,
          wallet.signer
        );

        const tx = await contract.addToken(tokenAddress);
        await tx.wait();

        setLoading(false);
        return { success: true, hash: tx.hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [wallet.signer]
  );

  // Método para obtener operaciones (wrapper de getOperationCount)
  const getOperations = useCallback(
    async () => {
      try {
        const count = await escrow.getOperationCount();
        const operations = [];

        for (let i = 0; i < count; i++) {
          const op = await escrow.getOperation(i);
          if (op) {
            operations.push({ id: i, ...op });
          }
        }

        return operations;
      } catch (err) {
        console.error('Error fetching operations:', err);
        return [];
      }
    },
    [escrow]
  );

  return {
    // Métodos de operaciones
    createOperation: escrow.createOperation,
    completeOperation: escrow.completeOperation,
    cancelOperation: escrow.cancelOperation,
    getOperation: escrow.getOperation,
    getOperationCount: escrow.getOperationCount,
    getOperations,

    // Métodos de balance
    getBalance,
    getEscrowBalance,

    // Métodos de token
    addToken,
    getAllowedTokens: escrow.getAllowedTokens,

    // Estado general
    loading: escrow.loading || loading,
    error: escrow.error || error,

    // Wallet
    account: wallet.account,
    connected: wallet.connected,
    signer: wallet.signer,
    provider: wallet.provider,
  };
}
