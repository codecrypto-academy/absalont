'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContract } from '../hooks/useContract';
import { ethersUtils, EthersUtils } from '../utils/ethers';
import { HashUtils } from '../utils/hash';

interface DocumentRecord {
  hash: string;
  timestamp: bigint;
  signer: string;
}

type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortOrder = 'newest' | 'oldest';

function exportDocumentsToCSV(documents: DocumentRecord[], fileName: string = 'mis_documentos_verificados.csv') {
  if (documents.length === 0) return;
  const headers = ['Hash', 'Fecha y Hora', 'Firmante'];
  const rows = documents.map(doc => [doc.hash, EthersUtils.formatTimestamp(doc.timestamp), doc.signer]);
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function DocumentHistory() {
  const { currentAddress, isConnected } = useWallet();
  const { getUserDocuments, getDocumentInfo, isLoading } = useContract();
  
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar y ordenar documentos
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];
    
    // Búsqueda por hash o firmante
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.hash.toLowerCase().includes(query) ||
        doc.signer.toLowerCase().includes(query)
      );
    }
    
    // Filtro por fecha
    const now = Date.now();
    const day = 86400000;
    if (dateFilter === 'today') {
      filtered = filtered.filter(doc => now - Number(doc.timestamp) * 1000 < day);
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(doc => now - Number(doc.timestamp) * 1000 < day * 7);
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(doc => now - Number(doc.timestamp) * 1000 < day * 30);
    }
    
    // Ordenamiento
    filtered.sort((a, b) => 
      sortOrder === 'newest' 
        ? Number(b.timestamp - a.timestamp) 
        : Number(a.timestamp - b.timestamp)
    );
    
    return filtered;
  }, [documents, searchQuery, dateFilter, sortOrder]);

  const loadDocuments = useCallback(async () => {
    if (!currentAddress) return;
    setIsLoadingDocs(true);
    setError(null);
    try {
      const docHashes = await getUserDocuments();
      const total = await ethersUtils.getTotalDocuments();
      setTotalDocs(Number(total));
      const docsWithInfo: DocumentRecord[] = [];
      for (const hash of docHashes) {
        const info = await getDocumentInfo(hash);
        if (info && info.exists) {
          docsWithInfo.push({ hash, timestamp: info.timestamp, signer: info.signer });
        }
      }
      docsWithInfo.sort((a, b) => Number(b.timestamp - a.timestamp));
      setDocuments(docsWithInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar documentos');
    } finally {
      setIsLoadingDocs(false);
    }
  }, [currentAddress, getUserDocuments, getDocumentInfo]);

  useEffect(() => {
    if (isConnected && currentAddress) loadDocuments();
  }, [isConnected, currentAddress, loadDocuments]);

  const toggleExpand = (hash: string) => setExpandedHash(expandedHash === hash ? null : hash);
  
  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch (err) { console.error('Failed to copy:', err); }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportDocumentsToCSV(filteredDocuments, `documentos_verificados_${timestamp}.csv`);
    } catch (err) { console.error('Error exporting CSV:', err); }
    finally { setTimeout(() => setIsExporting(false), 1000); }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setSortOrder('newest');
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || sortOrder !== 'newest';

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-gray-500">Conecta tu wallet para ver tu historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-blue-100 text-sm">Mis Documentos</p>
          <p className="text-3xl font-bold">{documents.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-sm">Total en Blockchain</p>
          <p className="text-3xl font-bold">{totalDocs}</p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por hash o firmante..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Toggle filtros */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span className="ml-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
        </button>

        {/* Botón actualizar */}
        <button
          onClick={loadDocuments}
          disabled={isLoadingDocs}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <svg className={`w-4 h-4 mr-1.5 ${isLoadingDocs ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoadingDocs ? 'Cargando...' : 'Actualizar'}
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Contador de resultados */}
        {hasActiveFilters && (
          <span className="text-sm text-gray-500">
            {filteredDocuments.length} de {documents.length}
          </span>
        )}

        {/* Botón exportar */}
        <button
          onClick={handleExportCSV}
          disabled={filteredDocuments.length === 0 || isExporting || isLoadingDocs}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            filteredDocuments.length === 0 || isExporting || isLoadingDocs
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }`}
        >
          {isExporting ? (
            <>
              <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Exportando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </>
          )}
        </button>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-3">
            {/* Filtro por fecha */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">📅 Todas las fechas</option>
                <option value="today">🕐 Hoy</option>
                <option value="week">📆 Última semana</option>
                <option value="month">🗓️ Último mes</option>
              </select>
            </div>

            {/* Ordenamiento */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Ordenar por</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="newest">⬇️ Más recientes primero</option>
                <option value="oldest">⬆️ Más antiguos primero</option>
              </select>
            </div>
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Lista de documentos */}
      {isLoadingDocs ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20"></div>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-8 bg-gray-50 rounded-xl text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">
            {hasActiveFilters ? 'No se encontraron documentos' : 'No tienes documentos registrados'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Sube y firma tu primer documento'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.hash}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div
                onClick={() => toggleExpand(doc.hash)}
                className="p-4 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-gray-700 truncate">
                      {HashUtils.formatHash(doc.hash, 12)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {EthersUtils.formatTimestamp(doc.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    ✓ Verificado
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedHash === doc.hash ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedHash === doc.hash && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                  <div className="mt-3 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Hash completo:</span>
                      <div className="flex items-center mt-1">
                        <p className="font-mono text-xs text-gray-700 break-all flex-1 bg-white p-2 rounded border border-gray-200">
                          {doc.hash}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.hash); }}
                          className="ml-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Copiar hash"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Firmante:</span>
                      <div className="flex items-center mt-1">
                        <p className="font-mono text-xs text-gray-700 break-all flex-1 bg-white p-2 rounded border border-gray-200">
                          {doc.signer}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.signer); }}
                          className="ml-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Copiar dirección"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}