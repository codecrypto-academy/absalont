'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import Link from 'next/link'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function CartPage() {
    const [cartItems, setCartItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('')
    const [companyId, setCompanyId] = useState<number | null>(null) // To store companyId for checkout

    const fetchCart = async () => {
        if (!window.ethereum) return
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const account = await signer.getAddress()

            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            const rawItems = await contract.getCart(account)
            const itemsWithDetails = []

            for (const item of rawItems) {
                const product = await contract.getProduct(item.productId)
                itemsWithDetails.push({
                    id: Number(item.productId),
                    name: product.name,
                    price: Number(product.price) / 1e6,
                    quantity: Number(item.quantity),
                    companyId: Number(product.companyId),
                    image: product.ipfsImageHash || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2899&auto=format&fit=crop'
                })
            }
            setCartItems(itemsWithDetails)
            if (itemsWithDetails.length > 0) {
                setCompanyId(itemsWithDetails[0].companyId)
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCart()
    }, [])

    const handleRemove = async (productId: number) => {
        if (!window.ethereum) return
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            const tx = await contract.removeFromCart(productId)
            await tx.wait()
            fetchCart()
        } catch (error) {
            console.error(error)
        }
    }

    const handleIncreaseQuantity = async (productId: number) => {
        if (!window.ethereum) return
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            const item = cartItems.find(i => i.id === productId)
            if (item) {
                const currentQuantity = item.quantity
                const newQuantity = currentQuantity + 1

                // Note: You may need to implement addToCart in your contract
                // For now, we'll just update local state
                const updatedItems = cartItems.map(i =>
                    i.id === productId ? { ...i, quantity: newQuantity } : i
                )
                setCartItems(updatedItems)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDecreaseQuantity = async (productId: number) => {
        if (!window.ethereum) return
        try {
            const item = cartItems.find(i => i.id === productId)
            if (item && item.quantity > 1) {
                const newQuantity = item.quantity - 1
                const updatedItems = cartItems.map(i =>
                    i.id === productId ? { ...i, quantity: newQuantity } : i
                )
                setCartItems(updatedItems)
            } else if (item && item.quantity === 1) {
                // Remove if quantity becomes 0
                handleRemove(productId)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const [email, setEmail] = useState('')

    const handleCheckout = async () => {
        if (!window.ethereum || !companyId) return

        if (!email || !email.includes('@')) {
            setStatus('Por favor ingresa un email válido para recibir notificaciones')
            setTimeout(() => setStatus(''), 3000)
            return
        }

        setStatus('Creando factura en la blockchain...')
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const userAddress = await signer.getAddress()

            // Suscribir al servicio de notificaciones
            try {
                await fetch('http://localhost:6005/api/subscribe/customer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: userAddress,
                        email: email
                    })
                })
            } catch (err) {
                console.error('Error suscribiendo a notificaciones:', err)
                // No bloqueamos el checkout si falla la notificación
            }

            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            const tx = await contract.createInvoiceFromCart(companyId)
            await tx.wait()

            const invoiceId = await contract.getInvoiceCount()

            setStatus('Factura creada. Redirigiendo a Pasarela de Pago...')
            setTimeout(() => {
                window.location.href = `http://localhost:6002/?invoice=${invoiceId}`
            }, 1500)
        } catch (error: any) {
            setStatus(`Error: ${error.message}`)
        }
    }

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const tax = subtotal * 0.21
    const total = subtotal + tax
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)

    const uniqueCompanyIds = Array.from(new Set(cartItems.map(item => item.companyId)))
    const hasMixedCart = uniqueCompanyIds.length > 1

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Tu Carrito de Compras</h1>
                    <p className="text-slate-500 font-medium">
                        {totalItems === 0
                            ? 'Tu carrito está vacío'
                            : `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`
                        }
                    </p>
                </div>

                {loading ? (
                    <div className="glass-card p-12 text-center">
                        <div className="inline-block">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-500 mt-4 font-medium">Consultando blockchain...</p>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="glass-card p-20 text-center max-w-2xl mx-auto">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900">Tu carrito está vacío</h2>
                        <p className="text-slate-500 mt-4 mb-10 text-lg font-medium">
                            Explora nuestro catálogo y encuentra los productos que buscas.
                        </p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
                            </svg>
                            Explorar Productos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Lista de productos */}
                        <div className="lg:col-span-3 space-y-4">

                            {/* Alerta de Mixed Cart */}
                            {hasMixedCart && (
                                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl mb-6">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-bold text-amber-800">Has seleccionado productos de diferentes empresas</h3>
                                            <div className="mt-2 text-sm text-amber-700">
                                                <p>
                                                    La blockchain requiere que cada orden de compra sea para una sola empresa.
                                                    Por favor, elimina los productos de otras empresas para proceder con el pago.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Header tabla */}
                            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border-2 border-slate-200 font-black text-slate-600 text-sm uppercase tracking-wider">
                                <div className="col-span-1">Img</div>
                                <div className="col-span-4">Producto</div>
                                <div className="col-span-2 text-right">Precio</div>
                                <div className="col-span-2 text-center">Cantidad</div>
                                <div className="col-span-2 text-right">Total</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Items */}
                            {cartItems.map((item) => {
                                const itemTotal = item.price * item.quantity
                                // Resaltar items que son de diferente empresa si hay mixed cart (usando la primera empresa como referencia)
                                const isDifferentCompany = hasMixedCart && item.companyId !== cartItems[0].companyId

                                return (
                                    <div
                                        key={item.id}
                                        className={`glass-card p-6 md:p-4 rounded-2xl border-2 transition-all duration-300 group
                                            ${isDifferentCompany ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg'}
                                        `}
                                    >
                                        <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center space-y-4 md:space-y-0">
                                            {/* Imagen */}
                                            <div className="col-span-1">
                                                <div className="w-24 h-24 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-100 flex-shrink-0 border-2 border-slate-200 group-hover:border-indigo-300 transition-all">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Nombre */}
                                            <div className="col-span-4">
                                                <h3 className="font-black text-slate-900 text-lg md:text-base group-hover:text-indigo-600 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <p className={`text-xs mt-1 font-bold flex items-center gap-1 ${isDifferentCompany ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {isDifferentCompany && '⚠️ '}
                                                    Empresa #{item.companyId}
                                                </p>
                                            </div>

                                            {/* Precio unitario */}
                                            <div className="col-span-2 text-right">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio</p>
                                                <p className="text-xl md:text-lg font-black text-indigo-600 mt-1">€{item.price.toFixed(2)}</p>
                                            </div>

                                            {/* Cantidad */}
                                            <div className="col-span-2 text-center">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Cantidad</p>
                                                <div className="inline-flex items-center gap-3 bg-slate-100 rounded-lg px-2 py-2 border-2 border-slate-200 group-hover:border-indigo-300 transition-all">
                                                    <button
                                                        onClick={() => handleDecreaseQuantity(item.id)}
                                                        className="p-1 text-slate-600 hover:text-white hover:bg-rose-500 rounded-lg transition-all duration-200 font-bold flex items-center justify-center w-6 h-6"
                                                        title="Decrementar cantidad"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M19 13H5v-2h14v2z" />
                                                        </svg>
                                                    </button>
                                                    <span className="font-black text-slate-900 text-lg w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleIncreaseQuantity(item.id)}
                                                        className="p-1 text-slate-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 font-bold flex items-center justify-center w-6 h-6"
                                                        title="Incrementar cantidad"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Total item */}
                                            <div className="col-span-2 text-right">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total</p>
                                                <p className="text-2xl md:text-lg font-black text-slate-900 mt-1">€{itemTotal.toFixed(2)}</p>
                                            </div>

                                            {/* Botón eliminar */}
                                            <div className="col-span-1 text-right">
                                                <button
                                                    onClick={() => handleRemove(item.id)}
                                                    className="p-3 text-slate-300 hover:text-white hover:bg-rose-500 rounded-xl transition-all duration-300 transform hover:scale-110 font-bold text-lg inline-flex items-center justify-center"
                                                    title="Eliminar del carrito"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M19 13H5v-2h14v2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Resumen de compra - Sticky */}
                        <div className="lg:col-span-1">
                            <div className="glass-card p-8 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50 sticky top-28 shadow-xl shadow-indigo-500/10">
                                {/* Icono encabezado */}
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-indigo-200">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                        💳
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900">Resumen</h2>
                                </div>

                                {/* Detalles */}
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                        <span className="text-slate-600 font-medium">Subtotal</span>
                                        <span className="font-black text-slate-900">€{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                        <span className="text-slate-600 font-medium">IVA (21%)</span>
                                        <span className="font-black text-slate-900">€{tax.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-700 font-black text-lg">Total:</span>
                                            <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                €{total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items count */}
                                <div className="mt-6 p-4 bg-indigo-100/50 rounded-xl border-2 border-indigo-200">
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-1">Artículos en carrito</p>
                                    <p className="text-3xl font-black text-indigo-600">{totalItems}</p>
                                </div>

                                {/* Email input */}
                                <div className="mt-6">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email de Contacto</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">* Para recibir notificaciones de tu pedido</p>
                                </div>

                                {/* Botón checkout */}
                                <div className="mt-6 space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        disabled={hasMixedCart || !companyId}
                                        className={`w-full py-4 px-6 text-white font-black text-lg rounded-xl shadow-lg transition-all duration-300 transform 
                                            ${hasMixedCart
                                                ? 'bg-slate-400 cursor-not-allowed grayscale'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30 hover:scale-105 active:scale-95'
                                            }`}
                                        title={hasMixedCart ? 'Elimina productos de otras empresas para continuar' : 'Finalizar Compra'}
                                    >
                                        {hasMixedCart ? '⚠️ Orden Mixta' : '🛍️ Finalizar Compra'}
                                    </button>
                                    <Link
                                        href="/products"
                                        className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-center rounded-xl transition-all duration-300 border-2 border-slate-200 block"
                                    >
                                        Continuar Comprando
                                    </Link>
                                </div>
                                {/* Info seguridad */}
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center">
                                        🔒 Pagos seguros vía Ethereum
                                        <br />
                                        ⚡ Liquidación instantánea
                                    </p>
                                </div>

                                {/* Status */}
                                {status && (
                                    <div className="mt-6 p-4 bg-indigo-100 border-2 border-indigo-300 rounded-xl text-xs font-bold text-indigo-700 text-center animate-pulse">
                                        {status}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
