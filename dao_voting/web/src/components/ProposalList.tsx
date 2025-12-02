'use client';

import { useProposals } from '@/hooks/useProposals';
import ProposalCard from './ProposalCard';

export default function ProposalList() {
  const { proposals, loading, refresh } = useProposals();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Propuestas</h2>
        <p className="text-gray-600">Cargando propuestas...</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Propuestas</h2>
        <p className="text-gray-600">No hay propuestas aún. ¡Crea la primera!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Propuestas</h2>
        <button
          onClick={refresh}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.id.toString()} proposal={proposal} onUpdate={refresh} />
        ))}
      </div>
    </div>
  );
}
