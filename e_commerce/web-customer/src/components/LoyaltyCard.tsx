'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface LoyaltyCardProps {
  account: string
}

const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum']
const TIER_COLORS = [
  'bg-gradient-to-br from-orange-400 to-orange-600',
  'bg-gradient-to-br from-gray-400 to-gray-600',
  'bg-gradient-to-br from-yellow-400 to-yellow-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
]
const TIER_THRESHOLDS = [0, 100, 500, 1000]

export default function LoyaltyCard({ account }: LoyaltyCardProps) {
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLoyaltyData()
  }, [account])

  const loadLoyaltyData = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_LOYALTY_NFT_ADDRESS!,
        [
          'function getLoyaltyCard(address) view returns (tuple(uint8,uint256,uint256,uint256,uint256))',
        ],
        provider
      )

      const card = await contract.getLoyaltyCard(account)
      setLoyaltyData({
        tier: Number(card[0]),
        points: Number(card[1]),
        totalSpent: Number(ethers.formatUnits(card[2], 6)),
        discountPercentage: Number(card[3]),
        issuedAt: Number(card[4]),
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading loyalty card:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Cargando tarjeta de fidelidad...</div>
  }

  if (!loyaltyData) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center">
        <p className="text-gray-600 mb-4">No tienes tarjeta de fidelidad aún</p>
        <p className="text-sm text-gray-500">
          Se creará automáticamente con tu primera compra
        </p>
      </div>
    )
  }

  const currentTier = loyaltyData.tier
  const nextTier = currentTier < 3 ? currentTier + 1 : null
  const progress = nextTier
    ? ((loyaltyData.totalSpent - TIER_THRESHOLDS[currentTier]) /
        (TIER_THRESHOLDS[nextTier] - TIER_THRESHOLDS[currentTier])) *
      100
    : 100

  return (
    <div className="space-y-4">
      {/* Tarjeta visual */}
      <div className={`${TIER_COLORS[currentTier]} p-6 rounded-xl shadow-lg text-white`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-sm opacity-80">Nivel</div>
            <div className="text-2xl font-bold">{TIER_NAMES[currentTier]}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Descuento</div>
            <div className="text-3xl font-bold">{loyaltyData.discountPercentage}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="opacity-80">Puntos</span>
            <span className="font-bold">{loyaltyData.points}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-80">Total Gastado</span>
            <span className="font-bold">€{loyaltyData.totalSpent.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 text-xs opacity-70">
          Miembro desde {new Date(loyaltyData.issuedAt * 1000).toLocaleDateString()}
        </div>
      </div>

      {/* Progreso al siguiente nivel */}
      {nextTier && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Progreso a {TIER_NAMES[nextTier]}</span>
            <span className="text-gray-600">
              €{loyaltyData.totalSpent.toFixed(0)} / €{TIER_THRESHOLDS[nextTier]}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Te faltan €{(TIER_THRESHOLDS[nextTier] - loyaltyData.totalSpent).toFixed(2)} para
            alcanzar {TIER_NAMES[nextTier]}
          </p>
        </div>
      )}

      {/* Beneficios del nivel actual */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-gray-800 mb-2">Beneficios de {TIER_NAMES[currentTier]}</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>✓ {loyaltyData.discountPercentage}% de descuento en todas las compras</li>
          <li>✓ Acumula {loyaltyData.discountPercentage + 1} puntos por euro</li>
          {currentTier >= 2 && <li>✓ Acceso a ofertas exclusivas</li>}
          {currentTier >= 3 && <li>✓ Envío gratuito en todos los pedidos</li>}
        </ul>
      </div>
    </div>
  )
}
