'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  reviewerName: string | null
  helpfulCount: number
  hostResponse: string | null
  hostRespondedAt: string | null
  createdAt: string
}

interface ReviewSummary {
  totalReviews: number
  averageRating: number
  ratingDistribution: Record<number, number>
}

interface EventReviewsProps {
  eventId: string
  className?: string
}

export function EventReviews({ eventId, className = '' }: EventReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/reviews`)
        if (!res.ok) throw new Error('Failed to fetch reviews')
        const data = await res.json()
        setReviews(data.reviews)
        setSummary(data.summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reviews')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [eventId])

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-32 mb-3" />
        <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
    )
  }

  if (error || !summary || summary.totalReviews === 0) {
    return null // Don't show anything if no reviews
  }

  const displayedReviews = isExpanded ? reviews : reviews.slice(0, 2)

  return (
    <div className={className}>
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(summary.averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-neutral-300 dark:text-neutral-600'
                }`}
              />
            ))}
          </div>
          <span className="font-semibold text-neutral-900 dark:text-white">
            {summary.averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            ({summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-5 gap-1 mb-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.ratingDistribution[rating] || 0
          const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0
          return (
            <div key={rating} className="text-center">
              <div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg relative overflow-hidden mb-1">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-amber-400 transition-all"
                  style={{ height: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{rating}★</span>
            </div>
          )
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show All {reviews.length} Reviews <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                {(review.reviewerName || 'A')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white text-sm">
                {review.reviewerName || 'Anonymous'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{formattedDate}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= review.rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-neutral-300 dark:text-neutral-600'
              }`}
            />
          ))}
        </div>
      </div>

      {review.title && (
        <p className="font-medium text-neutral-900 dark:text-white mb-1">{review.title}</p>
      )}

      {review.content && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {review.content}
        </p>
      )}

      {review.helpfulCount > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          <ThumbsUp className="w-3 h-3" />
          <span>{review.helpfulCount} found this helpful</span>
        </div>
      )}

      {/* Host Response */}
      {review.hostResponse && (
        <div className="mt-3 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-1 mb-1">
            <MessageCircle className="w-3 h-3 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Host Response</span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{review.hostResponse}</p>
        </div>
      )}
    </div>
  )
}

// Compact version for cards
export function EventRatingBadge({ eventId }: { eventId: string }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/reviews`)
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary)
        }
      } catch {
        // Silently fail
      }
    }

    fetchSummary()
  }, [eventId])

  if (!summary || summary.totalReviews === 0) return null

  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
      <span className="font-medium text-neutral-900 dark:text-white">
        {summary.averageRating.toFixed(1)}
      </span>
      <span className="text-neutral-500 dark:text-neutral-400">
        ({summary.totalReviews})
      </span>
    </div>
  )
}
