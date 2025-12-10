import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from './useContracts';

export function useDAOBalance() {
  const { account } = useWeb3();
  const { daoContract } = useContracts();
  const [balance, setBalance] = useState<bigint>(0n);
  const [totalBalance, setTotalBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!daoContract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [userBal, totalBal] = await Promise.all([
        daoContract.getUserBalance(account),
        daoContract.totalDAOBalance(),
      ]);
      setBalance(userBal);
      setTotalBalance(totalBal);
    } catch (error) {
      console.error('Error fetching DAO balance:', error);
    } finally {
      setLoading(false);
    }
  }, [daoContract, account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, totalBalance, loading, refresh };
}
