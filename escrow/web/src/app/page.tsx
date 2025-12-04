'use client';

import { ConnectionButton } from '@/components/ConnectionButton';
import { AddToken } from '@/components/AddToken';
import { CreateOperation } from '@/components/CreateOperation';
import { OperationsList } from '@/components/OperationsList';
import { BalanceDebug } from '@/components/BalanceDebug';
import { useWallet } from '@/context/WalletContext';

export default function Home() {
  const { account } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🔐</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Escrow DApp</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Intercambios de tokens seguros y atómicos
                </p>
              </div>
            </div>
            <ConnectionButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* If not connected - Welcome Message */}
        {!account ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 shadow-md">
              <div className="text-center">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  ¡Bienvenido a Escrow DApp!
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Conecta tu wallet de MetaMask para comenzar a realizar intercambios de tokens
                  de forma segura y descentralizada.
                </p>

                <div className="bg-white rounded-lg p-6 mb-6 text-left shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ¿Cómo funciona Escrow DApp?
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        1
                      </span>
                      <span className="text-gray-700">
                        <strong>Conecta tu wallet:</strong> Autoriza la aplicación para acceder
                        a tu MetaMask
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        2
                      </span>
                      <span className="text-gray-700">
                        <strong>Crea una operación:</strong> Deposita Token A y especifica
                        cuánto Token B esperas recibir
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        3
                      </span>
                      <span className="text-gray-700">
                        <strong>Otro usuario completa:</strong> Un contraparte proporciona
                        Token B para completar el intercambio
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        4
                      </span>
                      <span className="text-gray-700">
                        <strong>Intercambio atómico:</strong> Los tokens se intercambian de forma
                        segura mediante smart contracts
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-indigo-900">
                    <strong>💡 Consejo:</strong> Haz clic en el botón "Connect Wallet" en la
                    esquina superior derecha para comenzar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* If connected - Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna 1: AddToken + CreateOperation */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <AddToken />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <CreateOperation />
              </div>
            </div>

            {/* Columna 2: OperationsList */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <OperationsList />
              </div>
            </div>

            {/* Columna 3: BalanceDebug */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <BalanceDebug />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Proyecto */}
            <div>
              <h3 className="text-white font-semibold mb-4">Sobre el Proyecto</h3>
              <p className="text-sm leading-relaxed">
                Escrow DApp es un smart contract descentralizado que facilita intercambios
                seguros de tokens ERC-20 mediante el patrón de depósito en garantía (escrow).
              </p>
            </div>

            {/* Características */}
            <div>
              <h3 className="text-white font-semibold mb-4">Características</h3>
              <ul className="text-sm space-y-2">
                <li>✅ Intercambios atómicos seguros</li>
                <li>✅ Sin intermediarios</li>
                <li>✅ Soporte para múltiples tokens</li>
                <li>✅ Cancelación de operaciones</li>
                <li>✅ Gas optimizado</li>
              </ul>
            </div>

            {/* Tecnología */}
            <div>
              <h3 className="text-white font-semibold mb-4">Tecnología</h3>
              <ul className="text-sm space-y-2">
                <li>⚙️ Solidity 0.8.19</li>
                <li>🏗️ Foundry Framework</li>
                <li>⚛️ React 18 + Next.js 14</li>
                <li>🔗 ethers.js v6</li>
                <li>🎨 Tailwind CSS</li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p>
                © {new Date().getFullYear()} Escrow DApp. Proyecto educativo de CodeCrypto
                Academy.
              </p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a
                  href="https://github.com"
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <a
                  href="https://docs.soliditylang.org/"
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Docs
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Contacto
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
