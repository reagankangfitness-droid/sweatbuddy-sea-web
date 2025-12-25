'use client'

import { cn } from '@/lib/utils'
import { Users, Clock, AlertTriangle, Check } from 'lucide-react'
import type { UrgencyLevel } from '@/lib/waitlist'

interface SpotsIndicatorProps {
  spotsRemaining: number
  totalSpots: number
  waitlistCount?: number
  urgencyLevel?: UrgencyLevel
  variant?: 'default' | 'compact' | 'badge' | 'detailed'
  showProgress?: boolean
  className?: string
}

// Color mapping for urgency levels
const urgencyColors = {
  none: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    fill: 'bg-green-500',
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    fill: 'bg-amber-500',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    fill: 'bg-orange-500',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    fill: 'bg-red-500',
  },
  full: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    fill: 'bg-red-600',
  },
}

export function SpotsIndicator({
  spotsRemaining,
  totalSpots,
  waitlistCount = 0,
  urgencyLevel = 'none',
  variant = 'default',
  showProgress = false,
  className,
}: SpotsIndicatorProps) {
  const percentFilled = totalSpots > 0 ? Math.round(((totalSpots - spotsRemaining) / totalSpots) * 100) : 0
  const colors = urgencyColors[urgencyLevel]

  // Badge variant (for activity cards)
  if (variant === 'badge') {
    if (urgencyLevel === 'full') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
            colors.bg,
            colors.text,
            className
          )}
        >
          <Users size={12} />
          Sold Out
          {waitlistCount > 0 && (
            <span className="opacity-70 pl-1.5 border-l border-current/30">
              {waitlistCount} waiting
            </span>
          )}
        </span>
      )
    }

    if (urgencyLevel === 'critical') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse',
            colors.bg,
            colors.text,
            className
          )}
        >
          <AlertTriangle size={12} />
          Only {spotsRemaining} left!
        </span>
      )
    }

    if (urgencyLevel === 'high') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
            colors.bg,
            colors.text,
            className
          )}
        >
          <Clock size={12} />
          {spotsRemaining} spots left
        </span>
      )
    }

    if (urgencyLevel === 'medium') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
            colors.bg,
            colors.text,
            className
          )}
        >
          Filling fast · {spotsRemaining} left
        </span>
      )
    }

    // No urgency - don't show badge
    return null
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <span className={cn('text-sm', colors.text, className)}>
        {urgencyLevel === 'full' ? (
          'Sold out'
        ) : urgencyLevel === 'critical' ? (
          <>
            Only <strong>{spotsRemaining}</strong> left!
          </>
        ) : (
          <>{spotsRemaining} spots available</>
        )}
      </span>
    )
  }

  // Detailed variant (for activity page)
  if (variant === 'detailed') {
    return (
      <div className={cn('bg-slate-50 border border-slate-200 rounded-xl p-4', className)}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              colors.bg,
              colors.text
            )}
          >
            {urgencyLevel === 'full' ? (
              <Users size={18} />
            ) : urgencyLevel === 'critical' ? (
              <AlertTriangle size={18} />
            ) : (
              <Users size={18} />
            )}
          </div>
          <div className="flex-1">
            <div className={cn('text-[15px] font-semibold', urgencyLevel === 'full' || urgencyLevel === 'critical' ? colors.text : 'text-neutral-900')}>
              {urgencyLevel === 'full' ? (
                'This activity is sold out'
              ) : urgencyLevel === 'critical' ? (
                `Only ${spotsRemaining} spot${spotsRemaining === 1 ? '' : 's'} left!`
              ) : urgencyLevel === 'high' ? (
                `${spotsRemaining} spots remaining`
              ) : (
                `${spotsRemaining} of ${totalSpots} spots available`
              )}
            </div>
            <div className="text-sm text-neutral-500">
              {urgencyLevel === 'full' && waitlistCount > 0 && (
                <>{waitlistCount} people on the waitlist</>
              )}
              {urgencyLevel !== 'full' && percentFilled >= 50 && (
                <>{percentFilled}% booked</>
              )}
            </div>
          </div>
        </div>

        {showProgress && urgencyLevel !== 'full' && totalSpots > 0 && (
          <div className="mt-3.5">
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', colors.fill)}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>
        )}

        {urgencyLevel === 'full' && waitlistCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 mt-3 pt-3 border-t border-slate-200">
            <Users size={14} />
            <span>{waitlistCount} people waiting for a spot</span>
          </div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border',
        colors.bg,
        colors.border,
        urgencyLevel === 'critical' && 'animate-pulse',
        className
      )}
    >
      <span className={colors.text}>
        {urgencyLevel === 'full' ? (
          <Users size={16} />
        ) : urgencyLevel === 'critical' ? (
          <AlertTriangle size={16} />
        ) : urgencyLevel === 'high' ? (
          <Clock size={16} />
        ) : (
          <Check size={16} />
        )}
      </span>
      <div>
        <span className={cn('text-sm font-semibold', colors.text)}>
          {urgencyLevel === 'full' ? (
            'Sold Out'
          ) : urgencyLevel === 'critical' ? (
            `Only ${spotsRemaining} left!`
          ) : urgencyLevel === 'high' ? (
            `${spotsRemaining} spots left`
          ) : (
            `${spotsRemaining} available`
          )}
        </span>
        {waitlistCount > 0 && urgencyLevel === 'full' && (
          <span className="block text-xs text-neutral-500">
            {waitlistCount} on waitlist
          </span>
        )}
      </div>
    </div>
  )
}

// Inline spots badge for activity cards (smaller, no icon)
export function SpotsBadge({
  spotsRemaining,
  totalSpots,
  urgencyLevel = 'none',
  className,
}: {
  spotsRemaining: number
  totalSpots: number
  urgencyLevel?: UrgencyLevel
  className?: string
}) {
  const colors = urgencyColors[urgencyLevel]

  if (urgencyLevel === 'none') {
    return (
      <span className={cn('text-xs text-neutral-500 flex items-center gap-1', className)}>
        <Users size={12} />
        {spotsRemaining} spots
      </span>
    )
  }

  return (
    <span
      className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full',
        colors.bg,
        colors.text,
        urgencyLevel === 'critical' && 'animate-pulse',
        className
      )}
    >
      {urgencyLevel === 'full'
        ? 'Sold Out'
        : urgencyLevel === 'critical'
          ? `${spotsRemaining} left!`
          : `${spotsRemaining} left`}
    </span>
  )
}
