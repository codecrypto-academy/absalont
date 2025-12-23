'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, JsonRpcProvider, Contract, formatUnits } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        companies: 0,
        products: 0,
        successRate: 0
    })
    const [recentInvoices, setRecentInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAnalytics = async () => {
        try {
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
            const provider = new JsonRpcProvider(rpcUrl)
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            const [invCount, compCount, prodCount] = await Promise.all([
                contract.getInvoiceCount().catch(() => 0),
                contract.getCompanyCount().catch(() => 0),
                contract.getProductCount().catch(() => 0)
            ])

            const totalInvoices = Number(invCount)
            let totalRevenue = 0
            let paidCount = 0

            // Obtener últimas invoices en paralelo
            const invoicePromises = []
            for (let i = totalInvoices; i > 0 && i > totalInvoices - 50; i--) {
                invoicePromises.push(
                    contract.getInvoice(i).catch(() => [0, '', '', 0, 0, false])
                )
            }

            const invoicesData = await Promise.all(invoicePromises)
            const formattedInvoices: any[] = []

            invoicesData.forEach(inv => {
                try {
                    if (!inv || inv[0] === 0) return // Skip failed results

                    const amount = Number(formatUnits(inv[3], 6))
                    const isPaid = inv[5]

                    if (isPaid) {
                        totalRevenue += amount
                        paidCount++
                    }

                    if (formattedInvoices.length < 10) {
                        formattedInvoices.push({
                            id: Number(inv[0]),
                            customer: inv[2],
                            amount: amount,
                            date: new Date(Number(inv[4]) * 1000).toLocaleDateString(),
                            isPaid: isPaid
                        })
                    }
                } catch (e) {
                    // Skip invalid invoice entries
                }
            })

            setStats({
                revenue: totalRevenue,
                orders: totalInvoices,
                companies: Number(compCount),
                products: Number(prodCount),
                successRate: totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 0
            })
            setRecentInvoices(formattedInvoices)
        } catch (error) {
            console.error('Error fetching analytics:', error)
            setStats({ revenue: 0, orders: 0, companies: 0, products: 0, successRate: 0 })
            setRecentInvoices([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [])

    return (
        <div className="p-10 animate-in">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Analíticas de Plataforma</h1>
                <p className="text-slate-500 font-medium">Métricas clave y rendimiento de la red en tiempo real.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="glass-card p-6 border-l-4 border-l-indigo-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volumen Total</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">€{stats.revenue.toFixed(2)}</span>
                        <span className="text-xs font-bold text-indigo-500">EURS</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-3/4" />
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasa de Conversión</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{stats.successRate.toFixed(1)}%</span>
                        <span className="text-xs font-bold text-emerald-500">PAID</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${stats.successRate}%` }} />
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendedores</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{stats.companies}</span>
                        <span className="text-xs font-bold text-amber-500">EMPRESAS</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-1/2" />
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Artículos</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{stats.products}</span>
                        <span className="text-xs font-bold text-rose-500">SKUS</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-2/3" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Chart Simulation */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-8 h-full">
                        <h3 className="text-lg font-black text-slate-800 mb-6 tracking-tight">Distribución de Ventas</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-500">Pagado con Éxito</span>
                                    <span className="text-emerald-600 font-black">{stats.successRate.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.successRate}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-500">Pendiente / Error</span>
                                    <span className="text-rose-600 font-black">{(100 - stats.successRate).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${100 - stats.successRate}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tip de Red</p>
                            <p className="text-xs leading-relaxed text-slate-300 font-medium">
                                "La latencia de bloque promedio en Anvil es de <span className="text-emerald-400 font-bold">12ms</span>. Considera optimizar los eventos del contrato para un seguimiento más rápido."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Actividad de Facturación</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1">Últimas 10 transacciones detectadas</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Invoice</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Monto</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black animate-pulse uppercase tracking-widest">Procesando Ledger...</td></tr>
                                    ) : recentInvoices.length === 0 ? (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold">No se han emitido facturas aún</td></tr>
                                    ) : (
                                        recentInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="p-6">
                                                    <span className="font-black text-slate-400 tracking-tighter">#{inv.id}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="font-mono text-xs text-slate-600 font-bold tracking-tight">
                                                        {inv.customer.slice(0, 6)}...{inv.customer.slice(-4)}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-sm font-black text-slate-900 tracking-tighter">€{inv.amount.toFixed(2)}</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className={`badge-admin mx-auto w-fit ${inv.isPaid
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase'
                                                        : 'bg-rose-50 text-rose-500 border border-rose-100 uppercase'
                                                        }`}>
                                                        {inv.isPaid ? 'Completado' : 'Pendiente'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
