'use client'

import { useState, useEffect } from 'react'
import {
  Star,
  MessageCircle,
  Filter,
  ChevronDown,
  TrendingUp,
  Users,
  Loader2,
} from 'lucide-react'
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
  activity: {
    id: string
    title: string
    imageUrl: string | null
  }
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

interface HostSummary {
  averageRating: number
  totalReviews: number
  totalActivities: number
  responseRate: number
  distribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
}

type FilterOption = 'all' | 'needs_response' | 'responded'
type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful'

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All Reviews' },
  { value: 'needs_response', label: 'Needs Response' },
  { value: 'responded', label: 'Responded' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' },
]

interface HostReviewsDashboardProps {
  className?: string
}

export function HostReviewsDashboard({ className }: HostReviewsDashboardProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<HostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const fetchReviews = async (reset = false) => {
    const currentPage = reset ? 1 : page
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        filter,
      })
      if (filterRating) {
        params.set('rating', filterRating.toString())
      }

      const res = await fetch(`/api/host/reviews?${params}`)
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
      console.error('Error fetching host reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchReviews(true)
  }, [filter, sortBy, filterRating])

  const handleLoadMore = () => {
    setPage((p) => p + 1)
    fetchReviews(false)
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
    // Update summary response rate
    if (summary) {
      const needsResponse = reviews.filter((r) => !r.hostResponse).length - 1
      const responded = reviews.length - needsResponse
      setSummary({
        ...summary,
        responseRate: (responded / reviews.length) * 100,
      })
    }
  }

  if (loading) {
    return (
      <div className={cn('py-12', className)}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const needsResponseCount = reviews.filter((r) => !r.hostResponse).length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to reviews from your activities
        </p>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Rating */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Star size={16} />
              <span className="text-sm">Average Rating</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {summary.averageRating.toFixed(1)}
              </span>
              <StarRating rating={summary.averageRating} size="sm" />
            </div>
          </div>

          {/* Total Reviews */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageCircle size={16} />
              <span className="text-sm">Total Reviews</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {summary.totalReviews}
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp size={16} />
              <span className="text-sm">Response Rate</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {summary.responseRate.toFixed(0)}%
            </div>
          </div>

          {/* Activities with Reviews */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users size={16} />
              <span className="text-sm">Reviewed Activities</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {summary.totalActivities}
            </div>
          </div>
        </div>
      )}

      {/* Distribution Card */}
      {summary && summary.totalReviews > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Rating Distribution
          </h3>
          <RatingDistribution
            distribution={summary.distribution}
            totalReviews={summary.totalReviews}
            onFilterClick={(rating) => setFilterRating(rating)}
            activeFilter={filterRating}
          />
        </div>
      )}

      {/* Needs Response Alert */}
      {needsResponseCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">
                  {needsResponseCount} review{needsResponseCount !== 1 ? 's' : ''}{' '}
                  awaiting response
                </p>
                <p className="text-sm text-amber-700">
                  Responding to reviews builds trust with potential attendees
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter('needs_response')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              View
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="text-sm"
            >
              <Filter size={14} className="mr-2" />
              {filterOptions.find((o) => o.value === filter)?.label}
              <ChevronDown size={14} className="ml-2" />
            </Button>
            {showFilterDropdown && (
              <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value)
                      setShowFilterDropdown(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-muted',
                      filter === option.value && 'font-medium text-primary'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rating Filter Badge */}
          {filterRating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterRating(null)}
              className="text-xs"
            >
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
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showActivity
              isHost
              onRespond={handleHostResponse}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-xl p-8 text-center">
          <Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No reviews found</p>
          {filter !== 'all' && (
            <Button
              variant="link"
              onClick={() => setFilter('all')}
              className="mt-2"
            >
              View all reviews
            </Button>
          )}
        </div>
      )}

      {/* Load More */}
      {hasMore && reviews.length > 0 && (
        <div className="text-center">
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
    </div>
  )
}
