'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  PlusCircle,
  ArrowRightLeft,
  History,
  Database,
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  Zap
} from 'lucide-react';
import { ConnectionButton } from '@/components/ConnectionButton';
import { AddToken } from '@/components/AddToken';
import { CreateOperation } from '@/components/CreateOperation';
import { OperationsList } from '@/components/OperationsList';
import { BalanceDebug } from '@/components/BalanceDebug';
import { useWallet } from '@/context/WalletContext';
import { useState } from 'react';

export default function Home() {
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState<'swap' | 'history' | 'admin'>('swap');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#f8fafc] selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 animate-pulse" />
                <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Escrow <span className="text-indigo-400">DApp</span>
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80 font-medium uppercase tracking-widest mt-0.5">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Local Development
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1 glass p-1 rounded-lg border-white/5">
                {[
                  { id: 'swap', label: 'Intercambio', icon: ArrowRightLeft },
                  { id: 'history', label: 'Operaciones', icon: History },
                  { id: 'admin', label: 'Admin', icon: Lock },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
              <ConnectionButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {!account ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                    Intercambios <span className="text-gradient">Seguros</span><br />
                    Sin Intermediarios
                  </h2>
                  <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    La forma más confiable de realizar swaps entre tokens ERC-20 mediante
                    garantía atómica impulsada por Smart Contracts.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 border-white/10 group hover:border-indigo-500/50 transition-all cursor-default">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Atómico</div>
                        <div className="text-sm font-semibold">100% Seguro</div>
                      </div>
                    </div>
                    <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 border-white/10 group hover:border-emerald-500/50 transition-all cursor-default">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Veloz</div>
                        <div className="text-sm font-semibold">Bajo Gas</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Integration Preview Icon Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
                  {[
                    { title: 'Conecta', desc: 'Sincroniza tu MetaMask', icon: Database },
                    { title: 'Deposita', desc: 'Tus fondos en Escrow', icon: ShieldCheck },
                    { title: 'Intercambia', desc: 'Confirmación atómica', icon: ArrowRightLeft },
                    { title: 'Recibe', desc: 'Tokens en tu wallet', icon: ChevronRight },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.5 }}
                      className="glass p-6 rounded-2xl border-white/5 hover:border-white/20 transition-all group"
                    >
                      <item.icon className="w-8 h-8 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Dashboard View */
            <motion.div
              key="dashboard"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Conditional Tab Rendering */}
              <AnimatePresence mode="wait">
                {activeTab === 'swap' && (
                  <motion.div
                    key="swap-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 px-1">
                        <PlusCircle className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-lg">Nueva Operación</h3>
                      </div>
                      <div className="glass p-6 rounded-3xl border-white/10 shadow-xl">
                        <CreateOperation />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 px-1">
                        <Database className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-lg">Balance Debug</h3>
                      </div>
                      <div className="glass p-6 rounded-3xl border-white/10 shadow-xl">
                        <BalanceDebug />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 px-1">
                      <History className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold text-lg">Historial de Operaciones</h3>
                    </div>
                    <div className="glass rounded-3xl border-white/10 shadow-2xl overflow-hidden min-h-[500px]">
                      <OperationsList />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'admin' && (
                  <motion.div
                    key="admin-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="max-w-2xl mx-auto space-y-6"
                  >
                    <div className="flex items-center gap-2 px-1 text-gray-400">
                      <Lock className="w-5 h-5" />
                      <h3 className="font-bold text-lg">Administración</h3>
                    </div>
                    <div className="glass p-8 rounded-3xl border-white/10 shadow-xl">
                      <AddToken />
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-sm">Privilegios de Admin</h4>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Solo el propietario del contrato puede agregar nuevos tokens permitidos al ecosistema.
                        Asegúrate de que la dirección del token sea correcta antes de añadirla.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/5 p-2 rounded-lg text-gray-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight">Escrow <span className="text-gray-500 italic">Core</span></span>
              </div>
              <p className="text-xs text-gray-500 max-w-xs text-center md:text-left">
                Contratos inteligentes auditados y optimizados para el ecosistema EVM local y testnet.
              </p>
            </div>

            <div className="flex gap-8">
              {[
                { label: 'Ecosystem', links: ['Escrow', 'Bridge', 'Governance'] },
                { label: 'Developers', links: ['API Docs', 'GitHub', 'Bug Bounty'] },
                { label: 'Resources', links: ['Legal', 'Security', 'About'] }
              ].map((group, i) => (
                <div key={i} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400/80">{group.label}</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    {group.links.map((link, j) => (
                      <li key={j} className="hover:text-white cursor-pointer transition-colors">{link}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">
              Protected by decentralized architecture
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Escrow Network. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
}
