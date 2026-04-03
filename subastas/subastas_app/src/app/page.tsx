"use client";

import React, { useEffect, useState } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Plus, Gavel, Clock, Trophy, User, ArrowRight, ShieldCheck, Sparkles, Filter } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { proxy } = useGlobalContext();
  const [subastas, setSubastas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null); // null = All

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (proxy) {
      loadSubastas();
    }
  }, [proxy]);

  const loadSubastas = async () => {
    try {
      setLoading(true);
      const allSubastas = await proxy!.getAllSubastas();
      setSubastas(allSubastas.sort((a: any, b: any) => b.account.id.toNumber() - a.account.id.toNumber()));
    } catch (error) {
      console.error("Error loading auctions:", error);
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

  const filteredSubastas = subastas.filter((item) => {
    const matchesSearch = item.account.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.account.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || item.account.estado.toNumber() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 animate-fade-in relative">
      {/* Navbar / Header */}
      <nav className="sticky top-4 z-50 glass mb-16 p-4 flex justify-between items-center pr-6 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 pl-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Gavel className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-outfit tracking-tighter uppercase italic leading-none">Subastas SOL</h1>
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Premium Marketplace</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
             <Link href="/" className="text-blue-400">Explorar</Link>
             <Link href="/dashboard" className="hover:text-white transition-colors">Mi Panel</Link>
          </div>
          <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
          <Link href="/crear" className="btn-primary flex items-center gap-2 !py-2.5 !px-6 !text-xs !font-black uppercase tracking-widest">
            <Plus size={16} />
            Nueva Subasta
          </Link>
          {mounted && <WalletMultiButton />}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mb-20 space-y-4">
        <div className="flex items-center gap-2 text-blue-500 text-sm font-black uppercase tracking-[0.3em]">
          <Sparkles size={16} />
          La Próxima Generación
        </div>
        <h2 className="text-6xl md:text-8xl font-black text-outfit tracking-tighter leading-tight max-w-4xl">
           Subasta <span className="gradient-text italic">Activos</span> Digitales en Tiempo Real.
        </h2>
        <div className="flex flex-wrap gap-8 pt-8">
           <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="text-emerald-500" size={20} />
              <span className="text-sm font-medium uppercase tracking-widest italic">Solana Secured</span>
           </div>
           <div className="flex items-center gap-2 text-slate-400">
              <User className="text-blue-500" size={20} />
              <span className="text-sm font-medium uppercase tracking-widest italic">Cero Intermediarios</span>
           </div>
        </div>
      </section>

      {/* Stats / Orbits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
         {[
           { label: "Subastas Totales", value: subastas.length, icon: Gavel, color: "text-blue-500" },
           { label: "En Vivo", value: subastas.filter(s => s.account.estado.toNumber() === 1).length, icon: Sparkles, color: "text-emerald-500" },
           { label: "Transacciones", value: "SOL", icon: ShieldCheck, color: "text-purple-500" },
           { label: "Usuarios", value: "Web3", icon: User, color: "text-amber-500" },
         ].map((stat, i) => (
           <div key={i} className="glass-card p-6 flex flex-col items-center justify-center border-none bg-blue-500/5">
              <stat.icon className={`${stat.color} mb-3`} size={20} />
              <div className="text-2xl font-black text-outfit italic tracking-tighter">{stat.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</div>
           </div>
         ))}
      </div>

      {/* List Header & Filters */}
      <div className="space-y-8 mb-10 border-b border-white/5 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h3 className="text-3xl font-black text-outfit tracking-tighter italic uppercase">Explorar Subastas</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Encuentra los activos más raros de la red Solana.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <input 
                type="text"
                placeholder="BUSCAR NOMBRE. . ."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !bg-white/5 !border-white/10 !py-3 !pl-4 !pr-10 !text-[10px] !font-black !uppercase !tracking-widest rounded-xl focus:!border-blue-500/50 transition-all"
              />
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
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
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-80 animate-pulse bg-white/5"></div>
          ))
        ) : filteredSubastas.length > 0 ? (
          filteredSubastas.map((item) => {
            const { account } = item;
            const status = getStatusLabel(account.estado);
            return (
              <div key={account.id.toString()} className="glass-card flex flex-col group relative overflow-hidden">
                {/* Image Placeholder / Visual */}
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Gavel size={120} />
                </div>
                
                <div className="p-8 flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border uppercase ${status.color}`}>
                      {status.text}
                    </span>
                    <span className="text-slate-600 text-xs font-mono font-bold">#ORD-{account.id.toString().slice(-4)}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-outfit mb-3 group-hover:text-blue-400 transition-colors uppercase tracking-tight italic">
                    {account.nombre}
                  </h3>
                  
                  <p className="text-slate-500 text-sm line-clamp-2 mb-8 leading-relaxed font-medium">
                    {account.descripcion}
                  </p>
                  
                  <div className="flex justify-between items-end border-t border-white/5 pt-6">
                    <div>
                      <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest mb-1">Precio Actual</p>
                      <div className="text-2xl font-black text-white italic tracking-tighter">
                        {(account.importeGanador.toNumber() || account.importeMinimo.toNumber()) / 1e9} 
                        <span className="text-xs font-bold text-slate-600 ml-1.5 not-italic tracking-normal">SOL</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest mb-1 flex items-center justify-end gap-1">
                        <Clock size={10} /> Expira
                      </p>
                      <p className="text-xs font-bold text-slate-300">
                        {new Date(account.fechaFin.toNumber() * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href={`/subasta/${account.id.toString()}`}
                  className="bg-white/[0.03] group-hover:bg-blue-600 transition-all py-5 px-8 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white border-t border-white/5"
                >
                  Entrar a Subasta
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center glass border-dashed border-white/10">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-500/20">
               <Gavel size={40} />
            </div>
            <h2 className="text-4xl font-black text-outfit tracking-tighter italic uppercase text-slate-600">Galería Vacía</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">No hay subastas activas en este momento. Sé el pionero y lanza tu colección.</p>
            <Link href="/crear" className="btn-primary inline-flex mx-auto">
              <Plus size={20} />
              Lanzar Nueva Subasta
            </Link>
          </div>
        )}
      </div>

      {/* Footer / Orbit */}
      <footer className="mt-40 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
         <div>© 2026 Solana Auctions Ecosystem</div>
         <div className="flex gap-10">
            <span className="hover:text-blue-500 cursor-pointer">Protocol</span>
            <span className="hover:text-blue-500 cursor-pointer">Seguridad</span>
            <span className="hover:text-blue-500 cursor-pointer">Docs</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Mainnet Stable
         </div>
      </footer>
    </div>
  );
}
