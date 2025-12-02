'use client'

import { useState } from 'react'

interface ReviewFormProps {
  productId: number
  onReviewAdded: () => void
}

export default function ReviewForm({ productId, onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!,
        [
          'function addReview(uint256 productId, uint8 rating, string memory comment) external returns (uint256)',
        ],
        signer
      )

      const tx = await contract.addReview(productId, rating, comment)
      await tx.wait()

      setMessage('¡Review agregada exitosamente!')
      setComment('')
      setRating(5)
      onReviewAdded()
    } catch (error: any) {
      console.error('Error adding review:', error)
      if (error.message.includes('Already reviewed')) {
        setMessage('Ya has dejado una review para este producto')
      } else {
        setMessage('Error al agregar review')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Dejar una Review</h3>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calificación
        </label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-500 transition`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comentario */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentario
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Comparte tu experiencia con este producto..."
          required
        />
        <div className="text-sm text-gray-500 text-right mt-1">
          {comment.length}/500
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
      >
        {loading ? 'Enviando...' : 'Enviar Review'}
      </button>

      {message && (
        <div
          className={`p-3 rounded ${
            message.includes('exitosamente')
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
