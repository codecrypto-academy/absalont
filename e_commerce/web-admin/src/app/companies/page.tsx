'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrowserProvider, Contract } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'
import { getReadProvider } from '@/lib/provider'

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [taxId, setTaxId] = useState('')
    const [account, setAccount] = useState('')
    const [customOwner, setCustomOwner] = useState('')
    const [status, setStatus] = useState({ message: '', type: '' })
    const [contractOwner, setContractOwner] = useState('')

    const fetchCompanies = async () => {
        if (!window.ethereum) return
        try {
            // Get user account
            const browserProvider = new BrowserProvider(window.ethereum as any)
            const accounts = await browserProvider.listAccounts()
            if (accounts && accounts.length > 0) {
                const userAddress = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].toString()
                setAccount(userAddress)
                if (!customOwner) setCustomOwner(userAddress)
            }

            // Use read provider for contract reads
            const provider = await getReadProvider()
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS
            if (!ecommerceAddress) return

            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)

            try {
                const owner = await contract.owner()
                setContractOwner(owner)

                const count = await contract.getCompanyCount()

                const loadedCompanies = []
                for (let i = 1; i <= Number(count); i++) {
                    try {
                        const company = await contract.getCompany(i)
                        loadedCompanies.push({
                            id: Number(company.companyId),
                            name: company.name,
                            description: company.description,
                            owner: company.companyAddress,
                            taxId: company.taxId,
                            isActive: company.isActive
                        })
                    } catch (e) {
                        console.error(`Error loading company ${i}:`, e)
                    }
                }
                setCompanies(loadedCompanies)
            } catch (error: any) {
                console.error('Error calling getCompanyCount:', error)
                // Si falla getCompanyCount, asume que no hay empresas
                setCompanies([])
            }
        } catch (error) {
            console.error('Error fetching companies:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!window.ethereum) return

        setStatus({ message: 'Procesando transacción...', type: 'info' })
        try {
            const provider = new BrowserProvider(window.ethereum as any)
            const signer = await provider.getSigner()
            const currentAccount = await signer.getAddress() // Obtener dirección real actual

            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!
            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

            let tx
            const isDifferentAddress = customOwner && customOwner.toLowerCase() !== currentAccount.toLowerCase()

            if (isDifferentAddress) {
                // Si intenta registrar para OTRO, verificamos si es el admin del contrato
                const ownerOfContract = await contract.owner()
                const isOwner = currentAccount.toLowerCase() === ownerOfContract.toLowerCase()

                if (!isOwner) {
                    throw new Error(`Permiso denegado: Estás conectado con ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}, pero solo el administrador (${ownerOfContract.slice(0, 6)}...${ownerOfContract.slice(-4)}) puede registrar empresas para otros wallets. Por favor, usa tu propia dirección o cambia a la cuenta de administrador en MetaMask.`)
                }
                tx = await contract.registerCompanyFor(name, description, taxId, customOwner)
            } else {
                // Registrar para sí mismo (función pública)
                tx = await contract.registerCompany(name, description, taxId)
            }

            await tx.wait()

            setStatus({ message: '¡Empresa registrada con éxito!', type: 'success' })
            setName('')
            setDescription('')
            setTaxId('')
            fetchCompanies()
        } catch (error: any) {
            console.error('Registration error:', error)
            const errorMessage = error.reason || error.message || 'Error desconocido'
            setStatus({ message: errorMessage, type: 'error' })
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Empresas</h1>
                    <p className="text-slate-500">Registra y administra los vendedores de tu marketplace.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario Lateral */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-6 sticky top-28">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Nueva Empresa</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                                    <span>Dirección de la Empresa (Wallet)</span>
                                    <button
                                        type="button"
                                        onClick={() => setCustomOwner(account)}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-tighter"
                                    >
                                        Usar mi dirección
                                    </button>
                                </label>
                                <input
                                    type="text"
                                    value={customOwner}
                                    onChange={(e) => setCustomOwner(e.target.value)}
                                    placeholder="0x..."
                                    className={`input-field font-mono text-xs ${customOwner && account && contractOwner && customOwner.toLowerCase() !== account.toLowerCase() && account.toLowerCase() !== contractOwner.toLowerCase() ? 'border-amber-300 bg-amber-50' : ''}`}
                                />
                                {customOwner && account && contractOwner && customOwner.toLowerCase() !== account.toLowerCase() && account.toLowerCase() !== contractOwner.toLowerCase() && (
                                    <p className="text-[10px] text-amber-600 mt-1 font-medium italic">⚠️ Requiere cuenta de administrador</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre Comercial</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Tech Solutions S.L."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
                                <textarea
                                    placeholder="Describe tu empresa..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input-field min-h-[100px] py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Identificación Fiscal</label>
                                <input
                                    type="text"
                                    placeholder="Ej: B12345678"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full">
                                Registrar Empresa
                            </button>
                        </form>

                        {status.message && (
                            <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                                status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                {status.message}
                            </div>
                        )}
                    </div>
                </div>

                {/* Listado de empresas */}
                <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reportes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400">Cargando datos de la blockchain...</td></tr>
                                ) : companies.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400">No hay empresas registradas</td></tr>
                                ) : (
                                    companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6 text-sm font-mono text-slate-400">#{company.id}</td>
                                            <td className="p-6">
                                                <p className="font-black text-slate-800 tracking-tight">{company.name}</p>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{company.description}</p>
                                                <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">TAX ID: {company.taxId}</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase">
                                                        {company.owner.slice(2, 4)}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 font-mono tracking-tighter">{company.owner.slice(0, 6)}...{company.owner.slice(-4)}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className={`badge-admin ${company.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {company.isActive ? 'Activa' : 'Inactiva'}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-4">
                                                    {/* Productos */}
                                                    <Link
                                                        href={`/companies/${company.id}/products`}
                                                        className="group relative inline-flex"
                                                        title="Ver Productos"
                                                    >
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center text-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-110 border border-blue-200">
                                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-2-.9-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9-2h16V6H4v10z" />
                                                            </svg>
                                                        </div>
                                                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Productos</span>
                                                    </Link>

                                                    {/* Facturas */}
                                                    <Link
                                                        href={`/companies/${company.id}/invoices`}
                                                        className="group relative inline-flex"
                                                        title="Ver Facturas"
                                                    >
                                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center text-lg hover:from-emerald-100 hover:to-emerald-200 transition-all duration-300 hover:shadow-lg hover:scale-110 border border-emerald-200">
                                                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.16-2.66c-.44-.53-1.25-.53-1.69 0-.44.54-.44 1.39 0 1.93l3 3.67c.42.53 1.25.53 1.67 0l4.08-5.15c.44-.54.44-1.39 0-1.93-.44-.53-1.25-.53-1.69 0z" />
                                                            </svg>
                                                        </div>
                                                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Facturas</span>
                                                    </Link>

                                                    {/* Clientes */}
                                                    <Link
                                                        href={`/companies/${company.id}/customers`}
                                                        className="group relative inline-flex"
                                                        title="Ver Clientes"
                                                    >
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center text-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:shadow-lg hover:scale-110 border border-purple-200">
                                                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.89 1.97 1.74 1.97 2.95V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                                            </svg>
                                                        </div>
                                                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Clientes</span>
                                                    </Link>
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
    )
}
