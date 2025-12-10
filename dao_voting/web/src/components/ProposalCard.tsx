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
          // Convert BigInt to number if necessary
          setUserVote(Number(vote));
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

  const getVoteTypeLabel = (voteType: number) => {
    // Ensure we compare numbers
    const type = Number(voteType);
    switch (type) {
      case 0: // VoteType.A_FAVOR
        return 'A Favor';
      case 1: // VoteType.EN_CONTRA
        return 'En Contra';
      case 2: // VoteType.ABSTENCION
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md hover:border-primary-200 transition-all duration-300 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          <span className="text-slate-400 mr-2">#</span>
          {proposal.id.toString()}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="space-y-4 mb-6 flex-grow">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Beneficiario</p>
          <p className="font-mono text-sm text-slate-700 break-all">{proposal.recipient}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Cantidad</p>
            <p className="font-bold text-xl text-slate-900">{formatEther(proposal.amount)} <span className="text-sm text-slate-500 font-normal">ETH</span></p>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Fecha límite</p>
            <p className="font-medium text-sm text-slate-900">{formatDate(proposal.deadline)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6 mt-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Resultados de Votación</p>
        <div className="grid grid-cols-3 gap-2 text-center mb-6">
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <p className="text-xl font-bold text-green-600">{proposal.votesAFavor.toString()}</p>
            <p className="text-xs text-green-700 font-medium mt-1">A Favor</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <p className="text-xl font-bold text-red-600">{proposal.votesEnContra.toString()}</p>
            <p className="text-xs text-red-700 font-medium mt-1">En Contra</p>
          </div>
          <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
            <p className="text-xl font-bold text-slate-600">{proposal.votesAbstencion.toString()}</p>
            <p className="text-xs text-slate-700 font-medium mt-1">Abstención</p>
          </div>
        </div>

        {hasVoted && userVote !== null && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center justify-center gap-2">
            <span>🗳️</span>
            <span>Tu voto: <strong>{getVoteTypeLabel(userVote)}</strong></span>
          </div>
        )}

        {isActive() && (
          <VoteButtons proposalId={proposal.id} onVoteSuccess={onUpdate} />
        )}

        {canExecute() && account && (
          <button
            onClick={handleExecute}
            disabled={executing}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
          >
            {executing ? 'Ejecutando...' : 'Ejecutar Propuesta'}
          </button>
        )}
      </div>
    </div>
  );
}
