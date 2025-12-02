'use client';

import { useState, useCallback } from 'react';
import { ethersUtils } from '../utils/ethers';
import { useWallet } from '../contexts/WalletContext';

interface DocumentInfo {
  timestamp: bigint;
  signer: string;
  signature: string;
  exists: boolean;
}

interface UseContractReturn {
  // Estado
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  storeDocument: (hash: string) => Promise<string | null>;
  verifyDocument: (hash: string, signer: string, signature: string) => Promise<boolean>;
  getDocumentInfo: (hash: string) => Promise<DocumentInfo | null>;
  getUserDocuments: () => Promise<string[]>;
  getTotalDocuments: () => Promise<number>;
  checkDocumentExists: (hash: string) => Promise<boolean>;
  clearError: () => void;
}

export function useContract(): UseContractReturn {
  const { currentWallet, currentAddress, signMessage } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Almacenar documento
  const storeDocument = useCallback(async (hash: string): Promise<string | null> => {
    if (!currentWallet || !currentAddress) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Firmar el documento
      const signature = await signMessage(hash, timestamp);
      
      // Almacenar en el contrato
      const receipt = await ethersUtils.storeDocument(
        currentWallet,
        hash,
        timestamp,
        signature
      );

      if (receipt) {
        return receipt.hash;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to store document';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, currentAddress, signMessage]);

  // Verificar documento
  const verifyDocument = useCallback(async (
    hash: string,
    signer: string,
    signature: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const isValid = await ethersUtils.verifyDocument(hash, signer, signature);
      return isValid;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify document';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener información del documento
  const getDocumentInfo = useCallback(async (hash: string): Promise<DocumentInfo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const info = await ethersUtils.getDocumentInfo(hash);
      // Si no existe, retornar un objeto indicándolo
      if (!info.exists) {
        return {
          timestamp: BigInt(0),
          signer: '0x0000000000000000000000000000000000000000',
          signature: '0x',
          exists: false
        };
      }
      return info;
    } catch (err) {
      // Si hay error, asumir que no existe
      console.error('Error getting document info:', err);
      return {
        timestamp: BigInt(0),
        signer: '0x0000000000000000000000000000000000000000',
        signature: '0x',
        exists: false
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener documentos del usuario
  const getUserDocuments = useCallback(async (): Promise<string[]> => {
    if (!currentAddress) {
      setError('Wallet not connected');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const documents = await ethersUtils.getUserDocuments(currentAddress);
      return documents;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get user documents';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentAddress]);

  // Obtener total de documentos
  const getTotalDocuments = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      const total = await ethersUtils.getTotalDocuments();
      return Number(total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get total documents';
      setError(message);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar si el documento existe
  const checkDocumentExists = useCallback(async (hash: string): Promise<boolean> => {
    try {
      return await ethersUtils.documentExists(hash);
    } catch (err) {
      console.error('Error checking document existence:', err);
      return false;
    }
  }, []);


  return {
    isLoading,
    error,
    storeDocument,
    verifyDocument,
    getDocumentInfo,
    getUserDocuments,
    getTotalDocuments,
    checkDocumentExists,
    clearError,
  };
}

export default useContract;