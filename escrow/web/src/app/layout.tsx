'use client';

import { WalletProvider } from '@/context/WalletContext';
import { WalletSelector } from '@/components/WalletSelector';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <WalletProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">🔐 Escrow DApp</h1>
                  <p className="text-gray-600 mt-1">Intercambio seguro de tokens ERC20</p>
                </div>
                <WalletSelector />
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-gray-400">
                  © 2025 Escrow DApp | Proyecto de prueba educativo
                </p>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
