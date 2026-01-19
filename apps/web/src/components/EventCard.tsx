'use client'

import { useState, useEffect, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { LiveCounter } from './ui/AnimatedCounter'
import { AvatarStack } from './ui/AvatarStack'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

interface AttendeePreview {
  id: string
  name: string
  imageUrl?: string | null
}

interface Event {
  id: string
  slug?: string | null  // URL-friendly slug
  name: string
  category: string
  day: string
  eventDate?: string | null  // ISO date string (e.g., "2024-01-15")
  time: string
  location: string
  description?: string | null
  organizer: string
  imageUrl?: string | null
  communityLink?: string | null
  recurring: boolean
  goingCount?: number
  attendeesPreview?: AttendeePreview[]
  isFull?: boolean
  // Pricing
  isFree?: boolean
  price?: number | null  // in cents
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
}

// Format date for display (e.g., "Sat, Dec 14")
// For recurring events: Always show "Every [Day]" format since they happen weekly
// For one-time events: Show the actual event date
function formatEventDate(dateStr: string | null | undefined, dayName: string, isRecurring: boolean = false): string {
  // RECURRING EVENTS: Show "Every [Day]" format - the eventDate is just an anchor, not when it happens
  if (isRecurring) {
    const dayMap: Record<string, string> = {
      'Sundays': 'Every Sun', 'Mondays': 'Every Mon', 'Tuesdays': 'Every Tue',
      'Wednesdays': 'Every Wed', 'Thursdays': 'Every Thu', 'Fridays': 'Every Fri',
      'Saturdays': 'Every Sat'
    }
    return dayMap[dayName] || dayName // Fallback to day name for "Monthly", "Various", etc.
  }

  // ONE-TIME EVENTS: Show the actual event date
  if (!dateStr) {
    return dayName // Fallback for events without dates
  }

  try {
    const date = new Date(dateStr)
    // Check if date is valid
    if (isNaN(date.getTime())) return dayName

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dayName
  }
}

interface EventCardProps {
  event: Event
  index?: number
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

// Memoized component to prevent unnecessary re-renders
export const EventCard = memo(function EventCard({ event, index = 0 }: EventCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isGoing, setIsGoing] = useState(false)
  const [goingCount] = useState(event.goingCount || 0)
  const [heartAnimate, setHeartAnimate] = useState(false)

  const emoji = categoryEmojis[event.category] || '✨'

  // Load saved/going state from localStorage - deferred to avoid blocking render
  useEffect(() => {
    const loadState = () => {
      const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
      setIsSaved(saved.includes(event.id))

      const going = safeGetJSON<string[]>('sweatbuddies_going', [])
      setIsGoing(going.includes(event.id))
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(loadState)
    } else {
      setTimeout(loadState, 0)
    }
  }, [event.id])

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])

    if (isSaved) {
      const newSaved = saved.filter((id: string) => id !== event.id)
      safeSetJSON('sweatbuddies_saved', newSaved)
    } else {
      safeSetJSON('sweatbuddies_saved', [...saved, event.id])
      setHeartAnimate(true)
      setTimeout(() => setHeartAnimate(false), 600)
    }

    setIsSaved(!isSaved)
    window.dispatchEvent(new Event('savedEventsUpdated'))
  }

  // Generate event URL using slug or ID
  const eventUrl = `/event/${event.slug || event.id}`

  return (
    <>
      <Link
        href={eventUrl}
        className="group h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl cursor-pointer card-hover-lift card-hover-glow active:scale-[0.98]"
        style={{
          // CSS animation for staggered fade-in
          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
        }}
      >
        {/* Image Section - Clean square aspect ratio, contain to show full image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 image-zoom-container">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              loading="lazy"
              className="object-contain image-zoom"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{emoji}</span>
            </div>
          )}

          {/* FULL Badge - Top Left */}
          {event.isFull && (
            <div className="absolute top-2 left-2 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
              FULL
            </div>
          )}

          {/* Price Badge - Top Left (below FULL if present) */}
          {event.price && event.price > 0 ? (
            <div className={`absolute ${event.isFull ? 'top-10' : 'top-2'} left-2 px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-sm`}>
              ${(event.price / 100).toFixed(0)}
            </div>
          ) : (event.isFree !== false) && (
            <div className={`absolute ${event.isFull ? 'top-10' : 'top-2'} left-2 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm`}>
              Free
            </div>
          )}

          {/* Save Button - Top Right (minimal heart) */}
          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isSaved
                ? 'text-neutral-900'
                : 'text-white hover:text-white/80'
            } ${heartAnimate ? 'animate-heartbeat' : ''}`}
            style={{
              filter: isSaved ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
          >
            <Heart className={`w-6 h-6 ${isSaved ? 'fill-neutral-900 stroke-neutral-900' : 'stroke-2'}`} />
          </button>

          {/* Weekly Badge - Bottom Left (subtle) */}
          {event.recurring && (
            <div className="absolute bottom-3 left-3">
              <span
                className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 rounded-md"
                title="This happens every week—same time, same place"
              >
                Weekly
              </span>
            </div>
          )}
        </div>

        {/* Content Section - Clean minimalist typography */}
        <div className="flex-1 flex flex-col pt-3 pb-2">
          {/* Host - Lead with the people */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Hosted by @{event.organizer}
          </p>

          {/* Event Name */}
          <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white leading-tight line-clamp-1 mb-1.5">
            {event.name}
          </h3>

          {/* Date & Time */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-0.5">
            {formatEventDate(event.eventDate, event.day, event.recurring)} · {event.time}
          </p>

          {/* Location */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 mb-4">
            {event.location}
          </p>

          {/* Attendees & Price */}
          <div className="mt-auto flex items-center justify-between">
            {/* Going count */}
            <div className="flex items-center gap-2">
              {event.attendeesPreview && event.attendeesPreview.length > 0 && (
                <AvatarStack
                  attendees={event.attendeesPreview}
                  maxDisplay={3}
                  size="sm"
                  showCount={goingCount > 3}
                />
              )}
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {goingCount === 0 ? (
                  'Open spots'
                ) : (
                  <>
                    <LiveCounter value={goingCount} className="font-medium text-neutral-700 dark:text-neutral-300" /> going
                  </>
                )}
              </span>
            </div>

            {/* Status indicator */}
            {isGoing && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ Going
              </span>
            )}
          </div>
        </div>
      </Link>
    </>
  )
})
