import { useState, useEffect, useCallback } from 'react'
import { formatEther } from 'ethers'

interface WalletConnectProps {
  account: string
  setAccount: (account: string) => void
}

const ANVIL_CHAIN_ID = '31337'
const HEX_ANVIL_CHAIN_ID = '0x7a69' // 31337 in hex

export default function WalletConnect({ account, setAccount }: WalletConnectProps) {
  const [balance, setBalance] = useState<string>('0')
  const [chainId, setChainId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const updateBalance = useCallback(async (address: string) => {
    if (typeof window.ethereum !== 'undefined' && address) {
      try {
        const ethereum = window.ethereum as any
        // Direct RPC call for balance
        const balanceHex = await ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
        const balanceBigInt = BigInt(balanceHex)
        setBalance(parseFloat(formatEther(balanceBigInt)).toFixed(4))

        // Direct RPC call for Chain ID
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' })
        setChainId(BigInt(chainIdHex).toString())

      } catch (error) {
        console.error('Error fetching wallet data:', error)
      }
    }
  }, [])

  const switchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return

    try {
      const ethereum = window.ethereum as any
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HEX_ANVIL_CHAIN_ID }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          const ethereum = window.ethereum as any
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HEX_ANVIL_CHAIN_ID,
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
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true)
        const ethereum = window.ethereum as any
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

        if (accounts.length > 0) {
          setAccount(accounts[0])
          await updateBalance(accounts[0])
        }
      } catch (error) {
        console.error('Error connecting wallet:', error)
      } finally {
        setLoading(false)
      }
    } else {
      alert('Por favor instala MetaMask')
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const ethereum = window.ethereum as any
          const accounts = await ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            setAccount(accounts[0])
            await updateBalance(accounts[0])
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }

    checkConnection()

    if (typeof window.ethereum !== 'undefined') {
      const ethereum = window.ethereum as any
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          updateBalance(accounts[0])
        } else {
          setAccount('')
          setBalance('0')
          setChainId('')
        }
      }

      const handleChainChanged = () => {
        window.location.reload()
      }

      ethereum.on('accountsChanged', handleAccountsChanged)
      ethereum.on('chainChanged', handleChainChanged)

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged)
        ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [setAccount, updateBalance])

  const isWrongNetwork = chainId && chainId !== ANVIL_CHAIN_ID

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Tu Wallet</h2>
        {account && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {!account ? (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-xl">🦊</span>
              Conectar MetaMask
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dirección Conectada</p>
            <p className="font-mono text-sm text-indigo-300 break-all">{account}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Balance de Red</p>
              <p className="font-mono text-2xl font-black text-white">{balance} <span className="text-sm font-normal text-slate-400">ETH</span></p>

              {chainId && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-slate-500 font-mono">
                    Chain ID: {chainId}
                    {isWrongNetwork && <span className="text-red-400 font-bold ml-1">(Incorrecto)</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-2xl">
              <span className="text-indigo-400">Ξ</span>
            </div>
          </div>

          {isWrongNetwork && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              <p className="text-amber-200 text-sm mb-3">
                ⚠️ Estás conectado a la red incorrecta. Por favor conecta a Anvil Localhost (31337).
              </p>
              <button
                onClick={switchNetwork}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Cambiar a Localhost
              </button>
            </div>
          )}

          <button
            onClick={() => setAccount('')}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors py-2"
          >
            Desconectar cuenta
          </button>
        </div>
      )}
    </div>
  )
}
