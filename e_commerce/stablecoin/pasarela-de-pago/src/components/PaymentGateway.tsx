'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers'

interface PaymentData {
  merchantAddress: string
  amount: number
  invoiceId: string
  date: string
  redirectUrl: string
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

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        setAccount(accounts[0])

        // Get token balance
        const tokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS
        if (tokenAddress) {
          const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider)
          const balance = await tokenContract.balanceOf(accounts[0])
          const decimals = await tokenContract.decimals()
          setBalance(formatUnits(balance, decimals))
        }
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

      // Amount con 6 decimales
      const amountWei = parseUnits(paymentData.amount.toString(), 6)

      // Verificar balance
      const balance = await tokenContract.balanceOf(account)
      if (balance < amountWei) {
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
    <main className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          Pasarela de Pago
        </h1>

        {/* Detalles del pago */}
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Comerciante:</span>
            <span className="font-mono text-sm">{paymentData.merchantAddress.slice(0, 10)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice:</span>
            <span className="font-bold">{paymentData.invoiceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha:</span>
            <span>{new Date(paymentData.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2 mt-2">
            <span className="text-gray-800 font-bold text-lg">Total:</span>
            <span className="text-green-600 font-bold text-2xl">
              €{paymentData.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Wallet info */}
        {!account ? (
          <button
            onClick={connectWallet}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Conectar MetaMask
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Tu wallet:</p>
              <p className="font-mono text-sm">{account}</p>
              <p className="text-sm text-gray-600 mt-2">Balance EURT:</p>
              <p className="font-bold text-lg">{parseFloat(balance).toFixed(2)} EURT</p>
            </div>

            {parseFloat(balance) < paymentData.amount && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded">
                <p className="text-sm">
                  Saldo insuficiente.{' '}
                  <a
                    href="http://localhost:6001"
                    target="_blank"
                    className="underline font-bold"
                  >
                    Comprar tokens
                  </a>
                </p>
              </div>
            )}

            <button
              onClick={processPayment}
              disabled={status === 'processing' || parseFloat(balance) < paymentData.amount}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {status === 'processing' ? 'Procesando...' : 'Pagar Ahora'}
            </button>
          </div>
        )}

        {/* Status message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-center ${
              status === 'success'
                ? 'bg-green-100 text-green-800'
                : status === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  )
}
