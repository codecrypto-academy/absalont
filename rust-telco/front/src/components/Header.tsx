'use client';

import Link from "next/link";
import { Database, Menu, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Header() {
    const { totalItems } = useCart();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
                        <Database size={18} />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        Northwind<span className="text-blue-600">Admin</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
                    <Link href="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
                    <Link href="/customers" className="hover:text-blue-600 transition-colors">Clientes</Link>
                    <Link href="/products" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <Package size={16} /> Productos
                    </Link>
                    
                    <Link href="/cart" className="relative p-2 text-slate-700 hover:text-blue-600 transition-colors">
                        <ShoppingCart size={22} />
                        {totalItems > 0 && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {totalItems}
                            </span>
                        )}
                    </Link>

                    <Link href="/customers/add" className="px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all">
                        Nuevo Cliente
                    </Link>
                </nav>

                <button className="md:hidden p-2 text-slate-600">
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}
