'use client'

import { cn } from '@/lib/utils'
import { getCategoryBySlug, getGroupBySlug } from '@/lib/categories'

interface CategoryBadgeProps {
  slug: string
  size?: 'small' | 'medium' | 'large'
  showEmoji?: boolean
  variant?: 'default' | 'filled' | 'outline'
  className?: string
}

export function CategoryBadge({
  slug,
  size = 'medium',
  showEmoji = true,
  variant = 'default',
  className,
}: CategoryBadgeProps) {
  const category = getCategoryBySlug(slug)
  const group = category?.groupSlug ? getGroupBySlug(category.groupSlug) : null
  const color = group?.color || category?.color || '#9CA3AF'

  if (!category) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-md',
          size === 'small' && 'text-[10px] px-1.5 py-0.5',
          size === 'medium' && 'text-xs px-2 py-1',
          size === 'large' && 'text-sm px-3 py-1.5',
          variant === 'default' && 'bg-gray-100 text-gray-600',
          variant === 'filled' && 'bg-gray-500 text-white',
          variant === 'outline' && 'border border-gray-300 text-gray-600',
          className
        )}
      >
        {showEmoji && '✨ '}Other
      </span>
    )
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: color,
          color: '#FFFFFF',
        }
      case 'outline':
        return {
          borderColor: color,
          color: color,
          backgroundColor: 'transparent',
        }
      default:
        return {
          backgroundColor: `${color}15`,
          color: color,
        }
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'small' && 'text-[10px] px-1.5 py-0.5 rounded',
        size === 'medium' && 'text-xs px-2 py-1 rounded-md',
        size === 'large' && 'text-sm px-3 py-1.5 rounded-lg',
        variant === 'outline' && 'border',
        className
      )}
      style={getVariantStyles()}
    >
      {showEmoji && <span>{category.emoji}</span>}
      <span>{category.name}</span>
    </span>
  )
}

// Compact category pill for activity cards
export function CategoryPill({
  slug,
  className,
}: {
  slug: string
  className?: string
}) {
  const category = getCategoryBySlug(slug)

  if (!category) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full',
          className
        )}
      >
        ✨ Other
      </span>
    )
  }

  const group = category.groupSlug ? getGroupBySlug(category.groupSlug) : null
  const color = group?.color || category.color

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      <span>{category.emoji}</span>
      <span>{category.name}</span>
    </span>
  )
}

// Category icon only (for compact views)
export function CategoryIcon({
  slug,
  size = 'medium',
  className,
}: {
  slug: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}) {
  const category = getCategoryBySlug(slug)
  const emoji = category?.emoji || '✨'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        size === 'small' && 'text-sm',
        size === 'medium' && 'text-base',
        size === 'large' && 'text-lg',
        className
      )}
      title={category?.name || 'Other'}
    >
      {emoji}
    </span>
  )
}
