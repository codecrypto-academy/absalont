'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface AnalyticsData {
  totalSales: string
  totalRevenue: string
  totalOrders: string
}

interface ProductSales {
  productId: number
  name: string
  sales: string
}

export default function AnalyticsDashboard({ companyId }: { companyId: number }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [topProducts, setTopProducts] = useState<ProductSales[]>([])
  const [dailySales, setDailySales] = useState<{ date: string; sales: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [companyId])

  const loadAnalytics = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!,
        [
          'function getCompanyAnalytics(uint256) view returns (uint256, uint256, uint256)',
          'function getCompanyProducts(uint256) view returns (uint256[])',
          'function getProduct(uint256) view returns (tuple(uint256,uint256,string,string,uint256,uint256,string,bool,uint256))',
          'function getProductSales(uint256, uint256) view returns (uint256)',
          'function getDailySales(uint256, uint256) view returns (uint256)',
        ],
        provider
      )

      // Obtener analytics generales
      const [totalSales, totalRevenue, totalOrders] = await contract.getCompanyAnalytics(companyId)
      
      setAnalytics({
        totalSales: totalSales.toString(),
        totalRevenue: ethers.formatUnits(totalRevenue, 6),
        totalOrders: totalOrders.toString(),
      })

      // Obtener productos más vendidos
      const productIds = await contract.getCompanyProducts(companyId)
      const productSalesPromises = productIds.map(async (productId: bigint) => {
        const product = await contract.getProduct(productId)
        const sales = await contract.getProductSales(companyId, productId)
        return {
          productId: Number(productId),
          name: product[2], // name es el tercer campo
          sales: sales.toString(),
        }
      })
      const productSalesData = await Promise.all(productSalesPromises)
      setTopProducts(productSalesData.sort((a, b) => Number(b.sales) - Number(a.sales)).slice(0, 5))

      // Obtener ventas de últimos 7 días
      const last7Days = []
      const now = Math.floor(Date.now() / 1000)
      for (let i = 6; i >= 0; i--) {
        const dayTimestamp = Math.floor((now - i * 86400) / 86400) * 86400
        const sales = await contract.getDailySales(companyId, dayTimestamp)
        last7Days.push({
          date: new Date(dayTimestamp * 1000).toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
          }),
          sales: ethers.formatUnits(sales, 6),
        })
      }
      setDailySales(last7Days)

      setLoading(false)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard de Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Ventas Totales</div>
          <div className="text-3xl font-bold text-blue-600">{analytics?.totalSales}</div>
          <div className="text-xs text-gray-500 mt-2">Unidades vendidas</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Revenue Total</div>
          <div className="text-3xl font-bold text-green-600">
            €{parseFloat(analytics?.totalRevenue || '0').toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">En EuroTokens</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Órdenes Totales</div>
          <div className="text-3xl font-bold text-purple-600">{analytics?.totalOrders}</div>
          <div className="text-xs text-gray-500 mt-2">Pedidos completados</div>
        </div>
      </div>

      {/* Gráfico de ventas diarias */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Ventas Últimos 7 Días</h2>
        <div className="flex items-end justify-between h-64 space-x-2">
          {dailySales.map((day, index) => {
            const maxSales = Math.max(...dailySales.map(d => parseFloat(d.sales)))
            const height = maxSales > 0 ? (parseFloat(day.sales) / maxSales) * 100 : 0
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative group">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      €{parseFloat(day.sales).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">{day.date}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top productos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 Productos</h2>
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{product.name}</div>
                  <div className="text-sm text-gray-600">ID: {product.productId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">{product.sales}</div>
                <div className="text-xs text-gray-600">unidades</div>
              </div>
            </div>
          ))}
        </div>
        {topProducts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No hay ventas registradas aún
          </div>
        )}
      </div>

      {/* Botón de actualizar */}
      <div className="flex justify-center">
        <button
          onClick={loadAnalytics}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          Actualizar Datos
        </button>
      </div>
    </div>
  )
}
