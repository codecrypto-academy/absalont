'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import Link from 'next/link'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

interface OrderItem {
    productId: number
    productName: string
    quantity: number
    price: number
}

interface Order {
    id: number
    companyId: number
    totalAmount: number
    timestamp: number
    isPaid: boolean
    items: OrderItem[]
    date: string
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

    const fetchOrders = async () => {
        if (!window.ethereum) return
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const account = await signer.getAddress()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            const invoiceIds = await contract.getCustomerInvoices(account)
            const ordersData: Order[] = []

            // Fetch details for each invoice (reverse loop for newest first)
            for (let i = invoiceIds.length - 1; i >= 0; i--) {
                const id = invoiceIds[i]
                const invoice = await contract.getInvoice(id)
                const items = await contract.getInvoiceItems(id)

                ordersData.push({
                    id: Number(invoice.id),
                    companyId: Number(invoice.companyId),
                    totalAmount: Number(formatUnits(invoice.totalAmount, 18)),
                    timestamp: Number(invoice.timestamp),
                    isPaid: invoice.isPaid,
                    date: new Date(Number(invoice.timestamp) * 1000).toLocaleString(),
                    items: items.map((item: any) => ({
                        productId: Number(item.productId),
                        productName: item.productName,
                        quantity: Number(item.quantity),
                        price: Number(formatUnits(item.price, 18))
                    }))
                })
            }

            setOrders(ordersData)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const toggleOrder = (orderId: number) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null)
        } else {
            setExpandedOrder(orderId)
        }
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50/50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Pedidos</h1>
                        <p className="text-slate-500 mt-2">Historial de tus compras y estado de envíos.</p>
                    </div>
                    {/* Refresh Button */}
                    <button
                        onClick={() => { setLoading(true); fetchOrders(); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Actualizar lista"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-card p-6 animate-pulse">
                                <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="glass-card p-20 text-center">
                        <span className="text-6xl mb-6 block">📦</span>
                        <h2 className="text-2xl font-bold text-slate-800">Aún no tienes pedidos</h2>
                        <p className="text-slate-500 mt-2 mb-8 text-lg">Explora nuestro catálogo y realiza tu primera compra.</p>
                        <Link href="/products" className="btn-buy px-12">Explorar Productos</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg border border-slate-100">
                                {/* Order Header */}
                                <div
                                    className="p-6 cursor-pointer bg-white/50 hover:bg-white transition-colors"
                                    onClick={() => toggleOrder(order.id)}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${order.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {order.isPaid ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">Pedido #{order.id}</h3>
                                                <p className="text-sm text-slate-500">{order.date}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-sm text-slate-400 font-medium">Total</p>
                                                <p className="text-lg font-black text-slate-900">€{order.totalAmount.toFixed(2)}</p>
                                            </div>

                                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {order.isPaid ? 'Pagado' : 'Pendiente'}
                                            </div>

                                            <div className={`transform transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-180' : ''}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Details (Expandable) */}
                                {expandedOrder === order.id && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-fadeIn">
                                        <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Detalles del Pedido</h4>
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-0 hover:bg-slate-100/50 rounded px-2 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                            x{item.quantity}
                                                        </span>
                                                        <span className="text-slate-700 font-medium">{item.productName}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-600">€{item.price.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {!order.isPaid && (
                                            <div className="mt-6 flex justify-end">
                                                <a
                                                    href={`http://localhost:6002/?invoice=${order.id}`}
                                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                                    </svg>
                                                    Pagar Ahora
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

