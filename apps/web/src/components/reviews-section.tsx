'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Filter, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/review-card'
import { StarRating, RatingDistribution } from '@/components/star-rating'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  photos: string[]
  isVerified: boolean
  helpfulCount: number
  createdAt: Date | string
  editedAt: Date | string | null
  reviewer: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  hostResponse?: {
    id: string
    content: string
    createdAt: Date | string
    editedAt: Date | string | null
  } | null
  userHasVotedHelpful?: boolean
}

interface RatingSummary {
  averageRating: number
  totalReviews: number
  distribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
}

interface ReviewsSectionProps {
  activityId: string
  initialReviews?: Review[]
  initialSummary?: RatingSummary | null
  isHost?: boolean
  className?: string
}

type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' },
]

export function ReviewsSection({
  activityId,
  initialReviews = [],
  initialSummary = null,
  isHost = false,
  className,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [summary, setSummary] = useState<RatingSummary | null>(initialSummary)
  const [loading, setLoading] = useState(!initialReviews.length)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const fetchReviews = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
      })
      if (filterRating) {
        params.set('rating', filterRating.toString())
      }

      const res = await fetch(`/api/reviews/activity/${activityId}?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (reset) {
          setReviews(data.reviews)
          setSummary(data.summary)
          setPage(1)
        } else {
          setReviews((prev) => [...prev, ...data.reviews])
        }
        setHasMore(data.reviews.length === 10)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activityId, sortBy, filterRating, page])

  // Fetch on mount if no initial data
  useEffect(() => {
    if (!initialReviews.length) {
      fetchReviews(true)
    }
  }, [fetchReviews, initialReviews.length])

  // Refetch when sort or filter changes
  useEffect(() => {
    fetchReviews(true)
  }, [fetchReviews])

  const handleLoadMore = () => {
    setPage((p) => p + 1)
    fetchReviews(false)
  }

  const handleFilterClick = (rating: number | null) => {
    setFilterRating(rating)
  }

  const handleHostResponse = (reviewId: string, response: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              hostResponse: {
                id: 'temp',
                content: response,
                createdAt: new Date().toISOString(),
                editedAt: null,
              },
            }
          : r
      )
    )
  }

  if (loading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className={cn('py-8', className)}>
        <h2 className="text-xl font-bold text-foreground mb-4">Reviews</h2>
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Be the first to share your experience!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('py-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Reviews</h2>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Overall Rating */}
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl font-bold text-foreground mb-2">
              {summary.averageRating.toFixed(1)}
            </div>
            <StarRating rating={summary.averageRating} size="lg" />
            <p className="text-sm text-muted-foreground mt-2">
              Based on {summary.totalReviews} review
              {summary.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Distribution */}
          <div className="flex-1">
            <RatingDistribution
              distribution={summary.distribution}
              totalReviews={summary.totalReviews}
              onFilterClick={handleFilterClick}
              activeFilter={filterRating}
            />
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {filterRating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterRating(null)}
              className="text-xs"
            >
              <Filter size={14} className="mr-1" />
              {filterRating} Star{filterRating !== 1 ? 's' : ''}
              <span className="ml-1 text-muted-foreground">×</span>
            </Button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="text-sm"
          >
            Sort: {sortOptions.find((o) => o.value === sortBy)?.label}
            <ChevronDown size={14} className="ml-1" />
          </Button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value)
                    setShowSortDropdown(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-muted',
                    sortBy === option.value && 'font-medium text-primary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isHost={isHost}
            onRespond={handleHostResponse}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && reviews.length > 0 && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Reviews'
            )}
          </Button>
        </div>
      )}

      {/* No results for filter */}
      {reviews.length === 0 && filterRating && (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <p className="text-muted-foreground">
            No {filterRating}-star reviews found
          </p>
          <Button
            variant="link"
            onClick={() => setFilterRating(null)}
            className="mt-2"
          >
            Clear filter
          </Button>
        </div>
      )}
    </div>
  )
}
