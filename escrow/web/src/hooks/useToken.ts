'use client';

import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ERC20_ABI } from '@/lib/constants';

export function useToken(tokenAddress: string) {
  const { signer, provider } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTokenContract = useCallback(
    (readOnly = false) => {
      const signerOrProvider = readOnly ? provider : signer;
      if (!signerOrProvider) throw new Error('Provider not available');
      return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
    },
    [tokenAddress, signer, provider]
  );

  const approve = useCallback(
    async (spender: string, amount: string) => {
      try {
        setLoading(true);
        setError(null);

        const contract = getTokenContract();
        const tx = await contract.approve(spender, ethers.parseEther(amount));
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
    [getTokenContract]
  );

  const allowance = useCallback(
    async (owner: string, spender: string) => {
      try {
        const contract = getTokenContract(true);
        const amount = await contract.allowance(owner, spender);
        return amount;
      } catch (err) {
        console.error('Error fetching allowance:', err);
        return 0n;
      }
    },
    [getTokenContract]
  );

  const balanceOf = useCallback(
    async (account: string) => {
      try {
        const contract = getTokenContract(true);
        const balance = await contract.balanceOf(account);
        return balance;
      } catch (err) {
        console.error('Error fetching balance:', err);
        return 0n;
      }
    },
    [getTokenContract]
  );

  const decimals = useCallback(async () => {
    try {
      const contract = getTokenContract(true);
      const dec = await contract.decimals();
      return Number(dec);
    } catch (err) {
      console.error('Error fetching decimals:', err);
      return 18;
    }
  }, [getTokenContract]);

  const symbol = useCallback(async () => {
    try {
      const contract = getTokenContract(true);
      const sym = await contract.symbol();
      return sym;
    } catch (err) {
      console.error('Error fetching symbol:', err);
      return 'UNKNOWN';
    }
  }, [getTokenContract]);

  return {
    approve,
    allowance,
    balanceOf,
    decimals,
    symbol,
    loading,
    error,
  };
}
