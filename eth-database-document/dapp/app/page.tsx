'use client';

import { useState, useCallback, useEffect, DragEvent, useMemo } from 'react';
import WalletSelector from '../components/WalletSelector';
import FileUploader from '../components/FileUploader';
import DocumentSigner from '../components/DocumentSigner';
import DocumentVerifier from '../components/DocumentVerifier';
import DocumentHistory from '../components/DocumentHistory';

type Tab = 'sign' | 'verify' | 'history';
type Theme = 'light' | 'dark';

interface DocumentRecord {
  hash: string;
  fileName: string;
  timestamp: number;
  txHash: string;
  signer: string;
}

async function calculateHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function exportToCSV(documents: DocumentRecord[], fileName: string = 'documentos_registrados.csv') {
  const headers = ['Hash', 'Nombre Archivo', 'Fecha', 'TX Hash', 'Firmante'];
  const rows = documents.map(doc => [
    doc.hash, doc.fileName, new Date(doc.timestamp * 1000).toLocaleString(), doc.txHash, doc.signer
  ]);
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        theme === 'dark' ? 'bg-indigo-600 focus:ring-indigo-500' : 'bg-gray-300 focus:ring-gray-400'
      }`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${
        theme === 'dark' ? 'translate-x-7 bg-indigo-900' : 'translate-x-0.5 bg-white shadow-md'
      }`}>
        {theme === 'dark' ? (
          <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>('light');
  const [activeTab, setActiveTab] = useState<Tab>('sign');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("documents");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

  useEffect(() => {
    localStorage.setItem("documents", JSON.stringify(documents));
  }, [documents]);

  const toggleTheme = useCallback(() => setTheme(p => p === 'light' ? 'dark' : 'light'), []);
  const isDark = theme === 'dark';

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => d.fileName.toLowerCase().includes(q) || d.hash.toLowerCase().includes(q) || d.signer.toLowerCase().includes(q));
    }
    const now = Date.now(), day = 86400000;
    if (dateFilter === 'today') filtered = filtered.filter(d => now - d.timestamp * 1000 < day);
    else if (dateFilter === 'week') filtered = filtered.filter(d => now - d.timestamp * 1000 < day * 7);
    else if (dateFilter === 'month') filtered = filtered.filter(d => now - d.timestamp * 1000 < day * 30);
    filtered.sort((a, b) => sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return filtered;
  }, [documents, searchQuery, dateFilter, sortOrder]);

  const handleFileProcessed = useCallback((file: File, hash: string) => { setSelectedFile(file); setDocumentHash(hash); }, []);
  //const handleSignSuccess = useCallback((txHash: string) => { console.log('Document stored:', txHash); }, []);
  const handleSignSuccess = useCallback((txHash: string) => {
  if (!documentHash || !selectedFile) return;

  const newRecord: DocumentRecord = {
      hash: documentHash,
      fileName: selectedFile.name,
      timestamp: Math.floor(Date.now() / 1000),
      txHash,
      signer: "pending", // Si luego lo obtienes del contrato, reemplázalo
    };

    setDocuments(prev => [...prev, newRecord]);
  }, [documentHash, selectedFile]);

  const handleTabChange = useCallback((newTab: Tab) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => { setActiveTab(newTab); setTimeout(() => setIsTransitioning(false), 50); }, 150);
  }, [activeTab]);

  const processDroppedFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const hash = await calculateHash(file);
      setSelectedFile(file); setDocumentHash(hash); handleTabChange('sign');
    } catch (e) { console.error('Error:', e); }
    finally { setIsProcessing(false); }
  }, [handleTabChange]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processDroppedFile(e.dataTransfer.files[0]); }, [processDroppedFile]);

  const tabs = [{ id: 'sign' as Tab, label: 'Firmar', icon: '✍️' }, { id: 'verify' as Tab, label: 'Verificar', icon: '🔍' }, { id: 'history' as Tab, label: 'Historial', icon: '📋' }];

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
        .tab-content { animation: slideUp 0.25s ease-out forwards; }
        .tab-exit { opacity: 0; transition: opacity 0.15s; }
        .doc-row { animation: slideUp 0.3s ease-out forwards; opacity: 0; }
        .doc-row:nth-child(1) { animation-delay: 0ms; }
        .doc-row:nth-child(2) { animation-delay: 50ms; }
        .doc-row:nth-child(3) { animation-delay: 100ms; }
        .btn-hover { transition: all 0.2s; }
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className={`rounded-2xl shadow-2xl p-12 border-4 border-dashed border-blue-500 text-center animate-scaleIn ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Suelta el archivo aquí</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>El documento será procesado automáticamente</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className={`rounded-2xl shadow-2xl p-8 text-center animate-scaleIn ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Procesando...</h3>
          </div>
        </div>
      )}

      <header className={`shadow-sm border-b transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>ETH Document Registry</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Verificación descentralizada</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>🔧 Anvil</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4 flex justify-center">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${isDark ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Arrastra un archivo para firmarlo
          </span>
        </div>

        <section className="mb-8">
          <h2 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Wallet Conectada</h2>
          <WalletSelector />
        </section>

        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? isDark ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'
                    : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <span className="mr-2">{tab.icon}</span>{tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </button>
            ))}
          </div>

          <div className={`p-6 ${isTransitioning ? 'tab-exit' : 'tab-content'}`}>
            {activeTab === 'sign' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Subir y Firmar Documento</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Selecciona un archivo para calcular su hash SHA-256 y registrarlo en la blockchain.</p>
                  <FileUploader onFileProcessed={handleFileProcessed} />
                </div>
                {documentHash && (
                  <div className="animate-slideUp">
                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Firmar y Almacenar</h3>
                    <DocumentSigner documentHash={documentHash} fileName={selectedFile?.name || null} onSuccess={handleSignSuccess} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verify' && (
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Verificar Documento</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Comprueba si un documento ha sido registrado y quién lo firmó.</p>
                <DocumentVerifier />
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Historial de Documentos</h3>
                  </div>
                </div>
                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <DocumentHistory />
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Conectado a Anvil (localhost:8545)</span>
          </div>
        </footer>
      </main>
    </div>
  );
}