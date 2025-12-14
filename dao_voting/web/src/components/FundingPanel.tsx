'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { useDAOBalance } from '@/hooks/useDAOBalance';
import { parseEther, formatEther } from 'ethers';
import { Coins, Loader2 } from 'lucide-react';

export default function FundingPanel() {
  const { account, provider } = useWeb3();
  const { daoContract } = useContracts();
  const { balance, totalBalance, refresh } = useDAOBalance();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<bigint>(0n);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (account && provider) {
        try {
          const bal = await provider.getBalance(account);
          setWalletBalance(bal);
        } catch (err) {
          console.error('Error fetching wallet balance:', err);
        }
      }
    };

    fetchWalletBalance();
    // Refresh balance when account changes or after a successful transaction (via refresh prop if we wanted, but here we just re-fetch)
  }, [account, provider, success]); // Re-fetch on success as well to show updated wallet balance

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!daoContract || !account) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const value = parseEther(amount);

      // Get user's wallet balance
      // const provider = daoContract.runner?.provider; // Already have provider from useWeb3
      if (provider) {
        const currentWalletBalance = await provider.getBalance(account);
        if (currentWalletBalance < value) {
          throw new Error(`Balance insuficiente. Tienes ${formatEther(currentWalletBalance)} ETH pero intentas depositar ${amount} ETH`);
        }
      }

      const tx = await daoContract.fundDAO({ value });
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }

      setSuccess(`¡Depósito exitoso! ${amount} ETH agregados al DAO`);
      setAmount('');
      refresh();
      // Update wallet balance immediately after success
      if (provider) {
        const newBal = await provider.getBalance(account);
        setWalletBalance(newBal);
      }

    } catch (err: any) {
      console.error('Error funding DAO:', err);

      // Better error messages
      let errorMessage = 'Error al depositar fondos';
      if (err.message) {
        if (err.message.includes('insufficient funds')) {
          errorMessage = 'Fondos insuficientes en tu wallet';
        } else if (err.message.includes('user rejected')) {
          errorMessage = 'Transacción rechazada por el usuario';
        } else if (err.message.includes('Balance insuficiente')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Financiar DAO</h2>
        <p className="text-gray-600">Conecta tu wallet para financiar el DAO</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-strong border border-slate-200 p-8 h-full">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
          <Coins className="w-6 h-6" />
        </span>
        Financiar DAO
      </h2>

      <div className="space-y-6">
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Tu balance en Wallet</span>
            <span className="font-bold text-slate-900 text-lg">{Number(formatEther(walletBalance)).toFixed(4)} ETH</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Tu balance en DAO</span>
            <span className="font-bold text-slate-900 text-lg">{formatEther(balance)} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Balance total del DAO</span>
            <span className="font-bold text-slate-900 text-lg">{formatEther(totalBalance)} ETH</span>
          </div>
        </div>

        <form onSubmit={handleFund} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-2">
              Cantidad a depositar (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm no-spinner"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-slate-400 font-medium">ETH</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5 text-white" />
                Procesando...
              </span>
            ) : (
              'Depositar Fondos'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
