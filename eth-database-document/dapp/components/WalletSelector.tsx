'use client';

import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { EthersUtils } from '../utils/ethers';

export default function WalletSelector() {
  const {
    isConnected,
    isLoading,
    error,
    currentAddress,
    currentBalance,
    selectedAccountIndex,
    accounts,
    selectAccount,
    clearError,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = async (index: number) => {
    await selectAccount(index);
    setIsOpen(false);
  };

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 w-full
          ${isConnected 
            ? 'bg-green-50 border-green-200 hover:border-green-300' 
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {/* Indicador de estado */}
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        
        {/* Info de la cuenta */}
        <div className="flex-1 text-left">
          {isLoading ? (
            <p className="text-gray-500">Conectando...</p>
          ) : isConnected && currentAddress ? (
            <>
              <p className="font-mono text-sm font-medium text-gray-700">
                {EthersUtils.formatAddress(currentAddress)}
              </p>
              <p className="text-xs text-gray-500">
                {parseFloat(currentBalance).toFixed(4)} ETH
              </p>
            </>
          ) : (
            <p className="text-gray-500">Seleccionar Wallet</p>
          )}
        </div>
        
        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Dropdown de cuentas */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Lista de cuentas */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Wallets de Anvil (Desarrollo)
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {accounts.map((account, index) => (
              <div
                key={account.address}
                className={`
                  w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors
                  ${selectedAccountIndex === index ? 'bg-blue-50' : ''}
                `}
              >
                {/* Seleccionar cuenta */}
                <button
                  onClick={() => handleSelect(index)}
                  className="flex-1 flex items-center space-x-3 text-left"
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${selectedAccountIndex === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {index}
                  </div>

                  {/* Dirección */}
                  <div className="flex flex-col">
                    <p className="font-mono text-sm text-gray-700">
                      {EthersUtils.formatAddress(account.address)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Account {index}
                    </p>
                  </div>
                </button>

                {/* Botón copiar */}
                <button
                  onClick={() => copyAddress(account.address)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copiar dirección"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12M8 12h12M8 17h6M4 7h.01M4 12h.01M4 17h.01"
                    />
                  </svg>
                </button>
              </div>
            ))}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                💡 Cada cuenta tiene 10,000 ETH de prueba
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
