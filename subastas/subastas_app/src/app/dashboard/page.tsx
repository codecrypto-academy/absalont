"use client";

import React, { useEffect, useState } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Plus, Gavel, Clock, ArrowRight, LayoutDashboard, Briefcase, Activity, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { proxy } = useGlobalContext();
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [mySubastas, setMySubastas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (proxy && publicKey) {
      loadMySubastas();
    } else if (mounted && !connected) {
      setLoading(false);
    }
  }, [proxy, publicKey, connected, mounted]);

  const loadMySubastas = async () => {
    try {
      setLoading(true);
      const allSubastas = await proxy!.getAllSubastas();
      // Filter by creator
      const filtered = allSubastas.filter(
        (s: any) => s.account.creador.toBase58() === publicKey?.toBase58()
      );
      setMySubastas(filtered.sort((a: any, b: any) => b.account.id.toNumber() - a.account.id.toNumber()));
    } catch (error) {
      console.error("Error loading your auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (estado: any) => {
    const e = estado.toNumber();
    if (e === 0) return { text: "PREPARADO", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    if (e === 1) return { text: "EN VIVO", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    return { text: "CONCLUIDO", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  };

  const filteredMySubastas = mySubastas.filter((item) => {
    const matchesSearch = item.account.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.account.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || item.account.estado.toNumber() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (mounted && !connected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
          <LayoutDashboard className="text-blue-500" size={40} />
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-black text-outfit tracking-tighter italic uppercase">Acceso Restringido</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Para ver tu panel de control y gestionar tus subastas, primero debes conectar tu wallet de Solana.
          </p>
        </div>
        <div className="glass p-2">
            <WalletMultiButton />
        </div>
        <Link href="/" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2 pt-4">
           Volver al Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 animate-fade-in relative">
      {/* Navbar / Header */}
      <nav className="sticky top-4 z-50 glass mb-16 p-4 flex justify-between items-center pr-6 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 pl-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Gavel className="text-white" size={24} />
          </div>
          <Link href="/">
            <h1 className="text-xl font-bold text-outfit tracking-tighter uppercase italic leading-none">Subastas SOL</h1>
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Premium Marketplace</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
             <Link href="/" className="hover:text-white transition-colors">Explorar</Link>
             <Link href="/dashboard" className="text-blue-400">Mi Panel</Link>
          </div>
          <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
          <Link href="/crear" className="btn-primary flex items-center gap-2 !py-2.5 !px-6 !text-xs !font-black uppercase tracking-widest">
            <Plus size={16} />
            Nueva Subasta
          </Link>
          {mounted && <WalletMultiButton />}
        </div>
      </nav>

      {/* Hero Stats Section */}
      <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-10 bg-blue-600/5 flex flex-col justify-between group">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-blue-500/20">
               <Briefcase className="text-white" size={24} />
            </div>
            <div>
               <div className="text-5xl font-black text-outfit italic tracking-tighter mb-2">{mySubastas.length}</div>
               <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Subastas Creadas</div>
            </div>
         </div>
         
         <div className="glass-card p-10 bg-emerald-600/5 flex flex-col justify-between">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-emerald-500/20">
               <Activity className="text-white" size={24} />
            </div>
            <div>
               <div className="text-5xl font-black text-outfit italic tracking-tighter mb-2">
                  {mySubastas.filter(s => s.account.estado.toNumber() === 1).length}
               </div>
               <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Subastas En Vivo</div>
            </div>
         </div>

         <div className="glass-card p-10 bg-purple-600/5 flex flex-col justify-between relative overflow-hidden">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-purple-500/20">
               <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
               <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Panel Maestro</div>
               <div className="text-xl font-bold text-slate-400 italic">Gestiona tus activos digitales.</div>
            </div>
         </div>
      </section>

      {/* Dashboard Content */}
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-6">
          <div>
            <h3 className="text-3xl font-black text-outfit tracking-tighter italic uppercase underline decoration-blue-600 decoration-4 underline-offset-8">Mis Subastas</h3>
            <p className="text-slate-500 text-sm font-medium mt-3">Control total sobre tus listados en la blockchain.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <input 
                type="text"
                placeholder="BUSCAR EN MIS SUB. . ."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !bg-white/5 !border-white/10 !py-3 !pl-4 !pr-10 !text-[10px] !font-black !uppercase !tracking-widest rounded-xl focus:!border-blue-500/50 transition-all"
              />
              <Plus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 rotate-45" size={14} />
            </div>

            {/* Status Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
               {[
                 { id: null, label: "TODAS" },
                 { id: 0, label: "PEND." },
                 { id: 1, label: "VIVO" },
                 { id: 2, label: "FIN" },
               ].map((tab) => (
                 <button
                   key={tab.id === null ? 'all' : tab.id}
                   onClick={() => setStatusFilter(tab.id)}
                   className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                     statusFilter === tab.id 
                       ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                       : "text-slate-500 hover:text-slate-300"
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <button 
              onClick={loadMySubastas}
              className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 flex items-center gap-2 ml-2"
            >
              Refrescar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-64 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filteredMySubastas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredMySubastas.map((item) => {
              const { account } = item;
              const status = getStatusLabel(account.estado);
              return (
                <div key={account.id.toString()} className="glass-card flex flex-col group border-white/5 hover:border-blue-500/30 transition-all">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border uppercase ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-outfit mb-3 uppercase tracking-tight italic">
                      {account.nombre}
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                       <div className="flex justify-between text-xs font-bold py-3 border-b border-white/5">
                          <span className="text-slate-500 uppercase tracking-widest">Base</span>
                          <span className="text-white italic">{account.importeMinimo.toNumber() / 1e9} SOL</span>
                       </div>
                       <div className="flex justify-between text-xs font-bold py-3 border-b border-white/5">
                          <span className="text-slate-500 uppercase tracking-widest">Puja Actual</span>
                          <span className="text-blue-400 italic">{(account.importeGanador.toNumber() || account.importeMinimo.toNumber()) / 1e9} SOL</span>
                       </div>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/subasta/${account.id.toString()}`}
                    className="bg-white/[0.03] hover:bg-white/[0.08] transition-all py-4 px-8 flex justify-center items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white border-t border-white/5 gap-2"
                  >
                    Detalles y Gestión
                    <ExternalLink size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center glass border-dashed border-white/10">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
               <Briefcase size={30} />
            </div>
            <h2 className="text-2xl font-black text-outfit tracking-tighter italic uppercase text-slate-600">Sin Subastas Propias</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto text-sm">Aún no has creado ninguna subasta. ¡Comienza ahora mismo!</p>
            <Link href="/crear" className="btn-primary inline-flex mx-auto !py-3 !px-8">
              <Plus size={18} />
              Crear Mi Primera Subasta
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-40 py-10 border-t border-white/5 flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-600">
         <div>© 2026 Solana Auctions Master Dashboard</div>
      </footer>
    </div>
  );
}
