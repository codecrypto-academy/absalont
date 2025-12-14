'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { useDAOBalance } from '@/hooks/useDAOBalance';
import { parseEther, isAddress, formatEther } from 'ethers';
import { FORWARDER_ABI, FORWARDER_ADDRESS, DAO_ADDRESS } from '@/lib/contracts';
import { buildCreateProposalRequest, signMetaTxRequest } from '@/lib/meta-tx';
import { ethers } from 'ethers';
import {
  FileText,
  User,
  Rocket,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Wallet
} from 'lucide-react';

export default function CreateProposal() {
  const { account, signer } = useWeb3();
  const { daoContract, forwarderContract } = useContracts();
  const { balance, totalBalance, refresh: refreshBalance } = useDAOBalance();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('7');
  const [description, setDescription] = useState('');
  const [useGasless, setUseGasless] = useState(false);
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

      // Get current block timestamp from provider to ensure deadline is relative to chain time
      const block = await daoContract.runner?.provider?.getBlock('latest');
      const currentTimestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);

      const deadline = currentTimestamp + parseInt(days) * 24 * 60 * 60;

      if (useGasless) {
        if (!forwarderContract) return;

        // Use helper to build request
        // Note: buildCreateProposalRequest expects 'deadline' as votingDuration because contract uses it directly
        const requestInput = await buildCreateProposalRequest(
          await daoContract.getAddress(),
          account,
          recipient,
          amountWei,
          deadline,
          description
        );

        // Sign using helper
        const { signature, request } = await signMetaTxRequest(signer, forwarderContract, requestInput);

        // Send to Relayer API
        const response = await fetch('/api/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request: {
              ...request,
              value: request.value.toString(),
              gas: request.gas.toString(),
              nonce: request.nonce.toString(),
            },
            signature
          }),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Relay failed');

        setSuccess(`¡Propuesta creada exitosamente (Gasless)! Tx: ${result.txHash.slice(0, 10)}...`);

      } else {
        // Standard transaction
        const tx = await daoContract.createProposal(recipient, amountWei, deadline, description);
        await tx.wait();
        setSuccess(`¡Propuesta creada exitosamente!`);
      }

      setRecipient('');
      setAmount('');
      setDays('7');
      setDescription('');
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
    <div className="bg-white rounded-2xl shadow-strong border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">
          <FileText className="w-6 h-6" />
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
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Balance insuficiente para crear propuestas</p>
            <p className="text-sm mt-1">
              Necesitas el 10% del total del DAO.
              <br />
              <strong>Requerido:</strong> {formatEther((totalBalance * 10n) / 100n)} ETH
              <br />
              <strong>Tienes:</strong> {formatEther(balance)} ETH
            </p>
            <p className="text-sm mt-2 font-medium">
              Por favor, deposita más fondos en el panel de "Financiar DAO" para habilitar esta función.
            </p>
          </div>
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
              <User className="w-5 h-5 text-slate-400" />
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

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the proposal..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm resize-none"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useGasless"
            checked={useGasless}
            onChange={(e) => setUseGasless(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="useGasless" className="text-sm text-slate-700 font-medium select-none cursor-pointer">
            Use gasless transaction (relayer pays gas)
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="mt-0.5">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="mt-0.5">{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canCreateProposal()}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 text-white" />
              Creando Propuesta...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Crear Propuesta {useGasless ? '(Gasless)' : ''}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
