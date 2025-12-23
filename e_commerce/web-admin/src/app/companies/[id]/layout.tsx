'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { BrowserProvider, Contract } from 'ethers'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function CompanyLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCompany = async () => {
            if (!window.ethereum) return
            try {
                const provider = new BrowserProvider(window.ethereum as any)
                const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS
                if (!ecommerceAddress) return

                const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)
                const companyData = await contract.getCompany(parseInt(id))
                setCompany({
                    id: Number(companyData.companyId),
                    name: companyData.name,
                    description: companyData.description,
                    owner: companyData.companyAddress,
                    taxId: companyData.taxId,
                    isActive: companyData.isActive
                })
            } catch (error) {
                console.error('Error fetching company:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCompany()
    }, [id])

    return (
        <div className="p-8">
            {/* Header con información de la empresa */}
            <div className="mb-8">
                <Link 
                    href="/companies" 
                    className="text-indigo-600 hover:text-indigo-700 font-semibold mb-4 inline-flex items-center gap-2"
                >
                    ← Volver a Empresas
                </Link>
                
                {loading ? (
                    <div className="animate-pulse h-12 bg-slate-200 rounded-lg w-1/3 mt-4"></div>
                ) : company ? (
                    <div className="glass-card p-6 mt-4">
                        <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
                        <p className="text-slate-500 mt-2">{company.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">ID</p>
                                <p className="text-lg font-bold text-slate-800">#{company.id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Tax ID</p>
                                <p className="text-sm font-mono text-slate-800">{company.taxId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Estado</p>
                                <p className={`text-sm font-bold ${company.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {company.isActive ? 'Activa' : 'Inactiva'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Owner</p>
                                <p className="text-xs font-mono text-slate-600">{company.owner.slice(0, 6)}...{company.owner.slice(-4)}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-red-600">Empresa no encontrada</p>
                )}
            </div>

            {/* Tabs de navegación */}
            <div className="flex gap-2 mb-8 bg-gradient-to-r from-slate-50 to-slate-100 p-1.5 rounded-xl border border-slate-200">
                <Link 
                    href={`/companies/${id}/products`}
                    className="flex items-center gap-2 px-4 py-2.5 font-semibold text-slate-600 hover:text-slate-900 bg-white rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200"
                >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-2-.9-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9-2h16V6H4v10z"/>
                    </svg>
                    Productos
                </Link>
                <Link 
                    href={`/companies/${id}/invoices`}
                    className="flex items-center gap-2 px-4 py-2.5 font-semibold text-slate-600 hover:text-slate-900 bg-white rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all duration-200"
                >
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.16-2.66c-.44-.53-1.25-.53-1.69 0-.44.54-.44 1.39 0 1.93l3 3.67c.42.53 1.25.53 1.67 0l4.08-5.15c.44-.54.44-1.39 0-1.93-.44-.53-1.25-.53-1.69 0z"/>
                    </svg>
                    Facturas
                </Link>
                <Link 
                    href={`/companies/${id}/customers`}
                    className="flex items-center gap-2 px-4 py-2.5 font-semibold text-slate-600 hover:text-slate-900 bg-white rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all duration-200"
                >
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.89 1.97 1.74 1.97 2.95V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                    Clientes
                </Link>
            </div>

            {/* Contenido */}
            {children}
        </div>
    )
}
