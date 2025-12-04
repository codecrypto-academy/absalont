'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useToken } from './useToken';

export function useBalance(tokenAddress: string) {
  const { account } = useWallet();
  const { balanceOf } = useToken(tokenAddress);
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!account) return;
    try {
      setLoading(true);
      const bal = await balanceOf(account);
      setBalance(bal);
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  }, [account, balanceOf]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 3000); // Actualizar cada 3 segundos
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
