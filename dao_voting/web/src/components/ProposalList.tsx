'use client';

import { useState } from 'react';
import { useProposals } from '@/hooks/useProposals';
import ProposalCard from './ProposalCard';
import { ClipboardList, RefreshCw, Inbox, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProposalList() {
  const { proposals, loading, refresh, currentBlockTime } = useProposals();
  const [useGaslessVoting, setUseGaslessVoting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter proposals based on search term (ID or Description)
  const filteredProposals = proposals.filter((p) => {
    const idMatch = p.id.toString().includes(searchTerm);
    const descMatch = p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return idMatch || descMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Propuestas</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600 mr-3" />
          <p className="text-gray-600">Cargando propuestas...</p>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Propuestas</h2>
        <div className="text-center py-8">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-gray-600">No hay propuestas aún. ¡Crea la primera!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-strong border border-slate-200 p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
            <ClipboardList className="w-6 h-6" />
          </span>
          Propuestas Activas
        </h2>

        <div className="flex gap-4">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl mb-6 gap-4 border border-slate-100">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por ID o descripción..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="gaslessVoting"
            checked={useGaslessVoting}
            onChange={(e) => setUseGaslessVoting(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="gaslessVoting" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
            Gasless voting
          </label>
        </div>
      </div>

      {paginatedProposals.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 border-dashed flex flex-col items-center">
          <Inbox className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">No se encontraron propuestas.</p>
          <p className="text-slate-400 text-sm mt-2">Intenta con otros términos de búsqueda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id.toString()}
              proposal={proposal}
              onUpdate={refresh}
              isGasless={useGaslessVoting}
              currentBlockTime={currentBlockTime}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProposals.length)} de {filteredProposals.length} propuestas
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
