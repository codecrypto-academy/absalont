'use client';

import ConnectWallet from '@/components/ConnectWallet';
import FundingPanel from '@/components/FundingPanel';
import CreateProposal from '@/components/CreateProposal';
import ProposalList from '@/components/ProposalList';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-2">
              DAO <span className="text-primary-600">Voting</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Sistema de gobernanza descentralizada con votación gasless (EIP-2771).
            </p>
          </div>
          <div className="flex-shrink-0">
            <ConnectWallet />
          </div>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column: Funding (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <FundingPanel />
          </div>

          {/* Right Column: Create Proposal (8 cols) */}
          <div className="lg:col-span-8">
            <CreateProposal />
          </div>
        </div>

        {/* Proposals Section */}
        <div className="mb-12">
          <ProposalList />
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-8 mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Sistema DAO seguro y eficiente • Powered by Ethereum & Next.js
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Los usuarios votan sin pagar gas - el relayer cubre los costos
          </p>
        </footer>
      </div>
    </main>
  );
}
