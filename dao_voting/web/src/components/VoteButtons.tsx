'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { VoteType, ForwardRequest, FORWARDER_ADDRESS, CHAIN_ID } from '@/lib/contracts';
import { AbiCoder } from 'ethers';

interface VoteButtonsProps {
  proposalId: bigint;
  onVoteSuccess: () => void;
}

export default function VoteButtons({ proposalId, onVoteSuccess }: VoteButtonsProps) {
  const { account, signer, provider } = useWeb3();
  const { daoContract, forwarderContract } = useContracts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const voteGasless = async (voteType: VoteType) => {
    if (!account || !signer || !daoContract || !forwarderContract) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Encode the vote function call
      const abiCoder = new AbiCoder();
      const data = daoContract.interface.encodeFunctionData('vote', [proposalId, voteType]);

      // Get nonce
      const nonce = await forwarderContract.getNonce(account);

      // Create forward request
      const request: ForwardRequest = {
        from: account,
        to: await daoContract.getAddress(),
        value: 0n,
        gas: 200000n,
        nonce: nonce,
        data: data,
      };

      // EIP-712 domain
      const domain = {
        name: 'MinimalForwarder',
        version: '0.0.1',
        chainId: CHAIN_ID,
        verifyingContract: FORWARDER_ADDRESS,
      };

      // EIP-712 types
      const types = {
        ForwardRequest: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'data', type: 'bytes' },
        ],
      };

      // Sign the typed data
      const signature = await signer.signTypedData(domain, types, request);

      // Send to relayer (convert BigInt to string for JSON serialization)
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

      // Wait for transaction confirmation with timeout
      if (provider) {
        console.log('⏳ Waiting for confirmation...');
        const receipt = await Promise.race([
          provider.waitForTransaction(result.txHash),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout esperando confirmación')), 60000)
          )
        ]);
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
          errorMessage = 'La transacción está tardando más de lo esperado. Por favor, actualiza la página en unos momentos.';
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
          onClick={() => voteGasless(VoteType.A_FAVOR)}
          disabled={loading}
          className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 hover:border-green-300 font-bold py-3 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="text-xl mb-1">👍</span>
          <span className="text-xs">A Favor</span>
        </button>
        <button
          onClick={() => voteGasless(VoteType.EN_CONTRA)}
          disabled={loading}
          className="flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 font-bold py-3 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="text-xl mb-1">👎</span>
          <span className="text-xs">En Contra</span>
        </button>
        <button
          onClick={() => voteGasless(VoteType.ABSTENCION)}
          disabled={loading}
          className="flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold py-3 px-2 rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="text-xl mb-1">😐</span>
          <span className="text-xs">Abstención</span>
        </button>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-center text-sm text-blue-700 mt-3 animate-pulse">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Procesando voto gasless...
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm mt-3 flex items-center gap-2">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mt-3 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
