'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PaymentGateway from '@/components/PaymentGateway'

function PaymentContent() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<any>(null)

  useEffect(() => {
    const merchant_address = searchParams.get('merchant_address')
    const amount = searchParams.get('amount')
    const invoice = searchParams.get('invoice')
    const date = searchParams.get('date')
    const redirect = searchParams.get('redirect')

    if (merchant_address && amount && invoice) {
      setPaymentData({
        merchantAddress: merchant_address,
        amount: parseFloat(amount),
        invoiceId: invoice,
        date: date || new Date().toISOString(),
        redirectUrl: redirect || '',
      })
    }
  }, [searchParams])

  if (!paymentData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Pasarela de Pago
          </h1>
          <p className="text-gray-600">
            Parámetros de pago inválidos. Por favor verifica la URL.
          </p>
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
