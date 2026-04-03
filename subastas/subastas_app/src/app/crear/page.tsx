"use client";

import React, { useState } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useRouter } from "next/navigation";
import { Gavel, ArrowLeft, Loader2, Sparkles, AlertCircle, Info, Calendar, DollarSign, TextQuote, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function CrearSubasta() {
  const { proxy, connection, refreshSession } = useGlobalContext();
  const { publicKey } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    importeMinimo: "",
    fechaInicioDate: "",
    fechaInicioTime: "00:00",
    fechaFinDate: "",
    fechaFinTime: "00:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Por favor, conecta tu wallet primero.");
      return;
    }

    try {
      setLoading(true);

      // Atomic Sync Check
      if (proxy?.program.provider.publicKey?.toBase58() !== publicKey.toBase58()) {
        console.warn("Wallet sync mismatch. Refreshing session...");
        refreshSession();
        alert("Sincronizando wallet con el contrato... Por favor, intenta de nuevo en un segundo.");
        setLoading(false);
        return;
      }

      // Check balance
      const balance = await connection.getBalance(publicKey);
      if (balance === 0) {
        alert("Tu wallet no tiene SOL para pagar la transacción. Ejecuta: solana airdrop 2 " + publicKey.toBase58());
        setLoading(false);
        return;
      }

      if (!formData.nombre || !formData.descripcion || !formData.importeMinimo || !formData.fechaInicioDate || !formData.fechaInicioTime || !formData.fechaFinDate || !formData.fechaFinTime) {
        alert("Por favor, completa todos los campos del formulario.");
        setLoading(false);
        return;
      }

      const id = Date.now(); 
      const importeMinimoLamports = parseFloat(formData.importeMinimo) * 1e9;
      
      const startTs = Math.floor(new Date(`${formData.fechaInicioDate}T${formData.fechaInicioTime}`).getTime() / 1000);
      const endTs = Math.floor(new Date(`${formData.fechaFinDate}T${formData.fechaFinTime}`).getTime() / 1000);

      if (isNaN(startTs) || isNaN(endTs)) {
        alert("Por favor, ingresa fechas y horas válidas.");
        setLoading(false);
        return;
      }

      await proxy!.crearSubasta(
        id,
        formData.nombre,
        formData.descripcion,
        importeMinimoLamports,
        startTs,
        endTs
      );

      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating auction:", error);
      let msg = "Hubo un error al crear la subasta.";
      if (error.message) msg = error.message;
      if (error.logs) console.log("Logs del programa:", error.logs);
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 animate-fade-in relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] -z-10 pointer-events-none" />

      <div className="mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver a la Galería
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-outfit tracking-tighter uppercase italic">Lanzar Activo</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Blockchain Deployment Protocol</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Info Sidebar */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass p-6 border-none bg-blue-500/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Info size={14} className="text-blue-500" />
                 Guía de Lanzamiento
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                 Asegúrate de definir un precio mínimo atractivo para incentivar las primeras pujas. Una vez creada, deberás **iniciar** la subasta para que sea pública.
              </p>
           </div>
           
           <div className="glass p-6 border-none bg-emerald-500/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ShieldCheck size={14} className="text-emerald-500" />
                 Seguridad Assets
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                 Tus fondos y activos están protegidos por el protocolo Anchor. El despliegue es inmutable una vez confirmada la transacción.
              </p>
           </div>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8 glass p-10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
             <Gavel size={180} />
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                 Nombre del Activo
              </label>
              <div className="relative">
                <Gavel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full pl-12"
                  placeholder="Ej: Rare Artifact #001"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                 Descripción Detallada
              </label>
              <div className="relative">
                <TextQuote className="absolute left-4 top-4 text-slate-500 pointer-events-none" size={16} />
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-12"
                  placeholder="Describe la rareza y utilidad de este activo..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                   Precio Base (SOL)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                  <input
                    type="number"
                    step="0.01"
                    name="importeMinimo"
                    value={formData.importeMinimo}
                    onChange={handleChange}
                    className="w-full pl-12"
                    placeholder="0.5"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                   Apertura (Fecha y Hora)
                </label>
                <div className="space-y-4">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    <input
                      type="date"
                      name="fechaInicioDate"
                      value={formData.fechaInicioDate}
                      onChange={handleChange}
                      className="w-full pl-12"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    <input
                      type="time"
                      name="fechaInicioTime"
                      value={formData.fechaInicioTime}
                      onChange={handleChange}
                      className="w-full pl-12"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                   Cierre (Fecha y Hora)
                </label>
                <div className="space-y-4">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    <input
                      type="date"
                      name="fechaFinDate"
                      value={formData.fechaFinDate}
                      onChange={handleChange}
                      className="w-full pl-12"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    <input
                      type="time"
                      name="fechaFinTime"
                      value={formData.fechaFinTime}
                      onChange={handleChange}
                      className="w-full pl-12"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-5 justify-center group text-sm uppercase tracking-[0.2em] font-black italic mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Desplegar en Blockchain
                    <ArrowLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-2 justify-center mt-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                 <AlertCircle size={12} />
                 Requiere confirmación de transacción
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
