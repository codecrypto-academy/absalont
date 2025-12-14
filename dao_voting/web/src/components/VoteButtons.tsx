'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { VoteType, ForwardRequest, FORWARDER_ADDRESS } from '@/lib/contracts';
import { buildVoteRequest, signMetaTxRequest } from '@/lib/meta-tx';
import { ThumbsUp, ThumbsDown, MinusCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface VoteButtonsProps {
  proposalId: bigint;
  onVoteSuccess: () => void;
  isGasless?: boolean;
}

export default function VoteButtons({ proposalId, onVoteSuccess, isGasless = false }: VoteButtonsProps) {
  const { account, signer, provider } = useWeb3();
  const { daoContract, forwarderContract } = useContracts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVote = async (voteType: VoteType) => {
    if (!account || !signer || !daoContract) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isGasless) {
        if (!forwarderContract) return;

        // Use helper to build request
        const requestInput = await buildVoteRequest(
          await daoContract.getAddress(),
          account,
          proposalId,
          voteType
        );

        // Sign using helper
        const { signature, request } = await signMetaTxRequest(signer, forwarderContract, requestInput);

        // Send to Relayer API
        const response = await fetch('/api/relay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request: {
              from: request.from,
              to: request.to,
              value: request.value.toString(),
              gas: request.gas.toString(),
              nonce: request.nonce.toString(),
              data: request.data,
            },
            signature,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error de red' }));
          throw new Error(errorData.error || 'Error al enviar voto');
        }

        const result = await response.json();
        console.log('✅ Vote transaction sent:', result.txHash);

        // Wait logic for Relayer tx... (simplified for brevity, assume similar handling)
        if (provider) {
          await provider.waitForTransaction(result.txHash);
        }

      } else {
        // Standard Vote
        const tx = await daoContract.vote(proposalId, voteType);
        console.log('✅ Vote transaction sent (Standard):', tx.hash);
        await tx.wait();
        console.log('✅ Transaction confirmed!');
      }

      console.log('✅ Vote registered successfully!');
      setSuccess('¡Voto registrado exitosamente!');
      onVoteSuccess();
    } catch (err: any) {
      console.error('❌ Error voting:', err);

      // Better error messages
      let errorMessage = 'Error al votar';
      if (err.message) {
        if (err.message.includes('user rejected')) {
          errorMessage = 'Firma rechazada por el usuario';
        } else if (err.message.includes('Timeout')) {
          errorMessage = 'Timeout esperando confirmación.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica que Anvil esté corriendo.';
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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-sm mb-2">Conecta tu wallet para participar</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          onClick={() => handleVote(VoteType.A_FAVOR)}
          disabled={loading}
          className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 hover:border-green-300 font-bold py-3 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ThumbsUp className="w-6 h-6 mb-1" />
          <span className="text-xs">A Favor</span>
        </button>
        <button
          onClick={() => handleVote(VoteType.EN_CONTRA)}
          disabled={loading}
          className="flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 font-bold py-3 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ThumbsDown className="w-6 h-6 mb-1" />
          <span className="text-xs">En Contra</span>
        </button>
        <button
          onClick={() => handleVote(VoteType.ABSTENCION)}
          disabled={loading}
          className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold py-3 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <MinusCircle className="w-6 h-6 mb-1" />
          <span className="text-xs">Abstención</span>
        </button>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-center text-sm text-blue-700 mt-3 animate-pulse">
          <Loader2 className="animate-spin h-4 w-4 text-blue-600 mr-2" />
          {isGasless ? 'Procesando voto gasless...' : 'Procesando voto...'}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm mt-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mt-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
