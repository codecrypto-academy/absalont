'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider } from 'ethers'

interface WalletConnectProps {
  account: string
  setAccount: (account: string) => void
}

export default function WalletConnect({ account, setAccount }: WalletConnectProps) {
  const [balance, setBalance] = useState<string>('0')

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        setAccount(accounts[0])
        
        // Get ETH balance
        const balance = await provider.getBalance(accounts[0])
        setBalance((Number(balance) / 1e18).toFixed(4))
      } catch (error) {
        console.error('Error connecting wallet:', error)
        alert('Error al conectar wallet')
      }
    } else {
      alert('Por favor instala MetaMask')
    }
  }

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        }
      })
    }
  }, [setAccount])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Wallet</h2>
      
      {!account ? (
        <button
          onClick={connectWallet}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Conectar MetaMask
        </button>
      ) : (
        <div className="space-y-2">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Dirección:</p>
            <p className="font-mono text-sm">{account}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Balance ETH:</p>
            <p className="font-mono text-lg font-bold">{balance} ETH</p>
          </div>
        </div>
      )}
    </div>
  )
}
