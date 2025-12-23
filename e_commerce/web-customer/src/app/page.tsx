'use client'

import Link from 'next/link'

export default function Home() {
    return (
        <div className="flex flex-col gap-24 pb-24">
            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900 border-b border-indigo-500/10">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-rose-950 opacity-90" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />
                    {/* Animated Glows */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative z-10 section-container grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl mx-auto lg:mx-0">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Web3 Marketplace</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                            Compra con <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">
                                Stablecoins
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            Experimenta el futuro del e-commerce descentralizado. Seguridad total, pagos instantáneos y recompensas exclusivas en el ecosistema Web3.
                        </p>

                        <div className="flex flex-wrap gap-5 justify-center lg:justify-start pt-4">
                            <Link href="/products" className="btn-buy !px-12 !py-5 text-lg group">
                                <span className="flex items-center gap-3">
                                    Explorar Catálogo
                                    <span className="group-hover:translate-x-2 transition-transform">→</span>
                                </span>
                            </Link>
                            <Link href="/loyalty" className="bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white font-bold py-5 px-12 rounded-2xl transition-all border border-white/10 active:scale-95 shadow-2xl">
                                Mis Puntos NFT
                            </Link>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="relative animate-float">
                            {/* Floating UI Mockup */}
                            <div className="w-[440px] aspect-[4/5] bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
                                        💎
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-1/2 bg-white/20 rounded-full" />
                                        <div className="h-8 w-3/4 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-24 bg-white/5 rounded-3xl border border-white/5" />
                                        <div className="h-24 bg-white/5 rounded-3xl border border-white/5" />
                                    </div>
                                    <div className="h-16 w-full bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/40" />
                                </div>
                            </div>
                            {/* Abstract Shapes */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <FeatureCard
                        icon="🛡️"
                        title="Pagos Seguros"
                        desc="Transacciones directas vía Smart Contracts. Sin intermediarios, total transparencia y control sobre tus activos."
                    />
                    <FeatureCard
                        icon="🎁"
                        title="Fidelidad NFT"
                        desc="Cada compra suma puntos en tu pasaporte NFT evolutivo. Desbloquea niveles y beneficios exclusivos automáticamente."
                    />
                    <FeatureCard
                        icon="⚡"
                        title="Liquidación Instantánea"
                        desc="Elimina los tiempos de espera bancarios. El comercio recibe el pago al instante gracias a las stablecoins."
                    />
                </div>
            </section>

            {/* Loyalty CTA */}
            <section className="section-container">
                <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden group border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter">
                                Tu Fidelidad, <br />
                                <span className="text-indigo-400">Ahora es un Activo.</span>
                            </h2>
                            <p className="text-slate-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Olvida las apps de puntos tradicionales. Tu nivel se guarda en un NFT que vive en tu wallet y te otorga beneficios reales en todo nuestro ecosistema.
                            </p>
                            <Link href="/loyalty" className="inline-block bg-white text-slate-900 font-black py-5 px-12 rounded-2xl hover:bg-slate-100 transition-all shadow-2xl active:scale-95 text-lg">
                                Ver Mi Estado NFT
                            </Link>
                        </div>

                        <div className="relative hidden md:block">
                            <div className="w-[320px] aspect-[4/5] bg-indigo-600 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-[0_32px_64px_rgba(79,70,229,0.3)] rotate-6 group-hover:rotate-0 transition-transform duration-700">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🏆</div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Loyalty Tier</p>
                                        <p className="text-3xl font-black text-white leading-none">Diamante</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full w-3/4 bg-white" />
                                        </div>
                                        <p className="text-xs font-bold text-indigo-100">750 / 1000 XP</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="product-card p-12 group">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm border border-slate-100">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none">{title}</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">{desc}</p>
        </div>
    )
}
