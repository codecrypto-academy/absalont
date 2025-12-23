'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ShoppingBag, LineChart } from 'lucide-react'

const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Empresas', href: '/companies', icon: Building2 },
    { name: 'Productos', href: '/products', icon: ShoppingBag },
    { name: 'Analíticas', href: '/analytics', icon: LineChart },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200/60 z-50">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30">
                        A
                    </div>
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500 tracking-tighter">
                        AdminPro
                    </span>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                            >
                                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    <Icon size={20} strokeWidth={2.5} />
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="absolute bottom-10 left-8 right-8">
                <div className="bg-slate-950 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping absolute" />
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative" />
                        <span className="text-xs font-bold text-slate-200">Anvil Localhost</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
