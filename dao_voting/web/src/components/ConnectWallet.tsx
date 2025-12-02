'use client';

import { useWeb3 } from '@/context/Web3Context';

export default function ConnectWallet() {
  const { account, isConnecting, error, connectWallet, disconnectWallet } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-4">
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 px-4 py-2 rounded-lg">
            <p className="text-sm font-medium text-primary-700">{formatAddress(account)}</p>
          </div>
          <button
            onClick={disconnectWallet}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
          >
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
}
