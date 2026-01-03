'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS } from '@/lib/constants';
import { useEscrow } from '@/hooks/useEscrow';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  formatErrorDisplay,
  isValidAddress,
  isValidAmount,
  logError,
  sleep,
} from '@/lib/errorUtils';
import {
  ArrowDownCircle,
  Send,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Clock,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface AllowedTokens {
  [key: string]: TokenInfo;
}

export function CreateOperation() {
  const { signer, provider, account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allowedTokens, setAllowedTokens] = useState<AllowedTokens>({});
  const [approving, setApproving] = useState(false);
  const { getAllowedTokens } = useEscrow();

  const [formData, setFormData] = useState({
    tokenA: TOKEN_A_ADDRESS,
    amountA: '',
    tokenB: TOKEN_B_ADDRESS,
    amountB: '',
    recipient: '',
  });

  const [balanceA, setBalanceA] = useState<string>('0.0');

  const fetchBalance = async () => {
    if (!provider || !account || !formData.tokenA) return;
    try {
      const tokenContract = new ethers.Contract(formData.tokenA, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(account);
      const decimals = allowedTokens[formData.tokenA]?.decimals || 18;
      setBalanceA(ethers.formatUnits(balance, decimals));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    const loadTokens = async () => {
      if (!provider) return;
      try {
        const addresses = await getAllowedTokens();
        const tokens: AllowedTokens = {};

        await Promise.all(addresses.map(async (addr) => {
          try {
            const contract = new ethers.Contract(addr, ERC20_ABI, provider);
            const [symbol, decimals] = await Promise.all([
              contract.symbol(),
              contract.decimals()
            ]);
            tokens[addr] = { address: addr, symbol: symbol, decimals: Number(decimals) };
          } catch (e) {
            console.error(`Error loading token ${addr}:`, e);
          }
        }));

        setAllowedTokens(tokens);

        // Si el formulario no tiene tokens seleccionados, poner los primeros disponibles
        if (addresses.length >= 2) {
          setFormData(prev => ({
            ...prev,
            tokenA: prev.tokenA || addresses[0],
            tokenB: prev.tokenB || addresses[1]
          }));
        }
      } catch (err) {
        console.error('Error loading tokens:', err);
      }
    };
    loadTokens();
  }, [provider, getAllowedTokens]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [provider, account, formData.tokenA, allowedTokens]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const getTokenSymbol = (address: string): string => {
    return allowedTokens[address]?.symbol || 'Unknown';
  };

  const validateForm = (): { valid: boolean; errorMsg?: string } => {
    if (!formData.tokenA || !formData.tokenB) {
      return { valid: false, errorMsg: 'Debes seleccionar ambos tokens' };
    }

    if (formData.tokenA === formData.tokenB) {
      return { valid: false, errorMsg: 'Los tokens deben ser diferentes' };
    }

    if (!isValidAmount(formData.amountA)) {
      return { valid: false, errorMsg: 'Monto de Token A debe ser un número positivo' };
    }

    if (!isValidAmount(formData.amountB)) {
      return { valid: false, errorMsg: 'Monto de Token B debe ser un número positivo' };
    }

    if (!formData.recipient.trim()) {
      return { valid: false, errorMsg: 'Debes ingresar la dirección del destinatario' };
    }

    if (!isValidAddress(formData.recipient)) {
      return { valid: false, errorMsg: 'La dirección del destinatario no es válida (debe ser 0x...)' };
    }

    if (account && formData.recipient.toLowerCase() === account.toLowerCase()) {
      return { valid: false, errorMsg: 'No puedes ser el destinatario de tu propia operación' };
    }

    return { valid: true };
  };

  const approveToken = async (): Promise<boolean> => {
    try {
      setApproving(true);
      setError(null);

      if (!signer) {
        setError({
          title: '⚠️ Wallet Desconectada',
          message: 'Por favor, conecta tu wallet primero.',
        });
        return false;
      }

      const tokenContract = new ethers.Contract(formData.tokenA, ERC20_ABI, signer);
      const decimals = allowedTokens[formData.tokenA]?.decimals || 18;

      let amount;
      try {
        amount = ethers.parseUnits(formData.amountA, decimals);
      } catch (err) {
        logError('CreateOperation: parseUnits', err);
        setError({
          title: '⚠️ Monto Inválido',
          message: `No se pudo procesar el monto: ${formData.amountA}`,
        });
        return false;
      }

      const currentAllowance = await tokenContract.allowance(account, ESCROW_ADDRESS);

      if (currentAllowance >= amount) {
        setApproving(false);
        setSuccess(`✅ ${getTokenSymbol(formData.tokenA)} ya está aprobado`);
        return true;
      }

      const tx = await tokenContract.approve(ESCROW_ADDRESS, amount);
      setSuccess(`⏳ Aprobando ${getTokenSymbol(formData.tokenA)}... Tx: ${tx.hash.substring(0, 10)}...`);

      await tx.wait();
      setApproving(false);
      setSuccess(`✅ ${getTokenSymbol(formData.tokenA)} aprobado correctamente`);
      return true;
    } catch (err) {
      logError('CreateOperation: approveToken', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      setApproving(false);
      return false;
    }
  };

  const createOperationCall = async (): Promise<boolean> => {
    try {
      if (!signer || !account) {
        setError({
          title: '⚠️ Wallet Desconectada',
          message: 'Por favor, conecta tu wallet primero.',
        });
        return false;
      }

      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tokenAContract = new ethers.Contract(formData.tokenA, ERC20_ABI, signer);

      const decimalsA = allowedTokens[formData.tokenA]?.decimals || 18;
      const decimalsB = allowedTokens[formData.tokenB]?.decimals || 18;

      let amountA, amountB;
      try {
        amountA = ethers.parseUnits(formData.amountA, decimalsA);
        amountB = ethers.parseUnits(formData.amountB, decimalsB);
      } catch (err) {
        logError('CreateOperation: parseUnits para operación', err);
        setError({
          title: '⚠️ Montos Inválidos',
          message: 'No se pudieron procesar los montos ingresados.',
        });
        return false;
      }

      // Validar Saldo antes de proceder
      const balanceA = await tokenAContract.balanceOf(account);
      if (balanceA < amountA) {
        setError({
          title: '💰 Saldo Insuficiente',
          message: `No tienes suficiente ${getTokenSymbol(formData.tokenA)}. Tienes ${ethers.formatUnits(balanceA, decimalsA)} y necesitas ${formData.amountA}.`,
        });
        return false;
      }

      const tx = await escrowContract.createOperation(
        amountA,
        formData.recipient,
        amountB,
        formData.tokenA,
        formData.tokenB
      );

      setSuccess(`⏳ Creando operación... Tx: ${tx.hash.substring(0, 10)}...`);

      const receipt = await tx.wait();
      if (receipt) {
        setSuccess(`✅ ¡Operación creada exitosamente! Tx: ${tx.hash.substring(0, 10)}...`);
        return true;
      }
      return false;
    } catch (err: any) {
      logError('CreateOperation: createOperationCall', err);
      const { title, message } = formatErrorDisplay(err);

      // Intentar extraer mensaje de error de revert si existe
      let detailMessage = message;
      if (err?.info?.error?.message) detailMessage = err.info.error.message;
      else if (err?.reason) detailMessage = err.reason;
      else if (err?.message) detailMessage = err.message;

      setError({ title, message: detailMessage });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
      setError({
        title: 'Formulario Inválido',
        message: validation.errorMsg || 'Por favor, revisa los datos ingresados.',
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const approved = await approveToken();
      if (!approved) {
        setLoading(false);
        return;
      }

      await sleep(1000);

      const created = await createOperationCall();
      if (created) {
        setFormData({
          tokenA: TOKEN_A_ADDRESS,
          amountA: '',
          tokenB: TOKEN_B_ADDRESS,
          amountB: '',
          recipient: '',
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

      setLoading(false);
    } catch (err) {
      logError('CreateOperation: handleSubmit', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-amber-500 font-medium">
          ⚠️ Conecta tu wallet para crear operaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div key="error-msg" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <ErrorAlert
              title={error.title}
              message={error.message}
              type="error"
              onClose={() => setError(null)}
            />
          </motion.div>
        )}

        {success && (
          <motion.div key="success-msg" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <ErrorAlert
              title="✅ Transacción en curso"
              message={success}
              type="success"
              onClose={() => setSuccess(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Token A Panel */}
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl -m-1 group-focus-within:bg-indigo-500/10 transition-all pointer-events-none" />
          <div className="relative bg-black/40 border border-white/5 rounded-2xl p-4 transition-all group-focus-within:border-indigo-500/30">
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Send className="w-3 h-3 text-indigo-400" />
                Tú Envías (Token A)
              </label>
              <div className="flex items-center gap-1.5 glass px-2 py-0.5 rounded-lg border-white/5">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Saldo:</span>
                <span className="text-[10px] text-white font-mono font-bold">{parseFloat(balanceA).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <select
                name="tokenA"
                value={formData.tokenA}
                onChange={handleInputChange}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 min-w-[120px]"
              >
                {Object.entries(allowedTokens).map(([address, token]) => (
                  <option key={address} value={address} className="bg-[#0a0c10]">
                    {token.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="amountA"
                placeholder="0.00"
                value={formData.amountA}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-700 focus:outline-none text-right"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-3 relative z-10">
          <div className="bg-indigo-600 p-2 rounded-full border-4 border-[#0a0c10] shadow-xl group cursor-pointer hover:rotate-180 transition-transform duration-500">
            <ArrowDownCircle className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Token B Panel */}
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl -m-1 group-focus-within:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="relative bg-black/40 border border-white/5 rounded-2xl p-4 transition-all group-focus-within:border-emerald-500/30">
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ArrowDownCircle className="w-3 h-3 text-emerald-400" />
                Tú Recibes (Token B)
              </label>
            </div>
            <div className="flex gap-4">
              <select
                name="tokenB"
                value={formData.tokenB}
                onChange={handleInputChange}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 min-w-[120px]"
              >
                {Object.entries(allowedTokens).map(([address, token]) => (
                  <option key={address} value={address} className="bg-[#0a0c10]">
                    {token.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="amountB"
                placeholder="0.00"
                value={formData.amountB}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-700 focus:outline-none text-right"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Recipient Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
            Persona que recibirá el intercambio
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="recipient"
              placeholder="0x..."
              value={formData.recipient}
              onChange={handleInputChange}
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500/30 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
            <span className="text-gray-500">Estado del Contrato</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Seguro
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Garantía Atómica</span>
            <span className="text-white font-mono">Activada</span>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || approving || !account}
          className={`relative w-full py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden shadow-xl ${loading || approving || !account
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-indigo-500/20'
            }`}
        >
          {loading || approving ? (
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Procesando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Iniciar Intercambio</span>
            </div>
          )}
        </motion.button>
      </form>

      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0" />
        <p className="text-[10px] leading-relaxed text-gray-500">
          La operación es atómica: los fondos solo se intercambian si ambas partes cumplen
          con los requisitos del contrato. Puedes cancelar en cualquier momento antes de que se complete.
        </p>
      </div>
    </div>
  );
}
