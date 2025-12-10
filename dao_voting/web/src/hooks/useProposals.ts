import { useState, useEffect, useCallback, useRef } from 'react';
import { useContracts } from './useContracts';
import { Proposal } from '@/lib/contracts';

export function useProposals() {
  const { daoContract } = useContracts();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  const refresh = useCallback(async () => {
    if (!daoContract) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const count = await daoContract.getProposalCount();
      const proposalPromises = [];
      for (let i = 1; i <= Number(count); i++) {
        proposalPromises.push(daoContract.getProposal(i));
      }
      const fetchedProposals = await Promise.all(proposalPromises);
      setProposals(fetchedProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  }, [daoContract]);

  useEffect(() => {
    if (!daoContract) return;

    // Initial fetch only once
    if (!isInitialized.current) {
      refresh();
      isInitialized.current = true;
    }

    const filterProposalCreated = daoContract.filters.ProposalCreated();
    const filterVoted = daoContract.filters.Voted();
    const filterExecuted = daoContract.filters.ProposalExecuted();

    daoContract.on(filterProposalCreated, refresh);
    daoContract.on(filterVoted, refresh);
    daoContract.on(filterExecuted, refresh);

    return () => {
      daoContract.off(filterProposalCreated, refresh);
      daoContract.off(filterVoted, refresh);
      daoContract.off(filterExecuted, refresh);
    };
  }, [daoContract, refresh]);

  return { proposals, loading, refresh };
}
