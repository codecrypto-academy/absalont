'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import WalletConnect from '@/components/WalletConnect'
import PurchaseForm from '@/components/PurchaseForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Home() {
  const [account, setAccount] = useState<string>('')

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center">
        {/* Header/Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Stablecoin Gate</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="text-xs text-white/40">Powered by Stripe & Blockchain</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-white">
            Obtén tus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">
              EuroTokens Instantáneos
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            La forma más rápida y segura de entrar al ecosistema Web3. Compra tokens con tu tarjeta de crédito y recíbelos directamente en tu wallet.
          </p>
        </div>

        <div className="w-full grid md:grid-cols-2 gap-8 items-start">
          {/* Wallet Connection Card */}
          <div className="glass-card p-8 animate-glow">
            <WalletConnect account={account} setAccount={setAccount} />
          </div>

          {/* Form Card */}
          <div className="min-h-[400px]">
            {account ? (
              <div className="glass-card p-8 border-indigo-500/30">
                <Elements stripe={stripePromise}>
                  <PurchaseForm account={account} />
                </Elements>
              </div>
            ) : (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-6 h-full border-dashed border-white/10">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-2">
                  <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Falta Conexión</h3>
                  <p className="text-slate-400 text-sm max-w-[240px]">
                    Conecta tu wallet MetaMask a la izquierda para habilitar el formulario de compra.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-white/5 pt-16">
          <InfoCard icon="lock" title="Full Seguridad" desc="Tus datos de pago nunca tocan nuestros servidores, procesado por Stripe." />
          <InfoCard icon="lightning" title="Mint Instantáneo" desc="Recibe tus EURT en segundos después de confirmar el pago." />
          <InfoCard icon="euro" title="Paridad 1:1" desc="Cada EuroToken está respaldado por un Euro real en nuestra reserva." />
        </div>
      </div>
    </main>
  )
}

function InfoCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  const getIcon = () => {
    switch (icon) {
      case 'lock':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )
      case 'lightning':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'euro':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-white/80">{getIcon()}</div>
      <h4 className="text-lg font-bold text-white">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  )
}
