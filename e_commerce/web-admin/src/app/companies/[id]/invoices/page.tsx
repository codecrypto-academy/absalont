'use client'

import { useState, useEffect, use } from 'react'
import { JsonRpcProvider, Contract } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function InvoicesReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [invoices, setInvoices] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        revenue: 0,
        pending: 0,
        paid: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoices()
    }, [id])

    const fetchInvoices = async () => {
        try {
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
            const provider = new JsonRpcProvider(rpcUrl)
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            const companyId = Number(id)
            
            let invoiceIds = []
            try {
                invoiceIds = await contract.getCompanyInvoices(companyId)
            } catch (e) {
                console.error('Error fetching company invoices:', e)
                invoiceIds = []
            }

            const invoicesData: any[] = []
            let totalRevenue = 0
            let paidCount = 0
            let pendingCount = 0

            for (const invoiceId of invoiceIds) {
                try {
                    const invoice = await contract.getInvoice(invoiceId)
                    const amount = Number(invoice.totalAmount) / 1e6 // EUR 6 decimals
                    const isPaid = invoice.isPaid

                    if (isPaid) {
                        totalRevenue += amount
                        paidCount++
                    } else {
                        pendingCount++
                    }

                    invoicesData.push({
                        id: Number(invoice.id),
                        customer: invoice.customerAddress,
                        amount: amount.toFixed(2),
                        date: new Date(Number(invoice.timestamp) * 1000).toLocaleDateString('es-ES'),
                        status: isPaid ? 'paid' : 'pending',
                        isPaid: isPaid
                    })
                } catch (e) {
                    console.error(`Error fetching invoice ${invoiceId}:`, e)
                }
            }

            setStats({
                total: invoiceIds.length,
                revenue: totalRevenue,
                pending: pendingCount,
                paid: paidCount
            })
            setInvoices(invoicesData)
        } catch (error) {
            console.error('Error fetching invoices:', error)
            setStats({ total: 0, revenue: 0, pending: 0, paid: 0 })
            setInvoices([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Reporte de Facturas</h2>
                <button className="btn-primary">
                    + Nueva Factura
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Total Facturas</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Total Ingresos</p>
                    <p className="text-3xl font-bold text-emerald-600">€{stats.revenue.toFixed(2)}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Pagadas</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.paid}</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. Factura</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando facturas...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">No hay facturas registradas</td></tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 text-sm font-mono text-slate-400">#{invoice.id}</td>
                                    <td className="p-6 text-sm font-semibold text-slate-800">
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                            {invoice.customer.slice(0, 6)}...{invoice.customer.slice(-4)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm text-slate-600">{invoice.date}</td>
                                    <td className="p-6 text-sm font-semibold text-slate-900">€{invoice.amount}</td>
                                    <td className="p-6">
                                        <span className={`badge-admin ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                                            {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-semibold">Ver</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
