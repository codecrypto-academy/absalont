'use client'

import { useState, useEffect, use } from 'react'
import { JsonRpcProvider, Contract } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

interface Customer {
    address: string
    purchases: number
    totalSpent: number
    firstPurchase: string
    lastPurchase: string
}

export default function CustomersReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [stats, setStats] = useState({
        total: 0,
        totalSpent: 0,
        averageSpent: 0,
        thisMonth: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCustomers()
    }, [id])

    const fetchCustomers = async () => {
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

            // Agrupar clientes por dirección
            const customerMap = new Map<string, {
                purchases: number,
                totalSpent: number,
                dates: number[]
            }>()

            let totalCompanyRevenue = 0
            const currentMonth = new Date()
            currentMonth.setDate(1)
            currentMonth.setHours(0, 0, 0, 0)
            let thisMonthRevenue = 0

            for (const invoiceId of invoiceIds) {
                try {
                    const invoice = await contract.getInvoice(invoiceId)
                    const customerAddr = invoice.customerAddress
                    const amount = Number(invoice.totalAmount) / 1e6 // EUR 6 decimals
                    const timestamp = Number(invoice.timestamp) * 1000
                    const isPaid = invoice.isPaid

                    if (isPaid) {
                        totalCompanyRevenue += amount

                        const invoiceDate = new Date(timestamp)
                        if (invoiceDate >= currentMonth) {
                            thisMonthRevenue += amount
                        }

                        if (customerMap.has(customerAddr)) {
                            const customer = customerMap.get(customerAddr)!
                            customer.purchases += 1
                            customer.totalSpent += amount
                            customer.dates.push(timestamp)
                        } else {
                            customerMap.set(customerAddr, {
                                purchases: 1,
                                totalSpent: amount,
                                dates: [timestamp]
                            })
                        }
                    }
                } catch (e) {
                    console.error(`Error fetching invoice ${invoiceId}:`, e)
                }
            }

            // Convertir map a array y ordenar
            const customersArray: Customer[] = Array.from(customerMap, ([address, data]) => {
                const dates = data.dates.sort((a, b) => b - a)
                return {
                    address,
                    purchases: data.purchases,
                    totalSpent: data.totalSpent,
                    firstPurchase: new Date(data.dates.sort((a, b) => a - b)[0]).toLocaleDateString('es-ES'),
                    lastPurchase: new Date(dates[0]).toLocaleDateString('es-ES')
                }
            }).sort((a, b) => b.totalSpent - a.totalSpent)

            setStats({
                total: customersArray.length,
                totalSpent: totalCompanyRevenue,
                averageSpent: customersArray.length > 0 ? totalCompanyRevenue / customersArray.length : 0,
                thisMonth: thisMonthRevenue
            })
            setCustomers(customersArray)
        } catch (error) {
            console.error('Error fetching customers:', error)
            setStats({ total: 0, totalSpent: 0, averageSpent: 0, thisMonth: 0 })
            setCustomers([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Reporte de Clientes</h2>
                <button className="btn-primary">
                    + Agregar Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Total Clientes</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Total Gastado</p>
                    <p className="text-3xl font-bold text-emerald-600">€{stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Este Mes</p>
                    <p className="text-3xl font-bold text-indigo-600">€{stats.thisMonth.toFixed(2)}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-sm text-slate-500 uppercase font-bold mb-2">Gasto Promedio</p>
                    <p className="text-3xl font-bold text-slate-900">€{stats.averageSpent.toFixed(2)}</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Wallet</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Compras</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Gastado</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Primera Compra</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Compra</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando clientes...</td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">No hay clientes registrados</td></tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.address} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 text-sm">
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                            {customer.address.slice(0, 6)}...{customer.address.slice(-4)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm font-semibold text-slate-800">{customer.purchases}</td>
                                    <td className="p-6 text-sm font-semibold text-emerald-600">€{customer.totalSpent.toFixed(2)}</td>
                                    <td className="p-6 text-sm text-slate-600">{customer.firstPurchase}</td>
                                    <td className="p-6 text-sm text-slate-600">{customer.lastPurchase}</td>
                                    <td className="p-6 text-sm">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-semibold">Ver Detalle</button>
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
