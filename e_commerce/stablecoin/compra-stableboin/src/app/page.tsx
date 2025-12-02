'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import WalletConnect from '@/components/WalletConnect'
import PurchaseForm from '@/components/PurchaseForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Home() {
  const [account, setAccount] = useState<string>('')

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Comprar EuroToken
        </h1>
        
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <WalletConnect account={account} setAccount={setAccount} />
        </div>

        {account && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <Elements stripe={stripePromise}>
              <PurchaseForm account={account} />
            </Elements>
          </div>
        )}

        {!account && (
          <div className="bg-white rounded-lg shadow-xl p-6 text-center">
            <p className="text-gray-600">
              Conecta tu wallet para comprar EuroTokens
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
