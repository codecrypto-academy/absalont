'use client';

import { useWallet } from '@/context/WalletContext';
import { useState } from 'react';

export function WalletSelector() {
  const { account, connected, connect, disconnect, ensureCorrectNetwork } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await connect();
      await ensureCorrectNetwork();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error connecting wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setError(null);
  };

  const displayAccount = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  return (
    <div className="flex items-center gap-4">
      {connected ? (
        <>
          <div className="text-sm font-mono bg-blue-100 px-4 py-2 rounded">
            {displayAccount}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Desconectar
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-400"
        >
          {loading ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      )}
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
