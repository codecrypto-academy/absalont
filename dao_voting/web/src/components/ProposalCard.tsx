'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { Proposal, VoteType } from '@/lib/contracts';
import { formatEther } from 'ethers';
import VoteButtons from './VoteButtons';

interface ProposalCardProps {
  proposal: Proposal;
  onUpdate: () => void;
}

export default function ProposalCard({ proposal, onUpdate }: ProposalCardProps) {
  const { account } = useWeb3();
  const { daoContract } = useContracts();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!daoContract || !account) return;

    const checkVote = async () => {
      try {
        const voted = await daoContract.hasUserVoted(proposal.id, account);
        setHasVoted(voted);
        
        if (voted) {
          const vote = await daoContract.getUserVote(proposal.id, account);
          setUserVote(vote);
        }
      } catch (error) {
        console.error('Error checking vote:', error);
      }
    };

    checkVote();
  }, [daoContract, account, proposal.id]);

  const isActive = () => {
    const now = Math.floor(Date.now() / 1000);
    return now < Number(proposal.deadline) && !proposal.executed;
  };

  const isApproved = () => {
    return proposal.votesAFavor > proposal.votesEnContra;
  };

  const canExecute = () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(proposal.deadline);
    const safetyPeriod = 3600; // 1 hour
    return now >= deadline + safetyPeriod && !proposal.executed && isApproved();
  };

  const getStatus = () => {
    if (proposal.executed) return { text: 'Ejecutada', color: 'bg-blue-100 text-blue-800' };
    if (isActive()) return { text: 'Activa', color: 'bg-green-100 text-green-800' };
    if (isApproved()) return { text: 'Aprobada', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Rechazada', color: 'bg-red-100 text-red-800' };
  };

  const getVoteTypeLabel = (voteType: VoteType) => {
    switch (voteType) {
      case VoteType.A_FAVOR:
        return 'A Favor';
      case VoteType.EN_CONTRA:
        return 'En Contra';
      case VoteType.ABSTENCION:
        return 'Abstención';
      default:
        return 'Desconocido';
    }
  };

  const handleExecute = async () => {
    if (!daoContract) return;

    setExecuting(true);
    try {
      const tx = await daoContract.executeProposal(proposal.id);
      await tx.wait();
      onUpdate();
    } catch (error: any) {
      console.error('Error executing proposal:', error);
      alert(error.message || 'Error al ejecutar propuesta');
    } finally {
      setExecuting(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString('es-ES');
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">Propuesta #{proposal.id.toString()}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm text-gray-600">Beneficiario</p>
          <p className="font-mono text-sm">{proposal.recipient}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Cantidad</p>
          <p className="font-semibold text-lg">{formatEther(proposal.amount)} ETH</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Fecha límite</p>
          <p className="font-medium">{formatDate(proposal.deadline)}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Votos</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{proposal.votesAFavor.toString()}</p>
            <p className="text-xs text-gray-600">A Favor</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{proposal.votesEnContra.toString()}</p>
            <p className="text-xs text-gray-600">En Contra</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{proposal.votesAbstencion.toString()}</p>
            <p className="text-xs text-gray-600">Abstención</p>
          </div>
        </div>
      </div>

      {hasVoted && userVote !== null && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded mb-4 text-sm">
          Tu voto: <strong>{getVoteTypeLabel(userVote)}</strong>
        </div>
      )}

      {isActive() && (
        <VoteButtons proposalId={proposal.id} onVoteSuccess={onUpdate} />
      )}

      {canExecute() && account && (
        <button
          onClick={handleExecute}
          disabled={executing}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {executing ? 'Ejecutando...' : 'Ejecutar Propuesta'}
        </button>
      )}
    </div>
  );
}
