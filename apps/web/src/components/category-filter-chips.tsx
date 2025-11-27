'use client'

import { useState } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_CATEGORIES,
  getFeaturedCategories,
  getCategoryBySlug,
} from '@/lib/categories'

interface CategoryFilterChipsProps {
  selected?: string[]
  onChange: (selected: string[]) => void
  showAll?: boolean
  maxVisible?: number
  className?: string
}

export function CategoryFilterChips({
  selected = [],
  onChange,
  showAll = true,
  maxVisible = 10,
  className,
}: CategoryFilterChipsProps) {
  const [showMore, setShowMore] = useState(false)

  const featuredCategories = getFeaturedCategories()
  const visibleCategories = showMore
    ? ACTIVITY_CATEGORIES.filter((c) => c.slug !== 'other')
    : featuredCategories.slice(0, maxVisible)

  const handleToggle = (slug: string) => {
    const newSelected = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug]
    onChange(newSelected)
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Chips Container */}
      <div className="flex flex-wrap gap-2">
        {/* All chip */}
        {showAll && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all',
              selected.length === 0
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            All
          </button>
        )}

        {/* Category chips */}
        {visibleCategories.map((category) => {
          const isActive = selected.includes(category.slug)
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => handleToggle(category.slug)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 border border-primary text-primary'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span>{category.emoji}</span>
              <span>{category.name}</span>
              {isActive && (
                <X
                  className="w-3.5 h-3.5 ml-0.5"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggle(category.slug)
                  }}
                />
              )}
            </button>
          )
        })}

        {/* Show more/less button */}
        {!showMore && ACTIVITY_CATEGORIES.length > maxVisible && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            +{ACTIVITY_CATEGORIES.length - maxVisible - 1} more
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {showMore && (
          <button
            type="button"
            onClick={() => setShowMore(false)}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Show less
          </button>
        )}
      </div>

      {/* Selected count */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">
            {selected.length} selected
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-primary font-medium hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

// Compact version for mobile
export function CategoryFilterChipsCompact({
  selected = [],
  onChange,
  className,
}: Omit<CategoryFilterChipsProps, 'maxVisible' | 'showAll'>) {
  const scrollContainerRef = useState<HTMLDivElement | null>(null)

  const featuredCategories = getFeaturedCategories()

  const handleToggle = (slug: string) => {
    const newSelected = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug]
    onChange(newSelected)
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {/* All chip */}
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            'flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
            selected.length === 0
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600'
          )}
        >
          All
        </button>

        {featuredCategories.map((category) => {
          const isActive = selected.includes(category.slug)
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => handleToggle(category.slug)}
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-primary/10 border border-primary text-primary'
                  : 'bg-white border border-gray-200 text-gray-600'
              )}
            >
              <span>{category.emoji}</span>
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
