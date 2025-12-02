'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

interface Review {
  reviewId: number
  customerAddress: string
  rating: number
  comment: string
  timestamp: number
}

interface ProductReviewsProps {
  productId: number
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!,
        [
          'function getProductReviews(uint256) view returns (uint256[])',
          'function getReview(uint256) view returns (tuple(uint256,uint256,address,uint8,string,uint256,bool))',
          'function getProductRating(uint256) view returns (uint256, uint256)',
        ],
        provider
      )

      // Obtener rating promedio
      const [avgRating, count] = await contract.getProductRating(productId)
      setAverageRating(Number(avgRating) / 100) // Convertir de 450 a 4.50
      setReviewCount(Number(count))

      // Obtener todas las reviews
      const reviewIds = await contract.getProductReviews(productId)
      const reviewsData = await Promise.all(
        reviewIds.map(async (reviewId: bigint) => {
          const review = await contract.getReview(reviewId)
          return {
            reviewId: Number(review[0]),
            productId: Number(review[1]),
            customerAddress: review[2],
            rating: Number(review[3]),
            comment: review[4],
            timestamp: Number(review[5]),
            isActive: review[6],
          }
        })
      )

      setReviews(reviewsData.filter(r => r.isActive))
      setLoading(false)
    } catch (error) {
      console.error('Error loading reviews:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando reviews...</div>
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-gray-800">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${
                    star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Basado en {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-600">
            Aún no hay reviews para este producto. ¡Sé el primero en dejar una!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.reviewId} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="font-mono text-sm text-gray-600">
                      {review.customerAddress.slice(0, 6)}...{review.customerAddress.slice(-4)}
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`${
                            star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(review.timestamp * 1000).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
