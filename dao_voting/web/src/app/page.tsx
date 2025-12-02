'use client';

import ConnectWallet from '@/components/ConnectWallet';
import FundingPanel from '@/components/FundingPanel';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DAO Voting</h1>
              <p className="text-gray-600 mt-1">Sistema de votación gasless con meta-transacciones</p>
            </div>
            <ConnectWallet />
          </div>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <FundingPanel />
          </div>
          <div className="lg:col-span-2">
            <CreateProposal />
          </div>
        </div>

        {/* Proposals */}
        <ProposalList />

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>Sistema DAO con votación gasless usando EIP-2771</p>
          <p className="mt-1">Los usuarios votan sin pagar gas - el relayer cubre los costos</p>
        </footer>
      </div>
    </main>
  );
}
