'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/context/WalletContext';

export function AddToken() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  const { account } = useWallet();
  const { addToken } = useContract();

  const handleAddToken = async () => {
    if (!account) {
      setMessageType('error');
      setMessage('Necesitas conectar tu wallet primero');
      return;
    }

    if (!tokenAddress.trim()) {
      setMessageType('error');
      setMessage('Por favor ingresa una dirección válida');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('Procesando...');
      setMessageType('info');

      await addToken(tokenAddress);

      setMessageType('success');
      setMessage('Token agregado exitosamente');
      setTokenAddress('');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error?.message || 'Error al agregar token');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Agregar Token</h2>
      
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Dirección del contrato token (0x...)"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        
        <button
          onClick={handleAddToken}
          disabled={isLoading || !account}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Procesando...' : 'Agregar Token'}
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            messageType === 'success'
              ? 'bg-green-100 text-green-800'
              : messageType === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
