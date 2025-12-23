'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers'
import { usePathname } from 'next/navigation'
import { ECOMMERCE_ABI } from '@/lib/contractABI'

export default function Header() {
    const [account, setAccount] = useState('')
    const [cartCount, setCartCount] = useState(0)
    const pathname = usePathname()

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new BrowserProvider(window.ethereum as any)
                // Request account access
                await provider.send('eth_requestAccounts', [])
                
                // Get the accounts
                const accounts = await provider.listAccounts()
                if (accounts && accounts.length > 0) {
                    const userAddress = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].toString()
                    setAccount(userAddress)
                    updateCartCount(userAddress)
                }
            } catch (err) {
                console.error(err)
            }
        }
    }

    const updateCartCount = async (address: string) => {
        try {
            const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
            const provider = new JsonRpcProvider(rpcUrl)
            const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS
            if (!ecommerceAddress) return

            const contract = new Contract(ecommerceAddress, ECOMMERCE_ABI, provider)
            const cartItems = await contract.getCart(address)
            const totalItems = cartItems.reduce((acc: number, item: any) => acc + Number(item.quantity), 0)
            setCartCount(totalItems)
        } catch (err) {
            console.log('Could not fetch cart count')
        }
    }

    useEffect(() => {
        const initializeWallet = async () => {
            if (typeof window.ethereum === 'undefined') {
                console.log('MetaMask not available')
                return
            }

            try {
                // Method 1: Try listAccounts (ethers v6)
                const provider = new BrowserProvider(window.ethereum as any)
                const accounts = await provider.listAccounts()
                
                if (accounts && accounts.length > 0) {
                    // listAccounts returns Addressable objects, get the address string
                    let accountAddress = ''
                    
                    if (typeof accounts[0] === 'string') {
                        accountAddress = accounts[0]
                    } else if (accounts[0]) {
                        // Try to get address from Addressable object
                        if (typeof accounts[0] === 'object' && 'address' in accounts[0]) {
                            accountAddress = (accounts[0] as any).address
                        } else if (typeof accounts[0].toString === 'function') {
                            accountAddress = accounts[0].toString()
                        }
                    }
                    
                    // Validate address format
                    if (accountAddress && accountAddress.startsWith('0x') && accountAddress.length === 42) {
                        setAccount(accountAddress)
                        await updateCartCount(accountAddress)
                    }
                }
            } catch (error) {
                console.error('Error initializing wallet with listAccounts:', error)
                
                // Fallback: Method 2: Direct eth_accounts call
                try {
                    const accounts = await (window.ethereum as any).request({ 
                        method: 'eth_accounts' 
                    })
                    if (Array.isArray(accounts) && accounts.length > 0) {
                        const accountAddress = accounts[0]
                        // Validate address format
                        if (accountAddress && accountAddress.startsWith('0x') && accountAddress.length === 42) {
                            setAccount(accountAddress)
                            await updateCartCount(accountAddress)
                        }
                    }
                } catch (fallbackError) {
                    console.error('Fallback method also failed:', fallbackError)
                }
            }
        }

        initializeWallet()

        // Setup event listeners
        if (typeof window.ethereum === 'undefined') return

        const handleAccountsChanged = (accounts: string[]) => {
            if (Array.isArray(accounts) && accounts.length > 0) {
                const accountAddress = accounts[0]
                // Validate address format
                if (accountAddress && accountAddress.startsWith('0x') && accountAddress.length === 42) {
                    setAccount(accountAddress)
                    updateCartCount(accountAddress)
                }
            } else {
                setAccount('')
                setCartCount(0)
            }
        }

        const handleChainChanged = () => {
            // Reload on chain change
            window.location.reload()
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)

        return () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
                    window.ethereum.removeListener('chainChanged', handleChainChanged)
                } catch (e) {
                    console.error('Error removing listeners:', e)
                }
            }
        }
    }, [])

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto h-20 px-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                    </div>
                    <span className="text-2xl font-black text-slate-900">E-Commerce</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    <NavLink href="/products" active={pathname === '/products'}>Productos</NavLink>
                    <NavLink href="/orders" active={pathname === '/orders'}>Mis Pedidos</NavLink>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/cart" className="relative flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-indigo-600 transition-all group">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-110 transition-transform">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {!account ? (
                        <button
                            onClick={connectWallet}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all active:scale-95"
                        >
                            Conectar Wallet
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Conectado</p>
                                <p className="text-xs font-mono text-slate-700">{account.slice(0, 6)}...{account.slice(-4)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
    return (
        <Link
            href={href}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${active ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
        >
            {children}
        </Link>
    )
}
