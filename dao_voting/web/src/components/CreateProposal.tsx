'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { useDAOBalance } from '@/hooks/useDAOBalance';
import { parseEther, isAddress, formatEther } from 'ethers';

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

    // Validate recipient address
    if (!isAddress(recipient)) {
      setError('La dirección del beneficiario no es válida. Debe ser una dirección Ethereum válida (0x...)');
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

      // Better error messages
      let errorMessage = 'Error al crear propuesta';
      if (err.message) {
        if (err.message.includes('user rejected')) {
          errorMessage = 'Transacción rechazada por el usuario';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Fondos insuficientes para pagar el gas';
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
        <h2 className="text-2xl font-bold mb-4">Crear Propuesta</h2>
        <p className="text-gray-600">Conecta tu wallet para crear propuestas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">
          📝
        </span>
        Crear Nueva Propuesta
      </h2>

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Tu balance en DAO:</span>
            <span className="font-bold text-slate-900 text-lg">{formatEther(balance)} ETH</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Balance total del DAO:</span>
            <span className="font-bold text-slate-900 text-lg">{formatEther(totalBalance)} ETH</span>
          </div>
        </div>
      </div>

      {!canCreateProposal() && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          <p className="font-semibold">⚠️ Balance insuficiente</p>
          <p className="text-sm">Necesitas al menos 10% del balance total del DAO ({((totalBalance * 10n) / 100n).toString()} wei) para crear propuestas.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="recipient" className="block text-sm font-semibold text-slate-700 mb-2">
            Dirección del Beneficiario
          </label>
          <div className="relative">
            <input
              type="text"
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 pl-11 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm font-mono"
              required
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-slate-400">👤</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-2">
              Cantidad (ETH)
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

          <div>
            <label htmlFor="days" className="block text-sm font-semibold text-slate-700 mb-2">
              Duración de Votación (días)
            </label>
            <div className="relative">
              <input
                type="number"
                id="days"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm no-spinner"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-slate-400 font-medium">Días</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <span className="mt-0.5">✅</span>
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canCreateProposal()}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando Propuesta...
            </>
          ) : (
            <>
              <span>🚀</span>
              Crear Propuesta
            </>
          )}
        </button>
      </form>
    </div>
  );
}
