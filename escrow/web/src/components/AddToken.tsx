'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/context/WalletContext';
import { PlusCircle, ShieldAlert, CheckCircle2, Loader2, Key, List, Info, ExternalLink } from 'lucide-react';
import { ERC20_ABI } from '@/lib/constants';
import { useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';

export function AddToken() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const { account, provider } = useWallet();
  const { addToken, getAllowedTokens } = useContract();
  const [tokensInfo, setTokensInfo] = useState<{ address: string; symbol: string }[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const loadTokensInfo = async () => {
    if (!provider || !getAllowedTokens) return;
    try {
      setLoadingTokens(true);
      const addresses = await getAllowedTokens();
      const info = await Promise.all(addresses.map(async (addr) => {
        try {
          const contract = new ethers.Contract(addr, ERC20_ABI, provider);
          const symbol = await contract.symbol();
          return { address: addr, symbol };
        } catch (e) {
          return { address: addr, symbol: '???' };
        }
      }));
      setTokensInfo(info);
    } catch (err) {
      console.error('Error info tokens:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    loadTokensInfo();
  }, [provider]);

  const handleAddToken = async () => {
    if (!account) {
      setResult({ type: 'error', text: 'Wallet desconectada' });
      return;
    }

    if (!tokenAddress.trim() || !tokenAddress.startsWith('0x')) {
      setResult({ type: 'error', text: 'Dirección inválida' });
      return;
    }

    try {
      setIsLoading(true);
      setResult({ type: 'info', text: 'Procesando en blockchain...' });

      await addToken(tokenAddress);

      setResult({ type: 'success', text: 'Token autorizado correctamente' });
      setTokenAddress('');
      await loadTokensInfo();
    } catch (error: any) {
      setResult({ type: 'error', text: error?.message || 'Error en la autorización' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-4 h-4 text-indigo-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Autorización Admin</h3>
      </div>

      <div className="relative group">
        <input
          type="text"
          placeholder="Dirección del contrato (0x...)"
          value={tokenAddress}
          onChange={(e) => {
            setTokenAddress(e.target.value);
            setResult(null);
          }}
          className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500/30 transition-all"
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <button
            onClick={handleAddToken}
            disabled={isLoading || !account || !tokenAddress}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white rounded-lg transition-all shadow-lg active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-[11px] font-bold uppercase tracking-tight ${result.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : result.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
          >
            {result.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            {result.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-gray-500">
            <List className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tokens Permitidos</span>
          </div>
          {loadingTokens && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
        </div>

        <div className="grid gap-2">
          {tokensInfo.length === 0 && !loadingTokens ? (
            <div className="text-[10px] text-gray-700 italic text-center py-2">No hay tokens autorizados aún</div>
          ) : (
            tokensInfo.map((token, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase">
                    {token.symbol[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{token.symbol}</div>
                    <div className="text-[8px] font-mono text-gray-600 group-hover:text-gray-400 truncate w-32">
                      {token.address}
                    </div>
                  </div>
                </div>
                <button className="text-gray-600 hover:text-indigo-400 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
          Solo el propietario del contrato ("Owner") puede autorizar nuevos tokens para el intercambio.
        </p>
      </div>
    </div>
  );
}
