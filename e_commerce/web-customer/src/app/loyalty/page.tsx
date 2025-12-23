'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract } from 'ethers'

const LOYALTY_ABI = [
    'function getLoyaltyCard(address customer) external view returns (tuple(uint8 tier, uint256 points, uint256 totalSpent, uint256 discountPercentage, uint256 issuedAt))',
    'function addressToTokenId(address customer) external view returns (uint256)'
]

export default function LoyaltyPage() {
    const [points, setPoints] = useState(0)
    const [tierName, setTierName] = useState('Bronce')
    const [loading, setLoading] = useState(true)

    const loadLoyalty = async () => {
        if (!(window as any).ethereum) return
        try {
            const provider = new BrowserProvider((window as any).ethereum)
            const loyaltyAddress = process.env.NEXT_PUBLIC_LOYALTY_NFT_ADDRESS!
            const contract = new Contract(loyaltyAddress, LOYALTY_ABI, provider)

            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            const hasCard = await contract.addressToTokenId(address)
            if (Number(hasCard) !== 0) {
                const card = await contract.getLoyaltyCard(address)
                setPoints(Number(card.points))

                const tiers = ['Bronce', 'Plata', 'Oro', 'Platino']
                setTierName(tiers[Number(card.tier)])
            }
        } catch (e) {
            console.log("No loyalty data found for user")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLoyalty()
    }, [])

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-6xl mx-auto py-12">
                <div className="mb-16 text-center md:text-left">
                    <h1 className="text-5xl font-black mb-4 tracking-tighter">Programa de Fidelidad</h1>
                    <p className="text-slate-400 text-xl max-w-2xl">Colecciona puntos con cada compra y evoluciona tu NFT de miembro exclusivo.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Tarjeta NFT 3D Effect */}
                    <div className="relative group perspective-1000">
                        <div className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-800 rounded-[2.5rem] p-10 shadow-2xl transition-transform duration-500 hover:rotate-y-12 transform-style-3d border border-white/20 overflow-hidden">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-inner">💎</div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">CryptoShop Exclusive</p>
                                        <p className="text-sm font-bold opacity-80">Edición 2024</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-4xl font-black tracking-tight mb-2 uppercase">{tierName} Member</h2>
                                    <div className="flex items-center gap-4 text-xs font-mono opacity-60">
                                        <span>VERIFIED ASSET</span>
                                        <span className="w-1 h-1 bg-white rounded-full" />
                                        <span>NFT #2,142</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Puntos Acumulados</p>
                                        <p className="text-3xl font-black">{points.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold">
                                        ACTIVE STATUS
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                    </div>

                    {/* Progress & Rewards */}
                    <div className="space-y-10">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <h3 className="text-2xl font-bold">Progreso de Nivel</h3>
                                <p className="text-indigo-400 font-bold">{points} / 5,000 Puntos</p>
                            </div>
                            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-1000"
                                    style={{ width: `${Math.min((points / 5000) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-500 mt-4">Faltan {5000 - points} puntos para el nivel **Zafiro**.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <RewardCard icon="📦" title="Envíos Gratis" status="ACTIVE" color="indigo" />
                            <RewardCard icon="🎟️" title="Acceso Preventa" status="ACTIVE" color="purple" />
                            <RewardCard icon="🏷️" title="Descuento 15%" status="LOCKED" color="slate" />
                            <RewardCard icon="👑" title="Soporte VIP" status="LOCKED" color="slate" />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-12 { transform: rotateY(12deg); }
      `}</style>
        </div>
    )
}

function RewardCard({ icon, title, status, color }: any) {
    const isActive = status === 'ACTIVE'
    return (
        <div className={`p-6 rounded-[2rem] border transition-all duration-300 ${isActive
            ? `bg-${color}-500/10 border-${color}-500/20 hover:scale-105`
            : 'bg-white/5 border-white/10 grayscale opacity-40'
            }`}>
            <div className="text-2xl mb-4">{icon}</div>
            <h4 className="font-bold text-sm mb-1">{title}</h4>
            <p className={`text-[10px] font-black tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                {isActive ? 'COMPLETADO' : 'BLOQUEADO'}
            </p>
        </div>
    )
}
