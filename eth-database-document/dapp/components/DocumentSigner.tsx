'use client';

import React, { useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContract } from '../hooks/useContract';
import { EthersUtils } from '../utils/ethers';
import { HashUtils } from '../utils/hash';

interface DocumentSignerProps {
  documentHash: string | null;
  fileName: string | null;
  onSuccess?: (txHash: string) => void;
}

export default function DocumentSigner({ documentHash, fileName, onSuccess }: DocumentSignerProps) {
  const { currentAddress, isConnected } = useWallet();
  const { storeDocument, checkDocumentExists, isLoading, error } = useContract();
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [checkingExists, setCheckingExists] = useState(false);

  const handleSignClick = useCallback(async () => {
    if (!documentHash) return;
    
    // Verificar si el documento ya existe
    setCheckingExists(true);
    const exists = await checkDocumentExists(documentHash);
    setCheckingExists(false);
    
    if (exists) {
      setAlreadyExists(true);
      return;
    }
    
    setShowConfirmation(true);
  }, [documentHash, checkDocumentExists]);

  const handleConfirmSign = useCallback(async () => {
    if (!documentHash) return;
    
    setShowConfirmation(false);
    const result = await storeDocument(documentHash);
    
    if (result) {
      setTxHash(result);
      onSuccess?.(result);
    }
  }, [documentHash, storeDocument, onSuccess]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setAlreadyExists(false);
  }, []);

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Por favor, selecciona una wallet para continuar.</p>
      </div>
    );
  }

  if (!documentHash) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500">Sube un archivo para poder firmarlo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Información del documento */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Documento a Firmar</h3>
        <div className="space-y-2 text-sm">
          {fileName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Archivo:</span>
              <span className="font-medium text-gray-900">{fileName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Firmante:</span>
            <span className="font-mono text-gray-900">{EthersUtils.formatAddress(currentAddress!)}</span>
          </div>
          <div>
            <span className="text-gray-500">Hash:</span>
            <p className="font-mono text-xs text-gray-700 mt-1 break-all bg-gray-50 p-2 rounded">
              {documentHash}
            </p>
          </div>
        </div>
      </div>

      {/* Botón de firma */}
      <button
        onClick={handleSignClick}
        disabled={isLoading || checkingExists}
        className={`
          w-full py-3 px-4 rounded-lg font-medium text-white
          transition-all duration-200
          ${isLoading || checkingExists
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Firmando y almacenando...
          </span>
        ) : checkingExists ? (
          'Verificando...'
        ) : (
          '🔐 Firmar y Almacenar en Blockchain'
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Documento ya existe */}
      {alreadyExists && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Documento Ya Registrado</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Este documento ya ha sido registrado en la blockchain. No es posible registrarlo nuevamente.
            </p>
            <button
              onClick={handleCancel}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Firma</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Estás a punto de firmar y almacenar este documento en la blockchain Ethereum. Esta acción es irreversible.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-xs text-gray-500 mb-1">Hash del documento:</p>
              <p className="font-mono text-xs break-all">{HashUtils.formatHash(documentHash, 16)}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSign}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Éxito */}
      {txHash && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-green-700">¡Documento registrado exitosamente!</span>
          </div>
          <p className="text-sm text-green-600">
            Hash de transacción:
            <span className="font-mono text-xs ml-1 break-all">{txHash}</span>
          </p>
        </div>
      )}
    </div>
  );
}
