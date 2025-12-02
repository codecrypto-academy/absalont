'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { useDAOBalance } from '@/hooks/useDAOBalance';
import { parseEther } from 'ethers';

export default function CreateProposal() {
  const { account } = useWeb3();
  const { daoContract } = useContracts();
  const { balance, totalBalance, refresh: refreshBalance } = useDAOBalance();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCreateProposal = () => {
    if (!totalBalance || totalBalance === 0n) return false;
    const requiredBalance = (totalBalance * 10n) / 100n;
    return balance >= requiredBalance;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!daoContract || !account) return;

    if (!canCreateProposal()) {
      setError('Necesitas al menos 10% del balance total del DAO para crear una propuesta');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountWei = parseEther(amount);
      const deadline = Math.floor(Date.now() / 1000) + parseInt(days) * 24 * 60 * 60;

      const tx = await daoContract.createProposal(recipient, amountWei, deadline);
      const receipt = await tx.wait();
      
      setSuccess(`¡Propuesta creada exitosamente!`);
      setRecipient('');
      setAmount('');
      setDays('7');
      refreshBalance();
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      setError(err.message || 'Error al crear propuesta');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Crear Propuesta</h2>
        <p className="text-gray-600">Conecta tu wallet para crear propuestas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Crear Propuesta</h2>

      {!canCreateProposal() && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          <p className="font-semibold">⚠️ Balance insuficiente</p>
          <p className="text-sm">Necesitas al menos 10% del balance total del DAO ({((totalBalance * 10n) / 100n).toString()} wei) para crear propuestas.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección del Beneficiario
          </label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

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

        <div>
          <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
            Duración de Votación (días)
          </label>
          <input
            type="number"
            id="days"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
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
          disabled={loading || !canCreateProposal()}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Propuesta'}
        </button>
      </form>
    </div>
  );
}
