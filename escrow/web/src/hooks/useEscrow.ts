'use client';

import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from '@/lib/constants';
import { Operation } from '@/types';

export function useEscrow() {
  const { signer, provider } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEscrowContract = useCallback(async () => {
    if (!signer) throw new Error('Wallet not connected');
    return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
  }, [signer]);

  const getEscrowReader = useCallback(async () => {
    if (!provider) throw new Error('Provider not available');
    return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
  }, [provider]);

  const createOperation = useCallback(
    async (
      amountA: string,
      recipient: string,
      amountB: string,
      tokenA: string,
      tokenB: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const contract = await getEscrowContract();
        const tx = await contract.createOperation(
          ethers.parseEther(amountA),
          recipient,
          ethers.parseEther(amountB),
          tokenA,
          tokenB
        );

        await tx.wait();
        setLoading(false);
        return { success: true, hash: tx.hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [getEscrowContract]
  );

  const completeOperation = useCallback(
    async (operationId: number, amountB: string) => {
      try {
        setLoading(true);
        setError(null);

        const contract = await getEscrowContract();
        const tx = await contract.completeOperation(
          operationId,
          ethers.parseEther(amountB)
        );

        await tx.wait();
        setLoading(false);
        return { success: true, hash: tx.hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [getEscrowContract]
  );

  const cancelOperation = useCallback(
    async (operationId: number) => {
      try {
        setLoading(true);
        setError(null);

        const contract = await getEscrowContract();
        const tx = await contract.cancelOperation(operationId);

        await tx.wait();
        setLoading(false);
        return { success: true, hash: tx.hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [getEscrowContract]
  );

  const getOperation = useCallback(
    async (operationId: number): Promise<Operation | null> => {
      try {
        const contract = await getEscrowReader();
        const op = await contract.getOperation(operationId);

        return {
          initiator: op.initiator,
          recipient: op.recipient,
          amountA: op.amountA,
          amountB: op.amountB,
          tokenA: op.tokenA,
          tokenB: op.tokenB,
          status: ['PENDING', 'COMPLETED', 'CANCELLED'][Number(op.status)] as 'PENDING' | 'COMPLETED' | 'CANCELLED',
          createdAt: op.createdAt,
          closedAt: op.closedAt,
        };
      } catch (err) {
        console.error('Error fetching operation:', err);
        return null;
      }
    },
    [getEscrowReader]
  );

  const getOperationCount = useCallback(async (): Promise<number> => {
    try {
      const contract = await getEscrowReader();
      const count = await contract.getOperationCount();
      return Number(count);
    } catch (err) {
      console.error('Error fetching operation count:', err);
      return 0;
    }
  }, [getEscrowReader]);

  const getAllowedTokens = useCallback(async (): Promise<string[]> => {
    try {
      const contract = await getEscrowReader();
      return await contract.getAllowedTokens();
    } catch (err) {
      console.error('Error fetching allowed tokens:', err);
      return [];
    }
  }, [getEscrowReader]);

  return {
    createOperation,
    completeOperation,
    cancelOperation,
    getOperation,
    getOperationCount,
    getAllowedTokens,
    loading,
    error,
  };
}
