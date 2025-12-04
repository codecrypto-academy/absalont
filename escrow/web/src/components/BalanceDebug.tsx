'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, ERC20_ABI } from '@/lib/constants';
import { ErrorAlert } from '@/components/ErrorAlert';
import { formatErrorDisplay, logError, isValidAddress } from '@/lib/errorUtils';

interface AccountBalance {
  address: string;
  label: string;
  ethBalance: string;
  tokenBalances: {
    tokenA: string;
    tokenB: string;
  };
}

interface EscrowBalance {
  ethBalance: string;
  tokenBalances: {
    tokenA: string;
    tokenB: string;
  };
}

// Cuentas de Anvil precargadas
const ANVIL_ACCOUNTS = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    label: 'Account #0 (Admin)',
  },
  {
    address: '0x70997970C51812e339d9B73b0245Ad39965e02F7',
    label: 'Account #1',
  },
  {
    address: '0x3C44CdDdB6a900c6B318C5d4Eb0Efc0b4e6B41',
    label: 'Account #2',
  },
];

export function BalanceDebug() {
  const { provider, account } = useWallet();
  const [escrowBalance, setEscrowBalance] = useState<EscrowBalance | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Obtener balance de un token ERC20 con fallback a '0'
  const getTokenBalance = async (
    tokenAddress: string,
    accountAddress: string
  ): Promise<string> => {
    try {
      if (!provider || !isValidAddress(tokenAddress) || !isValidAddress(accountAddress)) {
        return '0';
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(accountAddress).catch(() => BigInt(0));
      return ethers.formatEther(balance);
    } catch (err) {
      logError(`BalanceDebug: getTokenBalance for ${tokenAddress}`, err);
      return '0'; // Fallback a 0 si falla
    }
  };

  // Cargar balances
  const loadBalances = async () => {
    if (!provider) return;

    try {
      setLoading(true);
      setError(null);

      // Escrow balances
      let escrowEth = '0';
      let escrowTokenA = '0';
      let escrowTokenB = '0';

      try {
        escrowEth = ethers.formatEther(await provider.getBalance(ESCROW_ADDRESS));
        escrowTokenA = await getTokenBalance(TOKEN_A_ADDRESS, ESCROW_ADDRESS);
        escrowTokenB = await getTokenBalance(TOKEN_B_ADDRESS, ESCROW_ADDRESS);
      } catch (err) {
        logError('BalanceDebug: escrow balances', err);
        // Continuar con ceros
      }

      setEscrowBalance({
        ethBalance: escrowEth,
        tokenBalances: {
          tokenA: escrowTokenA,
          tokenB: escrowTokenB,
        },
      });

      // Account balances (con manejo de errores por cuenta)
      const balances = await Promise.all(
        ANVIL_ACCOUNTS.map(async (acc) => {
          try {
            const ethBalance = ethers.formatEther(await provider.getBalance(acc.address));
            const tokenA = await getTokenBalance(TOKEN_A_ADDRESS, acc.address);
            const tokenB = await getTokenBalance(TOKEN_B_ADDRESS, acc.address);

            return {
              address: acc.address,
              label: acc.label,
              ethBalance,
              tokenBalances: {
                tokenA,
                tokenB,
              },
            };
          } catch (err) {
            logError(`BalanceDebug: account balance for ${acc.address}`, err);
            // Retornar account con balances en 0
            return {
              address: acc.address,
              label: acc.label,
              ethBalance: '0',
              tokenBalances: {
                tokenA: '0',
                tokenB: '0',
              },
            };
          }
        })
      );

      setAccountBalances(balances);
      setLoading(false);
    } catch (err) {
      logError('BalanceDebug: loadBalances general', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      setLoading(false);
    }
  };

  // Cargar balances al montar
  useEffect(() => {
    loadBalances();
  }, [provider]);

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatNumber = (num: string): string => {
    try {
      const parsed = parseFloat(num);
      return parsed.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header - Expandible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="text-xl">🔍</span>
          <div>
            <h2 className="text-xl font-bold text-white">Debug Panel - Ver Balances</h2>
            <p className="text-xs text-gray-400 mt-1">
              Monitorea los balances de ETH y tokens del Escrow y cuentas de Anvil
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              loading
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-green-200 text-green-800'
            }`}
          >
            {loading ? 'Cargando...' : 'Listo'}
          </span>
          <span className="text-2xl text-white transform transition-transform">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Contenido Expandido */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 space-y-6">
          {/* Error Alert */}
          {error && (
            <ErrorAlert
              title={error.title}
              message={error.message}
              type="error"
              onClose={() => setError(null)}
            />
          )}

          {/* Refresh Button */}
          <button
            onClick={loadBalances}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? '⏳ Actualizando...' : '🔄 Refresh - Actualizar Balances'}
          </button>

          {/* Escrow Balance - Destacado en Azul */}
          {escrowBalance && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-900">💼 Contrato Escrow</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-900">
                  DESTACADO
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                    Balance ETH
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(escrowBalance.ethBalance)} ETH
                  </p>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                    Balance Token A
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(escrowBalance.tokenBalances.tokenA)}
                  </p>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                    Balance Token B
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(escrowBalance.tokenBalances.tokenB)}
                  </p>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">
                    Dirección del Contrato
                  </p>
                  <p className="font-mono text-sm text-gray-800 break-words">
                    {ESCROW_ADDRESS}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cuentas de Anvil */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">👥 Cuentas de Anvil</h3>
            </div>

            {accountBalances.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-500">📭 Sin datos de cuentas</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {accountBalances.map((account, idx) => (
                  <div
                    key={account.address}
                    className={`rounded-lg p-4 border-2 ${
                      idx === 0
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-900">
                        {account.label}
                      </h4>
                      {idx === 0 && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-300 text-amber-900">
                          ADMIN
                        </span>
                      )}
                    </div>

                    <p className="font-mono text-xs text-gray-600 mb-3 break-words">
                      {account.address}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-500 font-semibold">ETH</p>
                        <p className="text-sm font-bold text-gray-800">
                          {formatNumber(account.ethBalance)}
                        </p>
                      </div>

                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-500 font-semibold">Token A</p>
                        <p className="text-sm font-bold text-gray-800">
                          {formatNumber(account.tokenBalances.tokenA)}
                        </p>
                      </div>

                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-500 font-semibold">Token B</p>
                        <p className="text-sm font-bold text-gray-800">
                          {formatNumber(account.tokenBalances.tokenB)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>ℹ️ Información:</strong> Este panel muestra los balances de ETH y tokens
              del contrato Escrow y 3 cuentas de prueba de Anvil. Utiliza este panel para
              verificar que las transacciones se han procesado correctamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
