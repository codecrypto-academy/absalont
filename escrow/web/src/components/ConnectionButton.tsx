'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export function ConnectionButton() {
  const { account, connected, connect, disconnect } = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const displayAddress = account 
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : 'Conectar Wallet';

  return (
    <button
      onClick={connected ? disconnect : connect}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        connected
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {displayAddress}
    </button>
  );
}
