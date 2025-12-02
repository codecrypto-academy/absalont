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

  const voteGasless = async (voteType: VoteType) => {
    if (!account || !signer || !daoContract || !forwarderContract) return;

    setLoading(true);
    setError(null);

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

      // Send to relayer
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request,
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar voto');
      }

      const result = await response.json();
      console.log('Vote transaction:', result.txHash);

      // Wait for transaction confirmation
      if (provider) {
        await provider.waitForTransaction(result.txHash);
      }

      onVoteSuccess();
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.message || 'Error al votar');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return <p className="text-gray-500 text-sm">Conecta tu wallet para votar</p>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => voteGasless(VoteType.A_FAVOR)}
          disabled={loading}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          A Favor
        </button>
        <button
          onClick={() => voteGasless(VoteType.EN_CONTRA)}
          disabled={loading}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          En Contra
        </button>
        <button
          onClick={() => voteGasless(VoteType.ABSTENCION)}
          disabled={loading}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Abstención
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-600">Procesando voto gasless...</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
