'use client';

import { useWallet } from '@/context/WalletContext';
import { useState } from 'react';
import { Wallet, LogOut, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WalletSelector() {
  const { account, connected, connect, disconnect, ensureCorrectNetwork } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error connecting wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setError(null);
  };

  const displayAccount = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {connected ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-mono font-bold text-white tracking-tight">
                {displayAccount}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 active:scale-95"
              title="Desconectar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:bg-gray-800 disabled:text-gray-500"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            <span>{loading ? 'Conectando...' : 'Conectar Wallet'}</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-[10px] text-rose-400 font-bold uppercase tracking-tight bg-rose-500/5 p-2 rounded-lg border border-rose-500/10"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
