'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from '@/lib/constants';
import { ErrorAlert } from '@/components/ErrorAlert';
import { formatErrorDisplay, logError, sleep } from '@/lib/errorUtils';
import {
  Search,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  Users,
  ExternalLink,
  ChevronDown,
  RefreshCcw,
  Zap,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OperationData {
  initiator: string;
  recipient: string;
  amountA: bigint;
  amountB: bigint;
  tokenA: string;
  tokenB: string;
  status: number;
  createdAt: bigint;
  closedAt: bigint;
}

interface OperationDisplay {
  id: number;
  initiator: string;
  recipient: string;
  amountA: string;
  amountB: string;
  rawAmountA: bigint;
  rawAmountB: bigint;
  tokenA: string;
  tokenB: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: bigint;
  closedAt: bigint;
  isCreator: boolean;
  isRecipient: boolean;
}

export function OperationsList() {
  const { signer, provider, account } = useWallet();
  const [operations, setOperations] = useState<OperationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    loadOperations();
    const interval = setInterval(loadOperations, 8000);
    return () => clearInterval(interval);
  }, [provider, account]);

  const loadOperations = async () => {
    if (!provider) return;

    try {
      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      let allOps: OperationData[] = [];
      try {
        allOps = await escrowContract.getAllOperations();
      } catch (err) {
        logError('OperationsList: getAllOperations fallback', err);
        allOps = [];
      }

      const processed = allOps.map((op: OperationData, index: number) => {
        const statusMap: { [key: number]: 'PENDING' | 'COMPLETED' | 'CANCELLED' } = {
          0: 'PENDING',
          1: 'COMPLETED',
          2: 'CANCELLED',
          3: 'CANCELLED',
        };

        const isCreator = account?.toLowerCase() === op.initiator.toLowerCase();
        const isRecipient = account?.toLowerCase() === op.recipient.toLowerCase();

        return {
          id: index,
          initiator: op.initiator,
          recipient: op.recipient,
          amountA: ethers.formatEther(op.amountA),
          amountB: ethers.formatEther(op.amountB),
          rawAmountA: op.amountA,
          rawAmountB: op.amountB,
          tokenA: op.tokenA,
          tokenB: op.tokenB,
          status: (Number(op.status) === 0 ? 'PENDING' : (Number(op.status) === 1 ? 'COMPLETED' : 'CANCELLED')) as 'PENDING' | 'COMPLETED' | 'CANCELLED',
          createdAt: op.createdAt,
          closedAt: op.closedAt,
          isCreator,
          isRecipient,
        };
      });

      setOperations(processed.reverse());
      setLoading(false);
    } catch (err) {
      logError('OperationsList: loadOperations', err);
      setLoading(false);
    }
  };

  const approveTokenB = async (operation: OperationDisplay): Promise<boolean> => {
    try {
      if (!signer) return false;
      const tokenContract = new ethers.Contract(operation.tokenB, ERC20_ABI, signer);
      const amount = operation.rawAmountB;
      const currentAllowance = await tokenContract.allowance(account, ESCROW_ADDRESS);
      if (currentAllowance >= amount) return true;
      const tx = await tokenContract.approve(ESCROW_ADDRESS, amount);
      await tx.wait();
      return true;
    } catch (err) {
      logError('OperationsList: approveTokenB', err);
      setError(formatErrorDisplay(err));
      return false;
    }
  };

  const completeOperationCall = async (operationId: number, operation: OperationDisplay): Promise<boolean> => {
    try {
      if (!signer) return false;
      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const amountB = operation.rawAmountB;
      const tx = await escrowContract.completeOperation(operationId, amountB);
      await tx.wait();
      return true;
    } catch (err) {
      logError('OperationsList: completeOperationCall', err);
      setError(formatErrorDisplay(err));
      return false;
    }
  };

  const handleComplete = async (operationId: number, operation: OperationDisplay) => {
    try {
      setError(null);
      setCompleting(operationId);
      const approved = await approveTokenB(operation);
      if (!approved) {
        setCompleting(null);
        return;
      }
      await sleep(1000);
      const completed = await completeOperationCall(operationId, operation);
      if (completed) await loadOperations();
      setCompleting(null);
    } catch (err) {
      logError('OperationsList: handleComplete', err);
      setError(formatErrorDisplay(err));
      setCompleting(null);
    }
  };

  const handleCancel = async (operationId: number) => {
    try {
      setError(null);
      setCancelling(operationId);
      if (!signer) return;
      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tx = await escrowContract.cancelOperation(operationId);
      await tx.wait();
      await loadOperations();
      setCancelling(null);
    } catch (err) {
      logError('OperationsList: handleCancel', err);
      setError(formatErrorDisplay(err));
      setCancelling(null);
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return '-';
    return new Date(Number(timestamp) * 1000).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOperations = operations.filter(op => {
    const matchesSearch =
      op.initiator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.id.toString().includes(searchTerm);
    const matchesFilter = filter === 'ALL' || op.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]/50 backdrop-blur-sm">
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg">Historial Operaciones</h2>
          </div>
          <button
            onClick={loadOperations}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${filter === f
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'border-white/5 text-gray-500 hover:text-white hover:border-white/10'
                }`}
            >
              {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Activas' : f === 'COMPLETED' ? 'Completadas' : 'Canceladas'}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por ID o Dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px] p-6 space-y-4 custom-scrollbar">
        {error && (
          <div className="mb-4">
            <ErrorAlert
              title={error.title}
              message={error.message}
              onClose={() => setError(null)}
            />
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filteredOperations.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="p-4 bg-white/5 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-500 font-medium tracking-tight">No se encontraron operaciones</p>
              <p className="text-[10px] text-gray-700 mt-1 uppercase tracking-widest font-bold">Refina tu búsqueda o crea una nueva</p>
            </motion.div>
          ) : (
            filteredOperations.map((op) => (
              <motion.div
                key={op.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative glass-hover overflow-hidden rounded-2xl border ${op.status === 'PENDING'
                  ? 'border-white/5'
                  : op.status === 'COMPLETED'
                    ? 'border-emerald-500/10'
                    : 'border-rose-500/10'
                  }`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${op.status === 'PENDING' ? 'bg-amber-500/40' : op.status === 'COMPLETED' ? 'bg-emerald-500/40' : 'bg-rose-500/40'
                  }`} />

                <div className="p-4 pl-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-tighter">ID #{op.id}</span>
                      <div className={`status-badge ${op.status === 'PENDING' ? 'status-pending' : op.status === 'COMPLETED' ? 'status-completed' : 'status-cancelled'
                        }`}>
                        {op.status === 'PENDING' ? (
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Active</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {op.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                          </span>
                        )}
                      </div>
                      {op.status !== 'PENDING' && (
                        <span className="text-[9px] text-gray-500 font-bold ml-2">
                          Cerrada: {formatDate(op.closedAt)}
                        </span>
                      )}
                    </div>
                    {op.isCreator && (
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                        Eres Creador
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">De (Iniciador)</div>
                          <div className="text-white font-mono flex items-center gap-1.5 group/addr cursor-pointer">
                            {truncateAddress(op.initiator)}
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/addr:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">Para (Destinatario)</div>
                          <div className="text-white font-mono flex items-center gap-1.5 group/addr cursor-pointer">
                            {truncateAddress(op.recipient)}
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/addr:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-center gap-2 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-gray-500">Valor Entregado</span>
                        <span className="text-sm font-bold text-indigo-400">{op.amountA} <span className="text-[10px] opacity-70">TKNA</span></span>
                      </div>
                      <div className="h-px bg-white/5 w-full" />
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-gray-500">Valor Esperado</span>
                        <span className="text-sm font-bold text-emerald-400">{op.amountB} <span className="text-[10px] opacity-70">TKNB</span></span>
                      </div>
                    </div>
                  </div>

                  {op.status === 'PENDING' && (
                    <div className="flex gap-2">
                      {op.isRecipient ? (
                        <button
                          onClick={() => handleComplete(op.id, op)}
                          disabled={completing === op.id || !signer}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
                        >
                          {completing === op.id ? (
                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          Completar Swap
                        </button>
                      ) : op.isCreator ? (
                        <button
                          onClick={() => handleCancel(op.id)}
                          disabled={cancelling === op.id || !signer}
                          className="flex-1 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-500 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          {cancelling === op.id ? (
                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Cancelar Orden
                        </button>
                      ) : (
                        <div className="flex-1 bg-white/5 text-gray-500 text-[10px] font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 italic">
                          Esperando contraparte...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
