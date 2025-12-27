'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers'

interface PaymentData {
  merchantAddress: string
  amount: number
  invoiceId: string
  date: string
  redirectUrl: string
  companyId?: number
}

interface PaymentGatewayProps {
  paymentData: PaymentData
}

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() public view returns (uint8)',
]

const ECOMMERCE_ABI = [
  'function processPayment(address customer, uint256 amount, uint256 invoiceId) external',
]

export default function PaymentGateway({ paymentData }: PaymentGatewayProps) {
  const [account, setAccount] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [status, setStatus] = useState<string>('idle')
  const [message, setMessage] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchBalance = async (address: string) => {
    if (!address || typeof window.ethereum === 'undefined') return

    setIsRefreshing(true)
    try {
      const provider = new BrowserProvider(window.ethereum)
      const tokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS
      if (tokenAddress) {
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider)
        const balanceVal = await tokenContract.balanceOf(address)
        const decimals = await tokenContract.decimals()
        setBalance(formatUnits(balanceVal, decimals))
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new BrowserProvider(window.ethereum)
          const accounts = await provider.send('eth_accounts', [])
          if (accounts.length > 0) {
            setAccount(accounts[0])
            // Fetch balance will be triggered by the useEffect below
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          setAccount('')
          setBalance('0')
        }
      })
    }

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => { })
      }
    }
  }, [])

  useEffect(() => {
    if (account) {
      fetchBalance(account)
    }
  }, [account])

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        setAccount(accounts[0])
      } catch (error) {
        console.error('Error connecting wallet:', error)
        setMessage('Error al conectar wallet')
      }
    } else {
      setMessage('Por favor instala MetaMask')
    }
  }

  const processPayment = async () => {
    if (!account) {
      setMessage('Por favor conecta tu wallet')
      return
    }

    setStatus('processing')
    setMessage('Procesando pago...')

    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const tokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS!
      const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer)
      const ecommerceContract = new Contract(ecommerceAddress, ECOMMERCE_ABI, signer)

      // Convertir monto a unidades (6 decimales EUR)
      const amountWei = parseUnits(paymentData.amount.toString(), 6)

      // Verificar balance (refresh first to be safe)
      const balanceRaw = await tokenContract.balanceOf(account)

      const balanceBigInt = BigInt(balanceRaw.toString())
      const amountBigInt = BigInt(amountWei.toString())

      if (balanceBigInt < amountBigInt) {
        throw new Error('Saldo insuficiente')
      }

      // 1. Aprobar gasto de tokens
      setMessage('Aprobando gasto de tokens...')
      const approveTx = await tokenContract.approve(ecommerceAddress, amountWei)
      await approveTx.wait()

      // 2. Procesar pago
      setMessage('Procesando pago...')
      const paymentTx = await ecommerceContract.processPayment(
        account,
        amountWei,
        paymentData.invoiceId
      )
      const receipt = await paymentTx.wait()

      // Update balance after payment
      fetchBalance(account)

      setStatus('success')
      setMessage('¡Pago exitoso!')

      // Redirigir después de 2 segundos
      setTimeout(() => {
        if (paymentData.redirectUrl) {
          window.location.href = `${paymentData.redirectUrl}?status=success&invoice=${paymentData.invoiceId}&tx=${receipt.hash}`
        }
      }, 2000)
    } catch (error: any) {
      console.error('Error processing payment:', error)
      setStatus('error')

      if (error.message.includes('Saldo insuficiente')) {
        setMessage('Saldo insuficiente. Compra más tokens primero.')
      } else if (error.message.includes('user rejected')) {
        setMessage('Transacción cancelada por el usuario')
      } else {
        setMessage(`Error: ${error.message}`)
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mb-6 animate-in fade-in duration-700">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs font-bold tracking-wider">PAGO SEGURO</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in slide-in-from-bottom duration-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Pasarela de Pago</h1>
              <p className="text-indigo-100 text-sm font-medium">Procesamiento seguro en blockchain</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Invoice details */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200/60 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Detalles de la Orden</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-semibold">Comerciante</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-black text-indigo-600">
                      {paymentData.merchantAddress.slice(2, 4).toUpperCase()}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700">{paymentData.merchantAddress.slice(0, 6)}...{paymentData.merchantAddress.slice(-4)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-semibold">Número de Factura</span>
                  <span className="font-black text-slate-800 text-lg">#{paymentData.invoiceId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-semibold">Fecha</span>
                  <span className="text-slate-700 font-bold text-sm">{new Date(paymentData.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="border-t-2 border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-black text-lg uppercase tracking-tight">Total a Pagar</span>
                    <div className="text-right">
                      <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        €{paymentData.amount.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-slate-400 tracking-wider">EUROTOKEN</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet section */}
            {!account ? (
              <button
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg flex items-center justify-center gap-3 group"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="tracking-tight">Conectar MetaMask</span>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Wallet info */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Tu Wallet</span>
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-700 mb-4 break-all">{account}</p>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-100">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balance Disponible</p>
                      <button
                        onClick={() => fetchBalance(account)}
                        disabled={isRefreshing}
                        className={`text-indigo-600 hover:text-indigo-800 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Actualizar balance"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      {isRefreshing ? (
                        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
                      ) : (
                        <>
                          <span className="text-2xl font-black text-slate-800">{parseFloat(balance).toFixed(2)}</span>
                          <span className="text-sm font-bold text-indigo-600">EURT</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Insufficient balance warning */}
                {parseFloat(balance) < paymentData.amount && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-500">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-black">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-900 mb-1">Saldo Insuficiente</p>
                      <p className="text-xs text-amber-700 mb-2">
                        Necesitas {(paymentData.amount - parseFloat(balance)).toFixed(2)} EURT más para completar esta transacción.
                      </p>
                      <a
                        href="http://localhost:6001"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-xs font-black text-amber-900 hover:text-amber-700 underline transition-colors"
                      >
                        <span>Comprar Tokens</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Payment button */}
                {status !== 'success' && (
                  <button
                    onClick={processPayment}
                    disabled={status === 'processing' || parseFloat(balance) < paymentData.amount}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-black py-5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    {status === 'processing' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="tracking-tight">Procesando Pago...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="tracking-tight">Confirmar y Pagar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Status messages */}
            {message && (
              <div
                className={`rounded-2xl p-5 text-center font-bold animate-in fade-in slide-in-from-bottom duration-500 border-2 ${status === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : status === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {status === 'success' && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {status === 'error' && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span className="text-sm tracking-tight">{message}</span>
                </div>

                {/* Return to store button after successful payment */}
                {status === 'success' && (
                  <div className="mt-6 pt-4 border-t-2 border-emerald-200 flex justify-center">
                    <a
                      href={`http://localhost:6003/companies/${paymentData.companyId}/invoices`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Ver Mi Factura</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-500 tracking-wider">Protegido por Blockchain</span>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6 animate-in fade-in duration-1000" style={{ animationDelay: '300ms' }}>
          <div className="text-center">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center mx-auto mb-1 border border-white/20">
              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Encriptado</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center mx-auto mb-1 border border-white/20">
              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Instantáneo</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center mx-auto mb-1 border border-white/20">
              <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Descentralizado</div>
          </div>
        </div>
      </div>
    </main>
  )
}
