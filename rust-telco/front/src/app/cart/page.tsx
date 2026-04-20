'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { getCustomers, checkout } from '@/lib/api';
import { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    ShoppingCart, 
    Trash2, 
    ArrowLeft, 
    CreditCard, 
    User, 
    Loader2, 
    CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { cart, removeFromCart, clearCart, totalPrice } = useCart();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        getCustomers({ per_page: 100 }).then(setCustomers);
    }, []);

    const handleCheckout = async () => {
        if (!selectedCustomer) {
            alert('Por favor, selecciona un cliente para el pedido.');
            return;
        }

        setLoading(true);
        try {
            const orderId = await checkout({
                customer_id: selectedCustomer,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }))
            });
            setOrderSuccess(orderId);
            clearCart();
        } catch (error) {
            console.error('Error en checkout:', error);
            alert('Error al procesar el pedido.');
        } finally {
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="max-w-xl mx-auto py-20 px-4 text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">¡Pedido Realizado!</h1>
                <p className="text-slate-500 mb-8">Tu pedido se ha registrado con el ID: <span className="font-bold text-slate-900">#{orderSuccess}</span></p>
                <div className="space-y-3">
                    <Link href="/products">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Seguir Comprando</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="w-full">Volver al Inicio</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="max-w-xl mx-auto py-20 px-4 text-center">
                <ShoppingCart className="mx-auto text-slate-200 mb-6" size={80} />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h1>
                <p className="text-slate-500 mb-8">Parece que aún no has añadido ningún producto.</p>
                <Link href="/products">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        Ir a la Tienda
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <div className="flex items-center gap-4 mb-10">
                <Link href="/products" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Carrito de Compras</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Lista de Productos */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <div key={item.product_id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                <ShoppingCart size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{item.product_name}</h3>
                                <p className="text-sm text-slate-500">${item.unit_price.toFixed(2)} x {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900">${(item.unit_price * item.quantity).toFixed(2)}</p>
                                <button 
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumen y Pago */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg shadow-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <CreditCard size={20} className="text-blue-600" />
                            Resumen del Pedido
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Envío</span>
                                <span className="text-emerald-600 font-medium">Gratis</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xl font-bold text-slate-900">
                                <span>Total</span>
                                <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-tight">
                                Seleccionar Cliente
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select 
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    required
                                >
                                    <option value="">Selecciona un cliente...</option>
                                    {customers.map(c => (
                                        <option key={c.customer_id} value={c.customer_id}>
                                            {c.company_name} ({c.customer_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button 
                                onClick={handleCheckout}
                                disabled={loading || !selectedCustomer}
                                className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg shadow-xl shadow-blue-100 mt-4"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                ) : (
                                    <CreditCard className="mr-2" size={20} />
                                )}
                                Finalizar Pedido
                            </Button>
                        </div>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={clearCart}
                            className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                        >
                            Vaciar Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
