'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useContract } from '../hooks/useContract';
import { HashUtils } from '../utils/hash';
import { EthersUtils } from '../utils/ethers';

interface VerificationResult {
  exists: boolean;
  isValid: boolean;
  timestamp?: bigint;
  signer?: string;
  signature?: string;
}

export default function DocumentVerifier() {
  const { getDocumentInfo, verifyDocument, isLoading, error, clearError } = useContract();
  
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [signerAddress, setSignerAddress] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsHashing(true);
    setResult(null);
    setVerificationError(null);
    clearError();

    try {
      const hash = await HashUtils.hashFile(selectedFile);
      setFileHash(hash);
    } catch (err) {
      setVerificationError('Error al calcular el hash del archivo');
    } finally {
      setIsHashing(false);
    }
  }, [clearError]);

  const handleVerify = useCallback(async () => {
    if (!fileHash) {
      setVerificationError('Por favor, selecciona un archivo primero');
      return;
    }

    if (!signerAddress) {
      setVerificationError('Por favor, ingresa la dirección del firmante');
      return;
    }

    // Validar dirección Ethereum
    if (!/^0x[a-fA-F0-9]{40}$/.test(signerAddress)) {
      setVerificationError('Dirección de Ethereum inválida');
      return;
    }

    setVerificationError(null);
    setResult(null);

    try {
        // Primero obtener información del documento
        const docInfo = await getDocumentInfo(fileHash);
        
        if (!docInfo || !docInfo.exists) {
          setResult({
            exists: false,
            isValid: false,
          });
          return;
        }

        // Verificar que el firmante coincide
        const signerMatches = docInfo.signer.toLowerCase() === signerAddress.toLowerCase();
        
        // Solo verificar la firma si el documento existe y tiene una firma válida
        let signatureValid = false;
        if (docInfo.signature && docInfo.signature !== '0x') {
          try {
            signatureValid = await verifyDocument(fileHash, signerAddress, docInfo.signature);
          } catch (err) {
            console.error('Error verifying signature:', err);
            // Si falla la verificación de firma, signatureValid queda en false
          }
        }

        setResult({
          exists: true,
          isValid: signerMatches && signatureValid,
          timestamp: docInfo.timestamp,
          signer: docInfo.signer,
          signature: docInfo.signature,
        });
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationError(err instanceof Error ? err.message : 'Error al verificar el documento');
    }
  }, [fileHash, signerAddress, getDocumentInfo, verifyDocument]);

  const handleReset = useCallback(() => {
    setFile(null);
    setFileHash(null);
    setSignerAddress('');
    setResult(null);
    setVerificationError(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearError]);

  return (
    <div className="space-y-6">
      {/* Selector de archivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documento a Verificar
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        
        {isHashing && (
          <p className="mt-2 text-sm text-gray-500 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Calculando hash...
          </p>
        )}
        
        {fileHash && !isHashing && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Hash SHA-256:</p>
            <p className="font-mono text-xs text-gray-700 break-all mt-1">{fileHash}</p>
          </div>
        )}
      </div>

      {/* Dirección del firmante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección del Firmante
        </label>
        <input
          type="text"
          value={signerAddress}
          onChange={(e) => setSignerAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
      </div>

      {/* Botones */}
      <div className="flex space-x-3">
        <button
          onClick={handleVerify}
          disabled={isLoading || isHashing || !fileHash}
          className={`
            flex-1 py-3 px-4 rounded-lg font-medium text-white
            transition-all duration-200
            ${isLoading || isHashing || !fileHash
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
            }
          `}
        >
          {isLoading ? 'Verificando...' : '🔍 Verificar Documento'}
        </button>
        <button
          onClick={handleReset}
          className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Errores */}
      {(verificationError || error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{verificationError || error}</p>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className={`p-6 rounded-xl border-2 ${
          result.isValid 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center mb-4">
            {result.isValid ? (
              <>
                <svg className="w-10 h-10 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h3 className="text-lg font-bold text-green-700">✓ Documento Verificado</h3>
                  <p className="text-sm text-green-600">La firma y el documento son auténticos</p>
                </div>
              </>
            ) : result.exists ? (
              <>
                <svg className="w-10 h-10 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-bold text-yellow-700">⚠ Firmante No Coincide</h3>
                  <p className="text-sm text-yellow-600">El documento existe pero fue firmado por otra dirección</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-bold text-red-700">✗ Documento No Registrado</h3>
                  <p className="text-sm text-red-600">Este documento no existe en la blockchain</p>
                </div>
              </>
            )}
          </div>

          {result.exists && (
            <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
              <div>
                <span className="text-sm text-gray-500">Firmante registrado:</span>
                <p className="font-mono text-sm">{result.signer}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Fecha de registro:</span>
                <p className="text-sm font-medium">
                  {result.timestamp ? EthersUtils.formatTimestamp(result.timestamp) : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}