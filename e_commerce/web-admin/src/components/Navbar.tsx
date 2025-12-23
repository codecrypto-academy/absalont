'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, formatUnits } from 'ethers'

const ANVIL_CHAIN_ID = '31337' // Decimal string for safer comparison

export default function Navbar() {
    const [account, setAccount] = useState('')
    const [balance, setBalance] = useState('')
    const [chainId, setChainId] = useState('')

    const loadBalance = async (account: string) => {
        try {
            if (!account || !account.startsWith('0x') || account.length !== 42) {
                setBalance('0')
                return
            }

            if (typeof window.ethereum !== 'undefined') {
                const provider = new BrowserProvider(window.ethereum as any)
                const balance = await provider.getBalance(account)
                setBalance(formatUnits(balance, 18))
            }
        } catch (error) {
            console.error('Error loading balance:', error)
            setBalance('0')
        }
    }

    const switchNetwork = async () => {
        if (typeof window.ethereum === 'undefined') return

        try {
            // Hex value for 31337 is 0x7a69. Switch requires Hex.
            const hexChainId = '0x7a69'
            await (window.ethereum as any).request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            })
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                try {
                    await (window.ethereum as any).request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0x7a69',
                                chainName: 'Anvil Localhost',
                                rpcUrls: ['http://127.0.0.1:8545'],
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                            },
                        ],
                    })
                } catch (addError) {
                    console.error('Error adding network:', addError)
                }
            } else {
                console.error('Error switching network:', switchError)
            }
        }
    }

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask no instalado')
            return
        }

        try {
            const provider = new BrowserProvider(window.ethereum as any)
            await provider.send('eth_requestAccounts', [])
            const accounts = await provider.listAccounts()
            if (accounts.length > 0) {
                setAccount(accounts[0].address)
                await loadBalance(accounts[0].address)
            }
        } catch (error) {
            console.error('Error connecting wallet:', error)
        }
    }

    useEffect(() => {
        const checkNetwork = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const id = await (window.ethereum as any).request({ method: 'eth_chainId' })
                    // Convert Hex to Decimal String (e.g. 0x7a69 -> 31337) to match our constant
                    if (id) {
                        setChainId(BigInt(id).toString())
                    }
                } catch (e) {
                    console.error('Error checking chain ID:', e)
                }
            }
        }

        const initializeWallet = async () => {
            if (typeof window.ethereum === 'undefined') return

            await checkNetwork()

            try {
                const provider = new BrowserProvider(window.ethereum as any)
                const accounts = await provider.listAccounts()

                if (accounts.length > 0) {
                    setAccount(accounts[0].address)
                    await loadBalance(accounts[0].address)
                }
            } catch (error) {
                console.error('Error initializing wallet:', error)
            }
        }

        initializeWallet()

        if (typeof window.ethereum !== 'undefined') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0])
                    loadBalance(accounts[0])
                } else {
                    setAccount('')
                    setBalance('')
                }
            }

            const handleChainChanged = (newChainId: string) => {
                // Determine logic could be added here, but simple reload is safest
                window.location.reload()
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', handleChainChanged)

            return () => {
                try {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
                    window.ethereum.removeListener('chainChanged', handleChainChanged)
                } catch (e) {
                    // Ignore removal errors
                }
            }
        }
    }, [])

    // Simple robust check: '31337' === '31337'
    const isWrongNetwork = chainId && chainId !== ANVIL_CHAIN_ID

    return (
        <header className="fixed top-0 right-0 left-64 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-40 px-10">
            <div className="h-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Overview</span>
                </div>

                <div className="flex items-center gap-8">
                    {account && isWrongNetwork && (
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                ID: {chainId}
                            </div>
                            <button
                                onClick={switchNetwork}
                                className="bg-amber-100 text-amber-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors"
                            >
                                ⚠️ Red Incorrecta - Cambiar
                            </button>
                        </div>
                    )}

                    {account && !isWrongNetwork && (
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Admin Balance</span>
                            <span className="text-lg font-black text-slate-900 tracking-tight">
                                {balance ? Number(balance).toFixed(4) : '0.0000'}
                                <span className="text-indigo-600 ml-1">ETH</span>
                            </span>
                        </div>
                    )}

                    {!account ? (
                        <button
                            onClick={connectWallet}
                            className="btn-primary !py-2.5 !px-8 text-sm"
                        >
                            Conectar Wallet
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-2 pr-5 rounded-2xl shadow-inner">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg ${isWrongNetwork ? 'bg-amber-500 shadow-amber-500/20' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 shadow-indigo-500/20'}`}>
                                {account.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Admin Connected</p>
                                <p className="text-xs font-bold text-slate-700 font-mono tracking-tight">
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
