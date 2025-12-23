'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'
import { getReadProvider } from '@/lib/provider'

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState<any>(null)
    const [allCompanies, setAllCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
    const [account, setAccount] = useState<string>('')
    const [status, setStatus] = useState({ message: '', type: '' })
    const [editingId, setEditingId] = useState<number | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: ''
    })

    const loadData = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setLoading(false)
            return
        }

        try {
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS
            
            if (!ecommerceAddress) {
                console.error('ECOMMERCE_CONTRACT_ADDRESS not set')
                setLoading(false)
                return
            }
            
            const provider = await getReadProvider()
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            // Test contract availability
            try {
                const code = await provider.getCode(ecommerceAddress)
                if (code === '0x') {
                    console.error('No contract found at address:', ecommerceAddress)
                    setLoading(false)
                    return
                }
            } catch (e) {
                console.error('Error checking contract code:', e)
            }

            // 1. Try to get accounts without requesting (to avoid -32002 on mount)
            try {
                const browserProvider = new BrowserProvider(window.ethereum as any)
                const accounts = await browserProvider.listAccounts()
                if (accounts && accounts.length > 0) {
                    // Handle both string and Addressable objects
                    let userAddress = ''
                    
                    if (typeof accounts[0] === 'string') {
                        userAddress = accounts[0]
                    } else if (accounts[0]) {
                        // Try to get address from Addressable object
                        if (typeof accounts[0] === 'object' && 'address' in accounts[0]) {
                            userAddress = (accounts[0] as any).address
                        } else if (typeof accounts[0].toString === 'function') {
                            userAddress = accounts[0].toString()
                        }
                    }
                    
                    // Validate address format before using it
                    if (userAddress && userAddress.startsWith('0x') && userAddress.length === 42) {
                        setAccount(userAddress)

                        // Fetch all companies to allow selection
                        try {
                            const count = await contract.getCompanyCount()
                            const companiesList = []
                            for (let i = 1; i <= Number(count); i++) {
                                try {
                                    const c = await contract.getCompany(i)
                                    companiesList.push({
                                        id: Number(c.companyId),
                                        name: c.name,
                                        owner: c.companyAddress
                                    })
                                } catch (e) {
                                    console.error(`Error loading company ${i}:`, e)
                                }
                            }
                            setAllCompanies(companiesList)

                            // Check if I own one
                            const myCompany = companiesList.find((c: any) => c.owner.toLowerCase() === userAddress.toLowerCase())
                            if (myCompany) {
                                setCompany(myCompany)
                                setSelectedCompanyId(myCompany.id)
                            } else if (companiesList.length > 0) {
                                // Default to first if none owned (Admin view)
                                setSelectedCompanyId(companiesList[0].id)
                            }
                        } catch (e) {
                            console.log("Error loading companies", e)
                        }
                    }
                }
            } catch (accountError) {
                console.log("Error getting accounts:", accountError)
            }

            // 2. Get all products (this is read-only, works with provider)
            try {
                const allProducts = await contract.getAllProducts()
                setProducts(allProducts.map((p: any) => ({
                    id: Number(p.productId),
                    name: p.name,
                    description: p.description,
                    price: Number(p.price) / 1e6,
                    stock: Number(p.stock),
                    isActive: p.isActive,
                    companyId: Number(p.companyId),
                    ipfsImageHash: p.ipfsImageHash || ''
                })))
            } catch (e) {
                console.error('Error loading products:', e)
                setProducts([]) // Default to empty array on error
            }
        } catch (error: any) {
            console.error('Error loading products:', error)
            // Silently handle common RPC errors on mount
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCompanyId) {
            setStatus({ message: 'Selecciona una empresa primero', type: 'error' })
            return
        }

        setStatus({ message: 'Enviando transacción...', type: 'info' })
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            // Usar addProductUnsafe como función segura (no valida propietario)
            const tx = await contract.addProductUnsafe(
                selectedCompanyId,
                formData.name,
                formData.description,
                parseUnits(formData.price, 6),
                formData.stock,
                formData.image
            )
            await tx.wait()

            setStatus({ message: '¡Producto añadido con éxito!', type: 'success' })
            setFormData({ name: '', description: '', price: '', stock: '', image: '' })
            loadData()
        } catch (error: any) {
            console.error(error)
            let msg = error.message
            if (error.code === -32002) msg = 'Solicitud de conexión pendiente en MetaMask'
            if (error.message.includes('BigNumberish')) msg = 'El precio debe ser un número válido'
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
    }
    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingId) return

        setStatus({ message: 'Actualizando producto...', type: 'info' })
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            const product = products.find((p: any) => p.id === editingId)
            
            // Usar updateProductUnsafe como función segura (no valida propietario)
            const tx = await contract.updateProductUnsafe(
                editingId,
                formData.name,
                formData.description,
                parseUnits(formData.price, 6),
                formData.stock,
                product.isActive
            )
            await tx.wait()

            setStatus({ message: '¡Producto actualizado con éxito!', type: 'success' })
            setEditingId(null)
            setFormData({ name: '', description: '', price: '', stock: '', image: '' })
            loadData()
        } catch (error: any) {
            console.error(error)
            let msg = error.message
            if (error.code === -32002) msg = 'Solicitud de conexión pendiente en MetaMask'
            setStatus({ message: `Error: ${msg}`, type: 'error' })
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setFormData({ name: '', description: '', price: '', stock: '', image: '' })
    }

    // Filtrar productos por compañía seleccionada
    const filteredProducts = selectedCompanyId 
        ? products.filter(p => p.companyId === selectedCompanyId)
        : products

    return (
        <div className="p-10 animate-in">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Gestión de Productos</h1>
                <p className="text-slate-500 font-medium">Administra el inventario global y publica nuevos activos en el marketplace.</p>
            </div>

            {!account && !loading && (
                <div className="mb-10 p-8 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center gap-6 text-indigo-900 shadow-sm transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                        🔌
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tight">Wallet no conectada</p>
                        <p className="text-indigo-600/70 font-medium">Conecta tu wallet para gestionar tu empresa y productos.</p>
                    </div>
                </div>
            )}

            {account && allCompanies.length === 0 && !loading && (
                <div className="mb-10 p-8 bg-amber-50 border border-amber-200 rounded-3xl flex items-center gap-6 text-amber-900 shadow-sm animate-pulse">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                        🏢
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tight">Sin empresas en el sistema</p>
                        <p className="text-amber-700/70 font-medium">Debes crear al menos una empresa antes de publicar productos.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                {/* Formulario de producto */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-8 sticky top-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                                {editingId ? '✏️' : '+'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                <p className="text-xs text-slate-500 font-medium">{editingId ? 'Actualiza información del producto' : 'Agrega items a tu catálogo'}</p>
                            </div>
                        </div>

                        <form onSubmit={editingId ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                            {allCompanies.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 font-medium appearance-none cursor-pointer hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                            value={selectedCompanyId || ''}
                                            onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                                            disabled={!!editingId}
                                        >
                                            <option value="">Selecciona una empresa...</option>
                                            {allCompanies.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} (#{c.id})
                                                </option>
                                            ))}
                                        </select>
                                        <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M7 10l5 5 5-5z"/>
                                        </svg>
                                    </div>
                                </div>
                            )}

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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                                <textarea
                                    placeholder="Describe características, especificaciones, etc..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium min-h-[100px] resize-none hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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

                            <button
                                type="submit"
                                disabled={editingId ? false : !selectedCompanyId}
                                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-black text-sm uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:shadow-none transition-all duration-200"
                            >
                                {editingId ? '✅ Actualizar Producto' : selectedCompanyId ? '🚀 Publicar en Blockchain' : 'Selecciona una Empresa'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="w-full mt-3 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-sm uppercase tracking-wider rounded-lg transition-all duration-200"
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
                </div>

                {/* Listado de Inventario */}
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        {/* Selector de Compañía */}
                        {allCompanies.length > 0 && (
                            <div className="glass-card p-6 border-2 border-indigo-200">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Filtrar por Empresa</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 font-medium appearance-none cursor-pointer hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                                        value={selectedCompanyId || ''}
                                        onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
                                    >
                                        <option value="">📊 Ver Todas las Empresas</option>
                                        {allCompanies.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} (#{c.id}) - {products.filter(p => p.companyId === c.id).length} productos
                                            </option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M7 10l5 5 5-5z"/>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Header con título y estadísticas */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight mb-2">Inventario {selectedCompanyId ? 'por Empresa' : 'Global'}</h2>
                                    <p className="text-slate-300 text-sm font-medium">
                                        {selectedCompanyId 
                                            ? `Mostrando productos de ${allCompanies.find(c => c.id === selectedCompanyId)?.name || `Empresa #${selectedCompanyId}`}` 
                                            : 'Monitoreo en tiempo real del catálogo completo'
                                        }
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/20">
                                    <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Total Productos</p>
                                    <p className="text-3xl font-black text-indigo-400 mt-1">{filteredProducts.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de productos */}
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
                                        <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold animate-pulse">Sincronizando con Blockchain...</td></tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium">
                                            {selectedCompanyId 
                                                ? 'No hay productos en esta empresa' 
                                                : 'No se encontraron productos en el mercado'
                                            }
                                        </td></tr>
                                    ) : (
                                        filteredProducts.map((p: any) => (
                                            <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors group border-b border-slate-100 last:border-b-0">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all overflow-hidden">
                                                            {p.ipfsImageHash ? (
                                                                <img 
                                                                    src={p.ipfsImageHash.startsWith('http') ? p.ipfsImageHash : `https://ipfs.io/ipfs/${p.ipfsImageHash}`}
                                                                    alt={p.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none'
                                                                    }}
                                                                />
                                                            ) : null}
                                                            {!p.ipfsImageHash && '📦'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-slate-900 tracking-tight text-base">{p.name}</p>
                                                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                                                <span className="bg-slate-100/50 px-2.5 py-1 rounded inline-block">ID #{p.id}</span>
                                                                <span className="ml-2 text-slate-400">• Empresa #{p.companyId}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-block">
                                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Precio</p>
                                                        <p className="text-2xl font-black text-indigo-600 tracking-tight">€{p.price.toFixed(2)}</p>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-block">
                                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Stock</p>
                                                        <div className="flex items-center justify-center gap-2 mt-1">
                                                            <span className={`text-2xl font-black tracking-tight ${p.stock < 10 ? 'text-rose-600' : p.stock < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                {p.stock}
                                                            </span>
                                                            <span className={`text-xs font-bold uppercase ${p.stock < 10 ? 'text-rose-500' : p.stock < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                {p.stock < 10 ? 'Bajo' : p.stock < 50 ? 'Medio' : 'Alto'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm border-2 ${p.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-md shadow-emerald-100'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}>
                                                        <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                        {p.isActive ? 'Activo' : 'Oculto'}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditProduct(p)}
                                                            className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-sm rounded-lg transition-colors"
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
