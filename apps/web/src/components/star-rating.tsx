'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'compact' | 'detailed'
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
  showCount?: boolean
  count?: number
  className?: string
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

const gapClasses = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1',
  xl: 'gap-1.5',
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  variant = 'default',
  interactive = false,
  onChange,
  showValue = false,
  showCount = false,
  count = 0,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const displayRating = hoverRating !== null ? hoverRating : rating

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1)
    }
  }

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index + 1)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null)
    }
  }

  return (
    <div className={cn('flex items-center', gapClasses[size], className)}>
      <div
        className={cn('flex items-center', gapClasses[size])}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(displayRating)
          const partial = index === Math.floor(displayRating) && displayRating % 1 > 0
          const fillPercentage = partial ? (displayRating % 1) * 100 : 0

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              disabled={!interactive}
              className={cn(
                'relative transition-transform',
                interactive && 'cursor-pointer hover:scale-110',
                !interactive && 'cursor-default'
              )}
            >
              {/* Empty star background */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-neutral-300 stroke-gray-300'
                )}
                fill="currentColor"
              />

              {/* Filled star overlay */}
              {(filled || partial) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : `${fillPercentage}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'text-amber-400 stroke-amber-400'
                    )}
                    fill="currentColor"
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Value display */}
      {showValue && (
        <span
          className={cn(
            'font-semibold text-foreground',
            size === 'sm' && 'text-xs ml-1',
            size === 'md' && 'text-sm ml-1.5',
            size === 'lg' && 'text-base ml-2',
            size === 'xl' && 'text-lg ml-2'
          )}
        >
          {rating.toFixed(1)}
        </span>
      )}

      {/* Count display */}
      {showCount && count > 0 && (
        <span
          className={cn(
            'text-muted-foreground',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-sm',
            size === 'xl' && 'text-base'
          )}
        >
          ({count})
        </span>
      )}
    </div>
  )
}

// Interactive star rating for forms
interface InteractiveStarRatingProps {
  value: number
  onChange: (rating: number) => void
  size?: 'md' | 'lg' | 'xl'
  className?: string
  labels?: string[]
}

export function InteractiveStarRating({
  value,
  onChange,
  size = 'xl',
  className,
  labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
}: InteractiveStarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const displayRating = hoverRating !== null ? hoverRating : value

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn('flex items-center', gapClasses[size])}
        onMouseLeave={() => setHoverRating(null)}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < displayRating

          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange(index + 1)}
              onMouseEnter={() => setHoverRating(index + 1)}
              className="relative transition-all cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded"
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-150',
                  filled
                    ? 'text-amber-400 stroke-amber-400'
                    : 'text-neutral-300 stroke-gray-300 hover:text-amber-200 hover:stroke-amber-200'
                )}
                fill="currentColor"
              />
            </button>
          )
        })}
      </div>

      {/* Rating label */}
      {displayRating > 0 && labels[displayRating - 1] && (
        <span className="text-sm font-medium text-foreground">
          {labels[displayRating - 1]}
        </span>
      )}
    </div>
  )
}

// Compact rating badge for cards
interface RatingBadgeProps {
  rating: number
  count?: number
  className?: string
}

export function RatingBadge({ rating, count, className }: RatingBadgeProps) {
  if (rating === 0 && (!count || count === 0)) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg',
        className
      )}
    >
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      <span className="text-sm font-semibold text-amber-700">
        {rating.toFixed(1)}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-amber-600">({count})</span>
      )}
    </div>
  )
}

// Rating distribution bar
interface RatingDistributionProps {
  distribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
  totalReviews: number
  onFilterClick?: (rating: number | null) => void
  activeFilter?: number | null
  className?: string
}

export function RatingDistribution({
  distribution,
  totalReviews,
  onFilterClick,
  activeFilter,
  className,
}: RatingDistributionProps) {
  const bars = [
    { stars: 5, count: distribution.fiveStar },
    { stars: 4, count: distribution.fourStar },
    { stars: 3, count: distribution.threeStar },
    { stars: 2, count: distribution.twoStar },
    { stars: 1, count: distribution.oneStar },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      {bars.map(({ stars, count }) => {
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
        const isActive = activeFilter === stars

        return (
          <button
            key={stars}
            type="button"
            onClick={() => onFilterClick?.(isActive ? null : stars)}
            className={cn(
              'w-full flex items-center gap-2 group transition-opacity',
              onFilterClick && 'cursor-pointer hover:opacity-80',
              !onFilterClick && 'cursor-default',
              activeFilter !== null && !isActive && 'opacity-50'
            )}
            disabled={!onFilterClick}
          >
            <span className="w-3 text-xs font-medium text-muted-foreground">
              {stars}
            </span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isActive ? 'bg-amber-500' : 'bg-amber-400'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-xs text-muted-foreground text-right">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
