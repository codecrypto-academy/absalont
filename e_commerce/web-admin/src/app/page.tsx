'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import Link from 'next/link'
import { ECOMMERCE_ABI } from '@/lib/contractABI'
import { Building2, ShoppingBag, Banknote, Users } from 'lucide-react'
import { getReadProvider } from '@/lib/provider'

export default function Home() {
    const [stats, setStats] = useState({
        companies: 0,
        products: 0,
        revenue: 0,
        blocks: 0
    })
    const [recentCompanies, setRecentCompanies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS

            if (!ecommerceAddress) {
                console.error('ECOMMERCE_CONTRACT_ADDRESS not set')
                setStats({ companies: 0, products: 0, revenue: 0, blocks: 0 })
                setLoading(false)
                return
            }

            const provider = await getReadProvider()
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            // Test contract availability
            try {
                const code = await provider.getCode(ecommerceAddress)
                if (code === '0x') {
                    console.error('No contract found at address:', ecommerceAddress)
                    setStats({ companies: 0, products: 0, revenue: 0, blocks: 0 })
                    setLoading(false)
                    return
                }
            } catch (e) {
                console.error('Error checking contract code:', e)
            }

            const [compCount, prodCount, invCount, blockNumber] = await Promise.all([
                contract.getCompanyCount().catch(() => 0),
                contract.getProductCount().catch(() => 0),
                contract.getInvoiceCount().catch(() => 0),
                provider.getBlockNumber().catch(() => 0)
            ])

            // Calcular Revenue de forma paralela
            let totalRevenue = 0
            const totalInvoices = Number(invCount)
            const invoicePromises = []
            for (let i = totalInvoices; i > 0 && i > totalInvoices - 15; i--) {
                invoicePromises.push(
                    contract.getInvoice(i).catch(() => [0, 0, 0, 0, false])
                )
            }
            const invoices = await Promise.all(invoicePromises)
            invoices.forEach(inv => {
                try {
                    if (inv && inv[5]) totalRevenue += Number(formatUnits(inv[3], 6))
                } catch (e) {
                    // Skip invalid invoices
                }
            })

            // Obtener últimas empresas de forma paralela
            const companyPromises = []
            const maxComp = Number(compCount)
            for (let i = maxComp; i > 0 && i > maxComp - 3; i--) {
                companyPromises.push(
                    contract.getCompany(i).catch(() => [0, '', '', '', false])
                )
            }
            const companyResults = await Promise.all(companyPromises)
            const companies = companyResults
                .filter((comp: any) => comp && comp[0]) // Filter out failed results
                .map((comp: any) => ({
                    id: Number(comp[0]),
                    name: comp[1],
                    status: comp[4] ? 'Activa' : 'Inactiva'
                }))

            setStats({
                companies: Number(compCount),
                products: Number(prodCount),
                revenue: totalRevenue,
                blocks: blockNumber
            })
            setRecentCompanies(companies)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="p-10 animate-in">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Resumen de Actividad</h1>
                <p className="text-slate-500 font-medium">Panel de control en tiempo real del ecosistema blockchain.</p>
            </div>



            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                <StatCard
                    title="Empresas"
                    value={stats.companies}
                    icon={<Building2 size={24} strokeWidth={2.5} />}
                    color="indigo"
                />
                <StatCard
                    title="Productos"
                    value={stats.products}
                    icon={<ShoppingBag size={24} strokeWidth={2.5} />}
                    color="emerald"
                />
                <StatCard
                    title="Ventas Totales"
                    value={`€${stats.revenue.toFixed(1)}k`}
                    icon={<Banknote size={24} strokeWidth={2.5} />}
                    color="purple"
                />
                <StatCard
                    title="Usuarios"
                    value="892"
                    icon={<Users size={24} strokeWidth={2.5} />}
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="glass-card p-10">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Empresas Recientes</h2>
                        <Link href="/companies" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver todas →</Link>
                    </div>
                    <div className="space-y-6">
                        {loading ? (
                            <div className="p-10 text-center animate-pulse text-slate-300 font-bold">Cargando empresas...</div>
                        ) : recentCompanies.length === 0 ? (
                            <div className="p-10 text-center text-slate-300 font-bold">No hay empresas registradas</div>
                        ) : (
                            recentCompanies.map((comp) => (
                                <div key={comp.id} className="flex items-center gap-5 p-4 rounded-[1.25rem] hover:bg-slate-50 transition-all group">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-110 transition-transform">
                                        {comp.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-800 tracking-tight">{comp.name}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">ID: #00{comp.id} • Status Verificado</p>
                                    </div>
                                    <div className={`badge-admin ${comp.status === 'Activa' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {comp.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass-card p-10">
                        <h2 className="text-xl font-black text-slate-800 mb-8 tracking-tight">Estado del Sistema</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bloque Actual</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">#{stats.blocks.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gas Price</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">0.01 <span className="text-xs font-bold text-slate-400">gwei</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-indigo-500/30 transition-colors" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2 tracking-tight">Membresía Admin Pro</h3>
                            <p className="text-sm text-slate-400 mb-8 font-medium">Tu suscripción corporativa expira en <span className="text-white font-bold">45 días</span>.</p>
                            <button className="bg-white text-slate-950 px-8 py-3 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10">
                                Renovar Suscripción
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, color }: any) {
    const colorClasses: any = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        rose: 'bg-rose-50 text-rose-600'
    }

    return (
        <div className="glass-card p-8 hover:-translate-y-2 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colorClasses[color]} shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    {icon}
                </div>
                <div className="badge-admin bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <span className="animate-pulse">↑</span> 12%
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
        </div>
    )
}
