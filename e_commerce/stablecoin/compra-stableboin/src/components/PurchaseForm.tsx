'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'

interface PurchaseFormProps {
  account: string
}

export default function PurchaseForm({ account }: PurchaseFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [amount, setAmount] = useState<string>('100')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 1. Crear Payment Intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          walletAddress: account,
        }),
      })

      const { clientSecret, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // 2. Confirmar pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // 3. Mint tokens
      if (paymentIntent?.status === 'succeeded') {
        const mintResponse = await fetch('/api/mint-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            walletAddress: account,
            amount: parseFloat(amount),
          }),
        })

        const mintResult = await mintResponse.json()

        if (mintResult.error) {
          throw new Error(mintResult.error)
        }

        setMessage(`¡Éxito! ${amount} EURT han sido acreditados a tu wallet.`)
        setAmount('100')
        elements.getElement(CardElement)?.clear()
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Comprar Tokens</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cantidad de EUR (= cantidad de EURT)
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Recibirás: {amount} EURT
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tarjeta de Crédito
        </label>
        <div className="border border-gray-300 rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tarjeta de prueba: 4242 4242 4242 4242 | Cualquier fecha futura | Cualquier CVC
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        {loading ? 'Procesando...' : `Pagar €${amount}`}
      </button>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('Éxito')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}
    </form>
  )
}
