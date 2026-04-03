"use client";

import React, { useEffect, useState } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useParams, useRouter } from "next/navigation";
import { Gavel, Clock, Trophy, User, ArrowLeft, Loader2, Send, CheckCircle, ShieldCheck, Sparkles, TrendingUp, History, Calendar, DollarSign } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SubastasProxy } from "@/services/subastasProxy";

export default function SubastaDetalle() {
  const params = useParams();
  const idStr = params.id as string;
  const id = parseInt(idStr);
  
  const { proxy, connection, refreshSession } = useGlobalContext();
  const { publicKey } = useWallet();
  const router = useRouter();
  
  const [subasta, setSubasta] = useState<any>(null);
  const [pujas, setPujas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [importePuja, setImportePuja] = useState("");

  useEffect(() => {
    if (proxy && id) {
      loadData();
    }
  }, [proxy, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await (proxy as SubastasProxy).getSubastaById(id);
      setSubasta(data);
      
      const allPujas = await (proxy as SubastasProxy).getPujasBySubasta(id);
      setPujas(allPujas.sort((a, b) => b.account.ts.toNumber() - a.account.ts.toNumber()));
    } catch (error) {
      console.error("Error loading auction data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = async () => {
    try {
      setActionLoading(true);
      await proxy!.iniciarSubasta(id);
      await loadData();
    } catch (error) {
      console.error("Error starting auction:", error);
      alert("Error al iniciar subasta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizar = async () => {
    try {
      setActionLoading(true);
      await proxy!.finalizarSubasta(id);
      await loadData();
    } catch (error) {
      console.error("Error ending auction:", error);
      alert("Error al finalizar subasta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePujar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Por favor, conecta tu wallet antes de pujar.");
      return;
    }

    if (!importePuja || isNaN(parseFloat(importePuja)) || parseFloat(importePuja) <= 0) {
      alert("Por favor, ingresa un valor de puja válido.");
      return;
    }
    try {
      setActionLoading(true);
      
      // Sync Check - Ensure proxy is updated to current publicKey
      if (!publicKey || !proxy || proxy.program.provider.publicKey?.toBase58() !== publicKey.toBase58()) {
        console.warn("Sync mismatch detected. Waiting for context update...");
        alert("Sincronizando wallet con el contrato... Por favor, pulsa 'Pujar' de nuevo en un segundo.");
        setActionLoading(false);
        return;
      }

      const currentPrice = (subasta.importeGanador.toNumber() || subasta.importeMinimo.toNumber()) / 1e9;
      const bidPrice = parseFloat(importePuja);

      if (bidPrice <= currentPrice) {
        alert(`Tu puja de ${bidPrice} SOL debe ser mayor al precio actual de ${currentPrice} SOL.`);
        setActionLoading(false);
        return;
      }

      // Balance check with Rent + Fee buffer (0.01 SOL approx)
      const balance = await connection.getBalance(publicKey);
      const amountLamports = Math.round(bidPrice * 1e9);
      const minRequired = amountLamports + (0.005 * 1e9); 
      
      if (balance < minRequired) {
        const solNeeded = (minRequired / 1e9).toFixed(3);
        const currentSol = (balance / 1e9).toFixed(3);
        alert(`Tu saldo (${currentSol} SOL) es insuficiente. Necesitas al menos ${solNeeded} SOL para cubrir la puja y la creación de cuenta en blockchain.`);
        setActionLoading(false);
        return;
      }

      const previousBidder = subasta.ganador.toBase58() === PublicKey.default.toBase58() 
        ? null 
        : subasta.ganador;

      const tx = await proxy!.crearPuja(id, "Oferta Usuario", amountLamports, previousBidder);
      console.log("Puja exitosa:", tx);
      setImportePuja("");
      await loadData();
      alert("¡Puja realizada con éxito!");
    } catch (error: any) {
      console.error("Error DETALLADO de Solana:", error);
      
      let msg = "Error inesperado.";
      if (error.message) {
        msg = error.message;
      } else if (typeof error === 'object') {
        msg = JSON.stringify(error).slice(0, 150);
      }

      if (error.logs) {
        console.log("Logs del programa:", error.logs);
        const logsStr = JSON.stringify(error.logs);
        if (logsStr.includes("custom program error: 0x1772")) msg = "La puja es muy baja.";
        if (logsStr.includes("custom program error: 0x1770")) msg = "Subasta no activa.";
      }
      
      alert(`Error al procesar la puja: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative">
           <Loader2 className="animate-spin text-blue-500" size={64} />
           <div className="absolute inset-0 bg-blue-500/20 blur-[20px] -z-10" />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] italic text-xs animate-pulse">Sincronizando Blockchain...</p>
      </div>
    );
  }

  if (!subasta) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <h1 className="text-6xl font-black text-outfit italic tracking-tighter uppercase text-slate-700">NotFound Exception</h1>
        <p className="text-slate-500 font-medium mb-10 mt-4">La subasta solicitada no existe o ha sido purgada.</p>
        <Link href="/" className="btn-primary inline-flex mx-auto">
          <ArrowLeft size={20} />
          Volver a la Galería
        </Link>
      </div>
    );
  }

  const isOwner = publicKey?.toBase58() === subasta.creador.toBase58();
  const estadoNum = subasta.estado.toNumber();
  const now = Math.floor(Date.now() / 1000);
  const hasEnded = now > subasta.fechaFin.toNumber();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 animate-fade-in relative">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white mb-12 group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Volver
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Metadata & History */}
        <div className="lg:col-span-8 space-y-12">
          <div className="glass p-12 relative overflow-hidden">
             {/* Large background text */}
             <div className="absolute top-0 right-0 p-12 text-white/[0.02] text-9xl font-black italic select-none pointer-events-none">
                {idStr}
             </div>

             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-8">
                  <span className={`px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border ${
                    estadoNum === 0 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    estadoNum === 1 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}>
                    {estadoNum === 0 ? "PREPARACIÓN" : estadoNum === 1 ? "ACTIVO" : "CONCLUIDO"}
                  </span>
                  <div className="h-5 w-[1px] bg-white/10 mx-2" />
                  <div className="flex items-center gap-2 text-slate-500">
                     <ShieldCheck size={14} />
                     <span className="text-[10px] font-black tracking-widest uppercase">Protocolo Verificado</span>
                  </div>
               </div>

               <h1 className="text-6xl md:text-7xl font-black text-outfit tracking-tighter uppercase italic leading-none gradient-text mb-8">
                  {subasta.nombre}
               </h1>

               <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-3xl mb-12">
                  {subasta.descripcion}
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-12">
                  <div className="flex items-center gap-5 p-6 bg-white/[0.02] rounded-3xl group hover:bg-white/[0.04] transition-colors">
                     <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <Calendar size={24} />
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1 italic">Fecha Apertura</div>
                        <div className="text-lg font-black text-outfit tracking-tight">{new Date(subasta.fechaInicio.toNumber() * 1000).toLocaleString()}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-5 p-6 bg-white/[0.02] rounded-3xl group hover:bg-white/[0.04] transition-colors">
                     <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                        <Clock size={24} />
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1 italic">Fecha Cierre</div>
                        <div className="text-lg font-black text-outfit tracking-tight">{new Date(subasta.fechaFin.toNumber() * 1000).toLocaleString()}</div>
                     </div>
                  </div>
               </div>

               {/* Technical Protocol Data Grid - Integrated after the divider */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-12 mt-12">
                  <div className="space-y-1">
                     <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50 italic">PDA Contrato</div>
                     <div className="text-[10px] font-bold text-blue-400 font-mono truncate max-w-full" title={proxy?.getSubastaPDA(id).toBase58()}>
                        {proxy?.getSubastaPDA(id).toBase58()}
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50 italic">Authority</div>
                     <div className="text-[10px] font-bold text-slate-400 font-mono truncate max-w-full">
                        {subasta.creador.toBase58()}
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50 italic">Ganador</div>
                     <div className="text-[10px] font-bold text-emerald-400 font-mono truncate max-w-full">
                        {subasta.ganador.toBase58() === PublicKey.default.toBase58() ? "SIN OFERTAS" : subasta.ganador.toBase58()}
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50 italic">Min. Base</div>
                     <div className="text-xs font-black text-white italic tracking-tighter">
                        {(subasta.importeMinimo.toNumber() / 1e9).toFixed(2)} <span className="text-[9px] text-slate-700">SOL</span>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50 italic">Escrow</div>
                     <div className="text-xs font-black text-emerald-500 italic tracking-tighter">
                        {(subasta.importeGanador.toNumber() / 1e9).toFixed(2)} <span className="text-[9px] text-slate-700 font-bold font-mono">SOL</span>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 opacity-50 italic">Code</div>
                     <div className="text-[9px] font-black text-slate-400 italic">
                        Registry_St: {subasta.estado.toString()}
                     </div>
                  </div>
               </div>
             </div>
          </div>

          {/* History */}
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-outfit uppercase italic tracking-tighter flex items-center gap-3">
                   <History className="text-blue-500" size={24} />
                   Historial de Actividad
                </h3>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{pujas.length} Ofertas Registradas</div>
             </div>

             <div className="glass p-8 space-y-4 border-none bg-white/[0.01]">
                {pujas.length > 0 ? (
                  pujas.map((puja, idx) => (
                    <div key={idx} className="flex justify-between items-center p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-blue-500/20 transition-all group">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center font-black text-xs text-blue-400 border border-white/5">
                             {puja.account.pk.toBase58().slice(0, 2)}
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                {puja.account.pk.toBase58().slice(0, 8)}...{puja.account.pk.toBase58().slice(-8)}
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                {new Date(puja.account.ts.toNumber() * 1000).toLocaleTimeString()}
                             </div>
                             <div className="text-sm font-bold text-slate-300 mt-1 uppercase italic">{puja.account.nombre || "Oferta Directa"}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-2xl font-black text-outfit italic tracking-tighter group-hover:text-blue-400 transition-colors">
                             {(puja.account.importePuja.toNumber() / 1e9).toFixed(2)}
                             <span className="text-xs font-bold text-slate-600 not-italic ml-2">SOL</span>
                          </div>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                     <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] italic">Sin Actividad Comercial</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right: Bidding / Actions */}
        <div className="lg:col-span-4 space-y-8 sticky top-10">
           <div className="glass p-10 border border-blue-500/10 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]" />
              
              <div className="text-center mb-10">
                 <div className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-4 flex items-center justify-center gap-2">
                    <TrendingUp size={12} className="text-emerald-500" />
                    Valoración Actual
                 </div>
                 <div className="text-7xl font-black text-outfit italic tracking-tighter leading-none mb-4">
                    {(subasta.importeGanador.toNumber() / 1e9 || subasta.importeMinimo.toNumber() / 1e9).toFixed(2)}
                 </div>
                 <div className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-8">Solana Native Token (SOL)</div>
                 
                 <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 inline-flex items-center gap-3 max-w-full overflow-hidden">
                    <User size={14} className="text-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-400 truncate">
                       {subasta.ganador.toBase58() === PublicKey.default.toBase58() 
                         ? "OFERTA MÍNIMA REQUERIDA" 
                         : `LÍDER: ${subasta.ganador.toBase58().slice(0, 12)}...`}
                    </span>
                 </div>
              </div>

              {estadoNum === 1 && !hasEnded && (
                <form onSubmit={handlePujar} className="space-y-6 pt-10 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1 italic">Ingresar Puja</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                      <input
                        type="number"
                        value={importePuja}
                        onChange={(e) => setImportePuja(e.target.value)}
                        className="w-full !pl-14 !py-6 !text-3xl !font-black !italic !tracking-tighter !text-outfit"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full btn-primary !py-6 justify-center !text-sm uppercase tracking-[0.3em] font-black italic shadow-blue-500/20"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Confirmar Oferta</>}
                  </button>
                </form>
              )}

              {isOwner && (
                 <div className="space-y-4 pt-10 border-t border-white/5 mt-10">
                    <div className="text-[10px] font-black uppercase text-slate-600 text-center tracking-widest mb-4 italic">Panel de Ejecución</div>
                    {estadoNum === 0 && (
                      <button
                        onClick={handleIniciar}
                        disabled={actionLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase py-5 px-4 rounded-3xl flex justify-center items-center gap-3 transition-all italic text-xs tracking-widest"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Iniciar Subasta</>}
                      </button>
                    )}
                    {estadoNum === 1 && hasEnded && (
                      <button
                        onClick={handleFinalizar}
                        disabled={actionLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-5 px-4 rounded-3xl flex justify-center items-center gap-3 transition-all italic text-xs tracking-widest"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" /> : <><Trophy size={18} /> Reclamar Fondos</>}
                      </button>
                    )}
                    {estadoNum === 2 && (
                       <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl text-center">
                          <CheckCircle className="text-blue-500 mx-auto mb-2" size={24} />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Contrato Liquidado <br/> Subasta Concluida</p>
                       </div>
                    )}
                 </div>
              )}

              {estadoNum === 0 && !isOwner && (
                 <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl text-center">
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest leading-relaxed italic">
                       Subasta en estado PROCESO <br/> esperando activación por el creador
                    </p>
                 </div>
              )}

              {hasEnded && estadoNum === 1 && !isOwner && (
                 <div className="mt-10 p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl text-center">
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest leading-relaxed italic">
                       Subasta en pausa <br/> esperando liquidación por el creador
                    </p>
                 </div>
              )}
           </div>

           {!publicKey && estadoNum === 1 && !hasEnded && (
              <div className="glass p-8 border-none bg-amber-500/5 flex flex-col items-center gap-4">
                 <div className="text-amber-500">
                    <ShieldCheck size={32} />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 text-center leading-relaxed uppercase tracking-[0.2em]">
                    Conecta tu wallet para <br/> participar en esta subasta
                 </p>
                 <div className="glass p-1">
                    <WalletMultiButton />
                 </div>
              </div>
           )}

           <div className="glass p-8 border-none bg-blue-600/5 flex items-start gap-4">
              <ShieldCheck className="text-blue-500 shrink-0" size={20} />
              <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
                 Todas las pujas están bloqueadas en un smart contract inmutable y se reembolsarán instantáneamente si no eres el ganador.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
