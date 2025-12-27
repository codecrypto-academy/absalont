'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { JsonRpcProvider, Contract } from 'ethers'
import PaymentGateway from '@/components/PaymentGateway'

function PaymentContent() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true

    const fetchInvoiceData = async () => {
      const invoice = searchParams.get('invoice')
      const merchant_address = searchParams.get('merchant_address')
      const amount = searchParams.get('amount')
      const date = searchParams.get('date')
      const redirect = searchParams.get('redirect')

      if (!invoice) {
        if (mounted) setLoading(false)
        return
      }

      // Si ya tenemos todo en la URL, lo usamos directamente (compatibilidad hacia atrás)
      if (merchant_address && amount) {
        if (mounted) {
          setPaymentData({
            merchantAddress: merchant_address,
            amount: parseFloat(amount),
            invoiceId: invoice,
            date: date || new Date().toISOString(),
            redirectUrl: redirect || '',
            companyId: 0,
          })
          setLoading(false)
        }
        return
      }

      // Si falta info, consultamos al contrato
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'
        const ecommerceAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS

        if (!ecommerceAddress) throw new Error('Contrato E-commerce no configurado')

        // Usar StaticNetwork o cachear el provider podría mejorar, pero mover el import ya ayuda.
        // En ethers v6, el provider detecta la red automáticamente.
        const provider = new JsonRpcProvider(rpcUrl)

        const ecommerceAbi = [
          'function getInvoice(uint256 invoiceId) external view returns (uint256, uint256, address, uint256, uint256, bool)',
          'function getCompany(uint256 companyId) external view returns (tuple(uint256 id, string name, string description, address owner, string taxId, bool isActive, uint256 createdAt))'
        ]
        const ecommerce = new Contract(ecommerceAddress, ecommerceAbi, provider)

        // Promise.all no es posible porque getCompany depende de invoiceData
        const invoiceData = await ecommerce.getInvoice(invoice)

        if (!mounted) return

        const companyId = invoiceData[1]
        const totalAmount = invoiceData[3]
        const timestamp = invoiceData[4]
        const isPaid = invoiceData[5]

        if (isPaid) throw new Error('Esta invoice ya ha sido pagada')

        // Obtener dirección de la empresa
        const company = await ecommerce.getCompany(companyId)
        const merchantAddress = company[3]

        if (mounted) {
          setPaymentData({
            merchantAddress: merchantAddress,
            amount: Number(totalAmount) / 1e6,
            invoiceId: invoice,
            date: new Date(Number(timestamp) * 1000).toISOString(),
            redirectUrl: redirect || '',
            companyId: Number(companyId),
          })
        }
      } catch (err: any) {
        console.error('Error fetching invoice:', err)
        if (mounted) {
          setError(err.message || 'Error al cargar los datos de la invoice pre-existente')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchInvoiceData()

    return () => {
      mounted = false
    }
  }, [searchParams])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del pago...</p>
        </div>
      </main>
    )
  }

  if (!paymentData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Pasarela de Pago
          </h1>
          <p className="text-red-600 mb-4">
            {error || 'Parámetros de pago inválidos. Por favor verifica la URL.'}
          </p>
          <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
            <strong>Tip:</strong> Esta página debe abrirse desde una orden de compra o notificación.
          </div>
        </div>
      </main>
    )
  }

  return <PaymentGateway paymentData={paymentData} />
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </main>
    }>
      <PaymentContent />
    </Suspense>
  )
}
