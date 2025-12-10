'use client';

import { useProposals } from '@/hooks/useProposals';
import ProposalCard from './ProposalCard';

export default function ProposalList() {
  const { proposals, loading, refresh } = useProposals();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Propuestas</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
          <p className="text-gray-600">Cargando propuestas...</p>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Propuestas</h2>
        <p className="text-gray-600">No hay propuestas aún. ¡Crea la primera!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
            🗳️
          </span>
          Propuestas Activas
        </h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl transition-all"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          {loading ? 'Actualizando...' : 'Actualizar Lista'}
        </button>
      </div>

      {loading && proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
          <p>Cargando propuestas...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-slate-600 font-medium">No hay propuestas activas en este momento.</p>
          <p className="text-slate-400 text-sm mt-2">¡Sé el primero en crear una!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id.toString()} proposal={proposal} onUpdate={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
