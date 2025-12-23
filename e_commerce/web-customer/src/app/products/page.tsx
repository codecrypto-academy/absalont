'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, JsonRpcProvider, Contract, formatUnits } from 'ethers'
import Link from 'next/link'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [cartCount, setCartCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState({ message: '', type: '' })



    const fetchProducts = async () => {
        try {
            // Usar JsonRpcProvider para lectura (más rápido y no depende de la wallet)
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
            const provider = new JsonRpcProvider(rpcUrl)
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS
            if (!ecommerceAddress) return

            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            let allProducts = []
            try {
                allProducts = await contract.getAllProducts()
            } catch (e) {
                console.error('Error fetching all products:', e)
                allProducts = []
            }

            const activeProducts = allProducts
                .filter((p: any) => p.isActive)
                .map((p: any) => ({
                    id: Number(p.productId),
                    companyId: Number(p.companyId),
                    name: p.name,
                    description: p.description,
                    price: Number(p.price) / 1e6,
                    stock: Number(p.stock),
                    image: p.ipfsImageHash || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2899&auto=format&fit=crop'
                }))

            setProducts(activeProducts)

            // Fetch cart count
            if (window.ethereum) {
                try {
                    const userProvider = new BrowserProvider(window.ethereum as any)
                    const userSigner = await userProvider.getSigner()
                    const userAddress = await userSigner.getAddress()
                    const userContract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

                    try {
                        const cartItems = await userContract.getCart(userAddress)
                        const totalItems = cartItems.reduce((acc: number, item: any) => acc + Number(item.quantity), 0)
                        setCartCount(totalItems)
                    } catch (e) {
                        console.log('Could not fetch cart count:', e)
                        setCartCount(0)
                    }
                } catch (err) {
                    console.log('Could not fetch cart count')
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleAddToCart = async (productId: number) => {
        if (!window.ethereum) return
        setStatus({ message: 'Añadiendo al carrito...', type: 'info' })
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            const tx = await contract.addToCart(productId, 1)
            await tx.wait()

            // Actualizar el contador del carrito
            const userAddress = await signer.getAddress()
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
            const rpcProvider = new JsonRpcProvider(rpcUrl)
            const rpcContract = new Contract(ecommerceAddress, ECOMMERCE_ABI, rpcProvider)
            const cartItems = await rpcContract.getCart(userAddress)
            const totalItems = cartItems.reduce((acc: number, item: any) => acc + Number(item.quantity), 0)
            setCartCount(totalItems)

            setStatus({ message: '¡Añadido al carrito!', type: 'success' })
            setTimeout(() => setStatus({ message: '', type: '' }), 3000)
        } catch (error: any) {
            setStatus({ message: `Error: ${error.message}`, type: 'error' })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header profesional con carrito */}
            <div className="sticky top-0 z-50 bg-white shadow-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">E-Commerce</h1>
                    </div>
                    <Link href="/cart">
                        <button className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                            <span>Carrito</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Catálogo de Productos</h2>
                        <p className="text-slate-500 text-lg">Descubre productos únicos de vendedores verificados.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">
                            {products.length} productos
                        </span>
                    </div>
                </div>

                {status.message && (
                    <div className={`mb-8 p-4 rounded-2xl text-center font-bold animate-bounce text-lg ${status.type === 'success' ? 'bg-green-100 text-green-700' :
                        status.type === 'error' ? 'bg-red-100 text-red-700' :
                            'bg-indigo-100 text-indigo-700'
                        }`}>
                        {status.message}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-96 bg-slate-100 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-slate-100 rounded-[3rem] border border-dashed border-slate-300">
                        <span className="text-6xl mb-4 block">📦</span>
                        <h3 className="text-xl font-bold text-slate-700">No hay productos todavía</h3>
                        <p className="text-slate-500 mt-2">Pronto tendremos novedades para ti.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="group">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-md hover:shadow-2xl transition-all duration-300">
                                    <img
                                        src={product.image.startsWith('http') ? product.image : 'https://ipfs.io/ipfs/' + product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${product.stock > 0 ? 'bg-green-500/90 text-white' : 'bg-rose-500/90 text-white'} backdrop-blur-md shadow-lg`}>
                                            {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-b-[1.75rem] -mt-2 relative z-10">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Precio</p>
                                            <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                €{product.price.toFixed(2)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(product.id)}
                                            disabled={product.stock === 0}
                                            className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl flex items-center justify-center transition-all duration-300 disabled:from-slate-200 disabled:to-slate-300 disabled:cursor-not-allowed active:scale-90 shadow-lg hover:shadow-xl"
                                            title={product.name}
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4l-3.87 7H8.53L4.27 2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
