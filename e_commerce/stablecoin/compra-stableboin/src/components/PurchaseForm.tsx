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
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          walletAddress: account,
        }),
      })

      const { clientSecret, error } = await response.json()
      if (error) throw new Error(error)

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      )

      if (stripeError) throw new Error(stripeError.message)

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
        if (mintResult.error) throw new Error(mintResult.error)

        setMessage({ text: `¡Éxito! ${amount} EURT han sido acreditados a tu wallet.`, type: 'success' })
        setAmount('100')
        elements.getElement(CardElement)?.clear()
      }
    } catch (error: any) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Completar Compra</h2>
        <p className="text-slate-400 text-sm">Ingresa los detalles para el mint de EURT.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
          Monto en Euros
        </label>
        <div className="relative">
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="glass-input w-full pl-12 text-2xl font-black"
            required
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">€</span>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/5 px-2 py-1 rounded text-xs font-bold text-slate-500">
            EUR
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
          <span className="animate-pulse">↓</span>
          <span>Recibirás aproximadamente {amount} EURT</span>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
          Información de Pago
        </label>
        <div className="glass-input !p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                  iconColor: '#6366f1',
                },
                invalid: {
                  color: '#f43f5e',
                },
              },
            }}
          />
        </div>
        <p className="text-[10px] text-slate-500 italic">
          * Para pruebas usa: 4242 4242 4242 4242
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary w-full flex items-center justify-center gap-2 h-14"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Procesando...</span>
          </>
        ) : (
          `Pagar y Recibir €${amount}`
        )}
      </button>

      {message.text && (
        <div
          className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}
    </form>
  )
}
