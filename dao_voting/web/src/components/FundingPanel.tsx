'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { useDAOBalance } from '@/hooks/useDAOBalance';
import { parseEther, formatEther } from 'ethers';

export default function FundingPanel() {
  const { account } = useWeb3();
  const { daoContract } = useContracts();
  const { balance, totalBalance, refresh } = useDAOBalance();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!daoContract || !account) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const value = parseEther(amount);
      const tx = await daoContract.fundDAO({ value });
      await tx.wait();
      
      setSuccess(`¡Depósito exitoso! ${amount} ETH agregados al DAO`);
      setAmount('');
      refresh();
    } catch (err: any) {
      console.error('Error funding DAO:', err);
      setError(err.message || 'Error al depositar fondos');
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Financiar DAO</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Tu balance en DAO:</span>
          <span className="font-semibold">{formatEther(balance)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Balance total del DAO:</span>
          <span className="font-semibold">{formatEther(totalBalance)} ETH</span>
        </div>
      </div>

      <form onSubmit={handleFund} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad (ETH)
          </label>
          <input
            type="number"
            id="amount"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'Depositar Fondos'}
        </button>
      </form>
    </div>
  );
}
