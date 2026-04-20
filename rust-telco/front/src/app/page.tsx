'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    Users, 
    ShoppingCart, 
    TrendingUp, 
    DollarSign, 
    ArrowRight, 
    Package, 
    Calendar,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { getStats } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function Home() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStats()
            .then(setStats)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    const metrics = [
        { 
            title: "Pedidos Totales", 
            value: stats?.total_orders || 0, 
            icon: ShoppingCart, 
            color: "bg-blue-500", 
            trend: "+12%",
            description: "Desde el último mes"
        },
        { 
            title: "Ingresos Totales", 
            value: `$${(stats?.total_revenue || 0).toLocaleString()}`, 
            icon: DollarSign, 
            color: "bg-emerald-500", 
            trend: "+8.4%",
            description: "Crecimiento proyectado"
        },
        { 
            title: "Clientes Activos", 
            value: stats?.total_customers || 0, 
            icon: Users, 
            color: "bg-violet-500", 
            trend: "+5.2%",
            description: "Nuevos registros esta semana"
        },
        { 
            title: "Tasa de Conversión", 
            value: "24.5%", 
            icon: TrendingUp, 
            color: "bg-amber-500", 
            trend: "+2.1%",
            description: "Optimización de ventas"
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header del Dashboard */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h1>
                    <p className="text-slate-500 mt-1">Bienvenido al sistema administrativo de Northwind Traders</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/products">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                            Ir a la Tienda <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${m.color} p-3 rounded-2xl text-white shadow-lg`}>
                                <m.icon size={24} />
                            </div>
                            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                {m.trend} <ArrowUpRight size={12} />
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{m.title}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
                        <p className="text-slate-400 text-[10px] mt-2 italic">{m.description}</p>
                    </div>
                ))}
            </div>

            {/* Sección de Gráficos y Tabla */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visualización Estadística Simulada */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Rendimiento de Ventas
                    </h2>
                    
                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div 
                                    className="w-full bg-blue-100 group-hover:bg-blue-600 transition-all rounded-t-lg relative"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        ${h * 125}k
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">D{i+1}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            El gráfico muestra la tendencia de ingresos semanales. Se observa un pico de ventas el <span className="font-bold text-blue-600">Día 4</span> debido a la campaña de marketing.
                        </p>
                    </div>
                </div>

                {/* Pedidos Recientes */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Package size={20} className="text-blue-600" />
                            Pedidos Recientes
                        </h2>
                        <Link href="/cart" className="text-blue-600 text-sm font-bold hover:underline">
                            Realizar nuevo pedido
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                    <th className="pb-4">ID Pedido</th>
                                    <th className="pb-4">Cliente</th>
                                    <th className="pb-4">Fecha</th>
                                    <th className="pb-4 text-right">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.recent_orders.map((order) => (
                                    <tr key={order.order_id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 font-mono text-sm text-blue-600">#{order.order_id}</td>
                                        <td className="py-4 text-sm font-semibold text-slate-900">{order.customer_id}</td>
                                        <td className="py-4 text-sm text-slate-500 flex items-center gap-1">
                                            <Calendar size={14} />
                                            {order.order_date?.split('T')[0] || 'Hoy'}
                                        </td>
                                        <td className="py-4 text-sm font-bold text-slate-900 text-right">
                                            ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {!stats?.recent_orders.length && (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                            Aún no se han registrado pedidos en el sistema.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
