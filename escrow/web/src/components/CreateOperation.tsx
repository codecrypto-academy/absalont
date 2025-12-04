'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS } from '@/lib/constants';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  formatErrorDisplay,
  isValidAddress,
  isValidAmount,
  logError,
  sleep,
} from '@/lib/errorUtils';

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

  const [formData, setFormData] = useState({
    tokenA: TOKEN_A_ADDRESS,
    amountA: '',
    tokenB: TOKEN_B_ADDRESS,
    amountB: '',
    recipient: '',
  });

  useEffect(() => {
    const loadAllowedTokens = async () => {
      if (!provider) return;

      try {
        const defaultTokens: AllowedTokens = {
          [TOKEN_A_ADDRESS]: {
            address: TOKEN_A_ADDRESS,
            symbol: 'TokenA',
            decimals: 18,
          },
          [TOKEN_B_ADDRESS]: {
            address: TOKEN_B_ADDRESS,
            symbol: 'TokenB',
            decimals: 18,
          },
        };

        const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, provider);
        const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, provider);

        const [symbolA, decimalsA, symbolB, decimalsB] = await Promise.all([
          tokenAContract.symbol().catch(() => 'TokenA'),
          tokenAContract.decimals().catch(() => 18),
          tokenBContract.symbol().catch(() => 'TokenB'),
          tokenBContract.decimals().catch(() => 18),
        ]);

        defaultTokens[TOKEN_A_ADDRESS].symbol = symbolA;
        defaultTokens[TOKEN_A_ADDRESS].decimals = decimalsA;
        defaultTokens[TOKEN_B_ADDRESS].symbol = symbolB;
        defaultTokens[TOKEN_B_ADDRESS].decimals = decimalsB;

        setAllowedTokens(defaultTokens);
      } catch (err) {
        logError('CreateOperation: loadAllowedTokens', err);
        setAllowedTokens({
          [TOKEN_A_ADDRESS]: {
            address: TOKEN_A_ADDRESS,
            symbol: 'TokenA',
            decimals: 18,
          },
          [TOKEN_B_ADDRESS]: {
            address: TOKEN_B_ADDRESS,
            symbol: 'TokenB',
            decimals: 18,
          },
        });
      }
    };

    loadAllowedTokens();
  }, [provider]);

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
      if (!signer) {
        setError({
          title: '⚠️ Wallet Desconectada',
          message: 'Por favor, conecta tu wallet primero.',
        });
        return false;
      }

      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

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
    } catch (err) {
      logError('CreateOperation: createOperationCall', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
      setError({
        title: '⚠️ Formulario Inválido',
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Por favor, conecta tu wallet para crear operaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Crear Operación</h2>

      {error && (
        <ErrorAlert
          title={error.title}
          message={error.message}
          type="error"
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <ErrorAlert
          title="✅ Éxito"
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔄 Token A (Enviarás)
          </label>
          <select
            name="tokenA"
            value={formData.tokenA}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg mb-2 text-sm"
          >
            {Object.entries(allowedTokens).map(([address, token]) => (
              <option key={address} value={address}>
                {token.symbol} ({address.substring(0, 6)}...{address.substring(38)})
              </option>
            ))}
          </select>
          <input
            type="number"
            name="amountA"
            placeholder="Cantidad de Token A"
            value={formData.amountA}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            disabled={loading}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔄 Token B (Recibirás)
          </label>
          <select
            name="tokenB"
            value={formData.tokenB}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg mb-2 text-sm"
          >
            {Object.entries(allowedTokens).map(([address, token]) => (
              <option key={address} value={address}>
                {token.symbol} ({address.substring(0, 6)}...{address.substring(38)})
              </option>
            ))}
          </select>
          <input
            type="number"
            name="amountB"
            placeholder="Cantidad de Token B"
            value={formData.amountB}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            👤 Dirección del Destinatario
          </label>
          <input
            type="text"
            name="recipient"
            placeholder="0x..."
            value={formData.recipient}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || approving || !account}
          className={`w-full py-2 rounded-lg font-semibold text-white transition-colors ${
            loading || approving || !account
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading || approving
            ? '⏳ Procesando...'
            : '✅ Crear Operación'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        <p>
          ℹ️ Se necesitan dos pasos: primero aprobar el Token A, luego crear la operación. Esto
          garantiza transacciones seguras y atómicas.
        </p>
      </div>
    </div>
  );
}
