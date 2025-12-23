'use client'

import { useState, useEffect, use } from 'react'
import { BrowserProvider, Contract, parseUnits } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function ProductsReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const companyId = parseInt(id)
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState({ message: '', type: '' })
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: ''
    })

    const loadProducts = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setLoading(false)
            return
        }

        try {
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
            const provider = new BrowserProvider(window.ethereum as any)
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

            // Filtrar productos por companyId
            const companyProducts = allProducts
                .filter((p: any) => Number(p.companyId) === companyId)
                .map((p: any) => ({
                    id: Number(p.productId),
                    companyId: Number(p.companyId),
                    name: p.name,
                    description: p.description,
                    price: Number(p.price) / 1e6, // Convertir de wei a euros (6 decimales)
                    stock: Number(p.stock),
                    ipfsImageHash: p.ipfsImageHash || '',
                    isActive: p.isActive
                }))

            setProducts(companyProducts)
        } catch (error) {
            console.error('Error loading products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!window.ethereum) {
            setStatus({ message: 'MetaMask no disponible', type: 'error' })
            return
        }

        setStatus({ message: 'Procesando transacción...', type: 'info' })
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            // Convertir precio a centavos de euro (6 decimals)
            const priceInCents = parseUnits(formData.price, 6)

            // Usar addProductUnsafe como función segura (no valida propietario)
            const tx = await contract.addProductUnsafe(
                companyId,
                formData.name,
                formData.description,
                priceInCents,
                parseInt(formData.stock),
                formData.image || 'QmDefault'
            )
            
            await tx.wait()

            setStatus({ message: '¡Producto agregado exitosamente!', type: 'success' })
            setFormData({ name: '', description: '', price: '', stock: '', image: '' })
            setShowForm(false)
            loadProducts()
        } catch (error: any) {
            let msg = error.message
            if (error.message.includes('user rejected')) msg = 'Transacción rechazada por el usuario'
            setStatus({ message: `Error: ${msg}`, type: 'error' })
        }
    }

    const handleEditProduct = (product: any) => {
        setEditingId(product.id)
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            stock: product.stock.toString(),
            image: product.ipfsImageHash || ''
        })
        setShowForm(true)
    }

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingId || !window.ethereum) return

        setStatus({ message: 'Actualizando producto...', type: 'info' })
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            const product = products.find((p: any) => p.id === editingId)
            const priceInCents = parseUnits(formData.price, 6)
            
            const tx = await contract.updateProduct(
                editingId,
                formData.name,
                formData.description,
                priceInCents,
                parseInt(formData.stock),
                product.isActive
            )
            await tx.wait()

            setStatus({ message: '¡Producto actualizado con éxito!', type: 'success' })
            setEditingId(null)
            setFormData({ name: '', description: '', price: '', stock: '', image: '' })
            setShowForm(false)
            loadProducts()
        } catch (error: any) {
            let msg = error.message
            if (error.message.includes('user rejected')) msg = 'Transacción rechazada por el usuario'
            setStatus({ message: `Error: ${msg}`, type: 'error' })
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setFormData({ name: '', description: '', price: '', stock: '', image: '' })
        setShowForm(false)
    }

    useEffect(() => {
        loadProducts()
    }, [id])

    return (
        <div className="space-y-8">
            {/* Header con botón */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">Reporte de Productos</h2>
                    <p className="text-slate-500 text-sm">Empresa #{companyId}</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200"
                >
                    {showForm ? '✕ Cancelar' : '+ Agregar Producto'}
                </button>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="glass-card p-8 border-2 border-indigo-200">
                    <h3 className="text-xl font-black text-slate-900 mb-6">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <form onSubmit={editingId ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Producto</label>
                                <input
                                    type="text"
                                    placeholder="ej: Laptop Pro 15"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio (€)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-600 font-bold">€</span>
                                    <input
                                        type="number"
                                        placeholder="99.99"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full pl-8 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                            <textarea
                                placeholder="Describe características, especificaciones, etc..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium min-h-[100px] resize-none hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">un.</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL o IPFS Hash (Imagen)</label>
                                <input
                                    type="text"
                                    placeholder="QmXxxx o https://..."
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200"
                        >
                            {editingId ? '✅ Actualizar Producto' : '🚀 Publicar en Blockchain'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="w-full px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-sm uppercase tracking-wider rounded-lg transition-all duration-200"
                            >
                                ✕ Cancelar
                            </button>
                        )}
                    </form>

                    {status.message && (
                        <div className={`mt-6 p-4 rounded-xl text-sm font-bold text-center border-2 animate-in ${status.type === 'success' ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200' :
                            status.type === 'info' ? 'bg-indigo-50/50 text-indigo-700 border-indigo-200' :
                                'bg-rose-50/50 text-rose-700 border-rose-200'
                            }`}>
                            {status.message}
                        </div>
                    )}
                </div>
            )}

            {/* Tabla de productos */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight mb-2">Productos de la Empresa</h3>
                        <p className="text-slate-300 text-sm font-medium">Listado de todos los productos publicados</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
                        <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Total</p>
                        <p className="text-3xl font-black text-indigo-400 mt-1">{products.length}</p>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                                <th className="p-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Producto</th>
                                <th className="p-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Precio</th>
                                <th className="p-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Stock</th>
                                <th className="p-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Estado</th>
                                <th className="p-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold animate-pulse">Cargando productos...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No hay productos registrados</td></tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-indigo-50/40 transition-colors group border-b border-slate-100 last:border-b-0">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all overflow-hidden">
                                                    {product.ipfsImageHash ? (
                                                        <img 
                                                            src={product.ipfsImageHash.startsWith('http') ? product.ipfsImageHash : `https://ipfs.io/ipfs/${product.ipfsImageHash}`}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none'
                                                            }}
                                                        />
                                                    ) : null}
                                                    {!product.ipfsImageHash && '📦'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-900 tracking-tight text-base">{product.name}</p>
                                                    <p className="text-xs text-slate-500 font-semibold mt-1 line-clamp-1">{product.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="inline-block">
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Precio</p>
                                                <p className="text-2xl font-black text-indigo-600 tracking-tight">€{product.price.toFixed(2)}</p>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="inline-block">
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Stock</p>
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                    <span className={`text-2xl font-black tracking-tight ${product.stock < 10 ? 'text-rose-600' : product.stock < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {product.stock}
                                                    </span>
                                                    <span className={`text-xs font-bold uppercase ${product.stock < 10 ? 'text-rose-500' : product.stock < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {product.stock < 10 ? 'Bajo' : product.stock < 50 ? 'Medio' : 'Alto'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm border-2 ${product.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-md shadow-emerald-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                {product.isActive ? 'Activo' : 'Oculto'}
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button 
                                                onClick={() => handleEditProduct(product)}
                                                className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-sm rounded-lg transition-colors"
                                            >
                                                ✏️ Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
