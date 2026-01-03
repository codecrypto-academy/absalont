'use client';

import { useWallet } from '@/context/WalletContext';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConnectionButton = () => {
  const { account, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await connect();
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Error al conectar');
      // Limpiar error después de unos segundos
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Wallet className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
          <span className="relative">
            {loading ? 'Conectando...' : 'Conectar Wallet'}
          </span>
        </button>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass hover:bg-white/5 px-4 py-2.5 rounded-xl flex items-center gap-3 border-white/10 transition-all font-mono text-sm font-bold group"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-gray-200">{formatAddress(account)}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div key="dropdown-wrapper">
            <div key="backdrop" className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-48 glass rounded-2xl border-white/10 p-2 z-50 shadow-2xl backdrop-blur-2xl"
            >
              <button
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Desconectar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
