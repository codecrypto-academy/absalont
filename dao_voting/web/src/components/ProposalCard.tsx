'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useContracts } from '@/hooks/useContracts';
import { Proposal, VoteType } from '@/lib/contracts';
import { formatEther } from 'ethers';
import VoteButtons from './VoteButtons';
import { Hash, CheckCircle2 } from 'lucide-react';

interface ProposalCardProps {
  proposal: Proposal;
  onUpdate: () => void;
  isGasless?: boolean;
  currentBlockTime?: number;
}

export default function ProposalCard({ proposal, onUpdate, isGasless = false, currentBlockTime }: ProposalCardProps) {
  const { account } = useWeb3();
  const { daoContract } = useContracts();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [executing, setExecuting] = useState(false);

  // Use blockchain time if available, otherwise fallback to local time
  const now = currentBlockTime || Math.floor(Date.now() / 1000);

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
    return now < Number(proposal.deadline) && !proposal.executed;
  };

  const isApproved = () => {
    return proposal.votesAFavor > proposal.votesEnContra;
  };

  const canExecute = () => {
    const deadline = Number(proposal.deadline);
    const safetyPeriod = 3600; // 1 hour (DAOVoting.sol: SAFETY_PERIOD)
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-300 w-full mb-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Info & Description */}
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Hash className="w-5 h-5 text-slate-400 mr-1" />
              {proposal.id.toString()}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status.color}`}>
              {status.text}
            </span>
            <div className="text-sm text-slate-500 flex items-center gap-1 ml-2">
              <span className="font-semibold">Vence:</span> {formatDate(proposal.deadline)}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs mb-1">Beneficiario</p>
            <p className="font-mono text-sm text-slate-700 break-all">{proposal.recipient}</p>
          </div>

          <div className="mb-4">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs mb-1">Descripción</p>
            <p className="text-slate-700 text-sm whitespace-pre-wrap">{proposal.description || 'Sin descripción'}</p>
          </div>

          <div className="mb-4">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs mb-1">Cantidad</p>
            <p className="font-bold text-xl text-slate-900">{formatEther(proposal.amount)} <span className="text-sm text-slate-500 font-normal">ETH</span></p>
          </div>
        </div>

        {/* Right Column: Voting & Actions */}
        <div className="lg:w-1/3 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Resultados</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                <p className="text-lg font-bold text-green-600">{proposal.votesAFavor.toString()}</p>
                <p className="text-[10px] text-green-700 font-medium uppercase">A Favor</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                <p className="text-lg font-bold text-red-600">{proposal.votesEnContra.toString()}</p>
                <p className="text-[10px] text-red-700 font-medium uppercase">En Contra</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-2 border border-slate-200">
                <p className="text-lg font-bold text-slate-600">{proposal.votesAbstencion.toString()}</p>
                <p className="text-[10px] text-slate-700 font-medium uppercase">Abst.</p>
              </div>
            </div>
          </div>

          {hasVoted && userVote !== null && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tu voto: <strong>{getVoteTypeLabel(userVote)}</strong></span>
            </div>
          )}

          <div className="mt-auto">
            {isActive() && (
              <VoteButtons proposalId={proposal.id} onVoteSuccess={onUpdate} isGasless={isGasless} />
            )}

            {canExecute() && account && (
              <button
                onClick={handleExecute}
                disabled={executing}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                {executing ? 'Ejecutando...' : 'Ejecutar Propuesta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
