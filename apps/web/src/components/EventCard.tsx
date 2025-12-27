'use client'

import { useState, useEffect, lazy, Suspense, memo } from 'react'
import Image from 'next/image'
import { Heart, MapPin, Calendar, ArrowRight } from 'lucide-react'

// Lazy load the bottom sheet - only loaded when user taps a card
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

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
  isFull?: boolean
  // Pricing
  isFree?: boolean
  price?: number | null  // in cents
}

// Format date for display (e.g., "Sat, Dec 14")
function formatEventDate(dateStr: string | null | undefined, dayName: string): string {
  if (!dateStr) {
    // For recurring events, show the next occurrence day
    const dayMap: Record<string, number> = {
      'Sundays': 0, 'Mondays': 1, 'Tuesdays': 2, 'Wednesdays': 3,
      'Thursdays': 4, 'Fridays': 5, 'Saturdays': 6
    }
    const dayNum = dayMap[dayName]
    if (dayNum !== undefined) {
      const today = new Date()
      const daysUntil = (dayNum - today.getDay() + 7) % 7 || 7 // Next occurrence
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysUntil)
      return nextDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
    return dayName // Fallback for "Monthly", "Various", etc.
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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isGoing, setIsGoing] = useState(false)
  const [goingCount, setGoingCount] = useState(event.goingCount || 0)

  const emoji = categoryEmojis[event.category] || '✨'

  // Load saved/going state from localStorage - deferred to avoid blocking render
  useEffect(() => {
    // Use requestIdleCallback for non-critical localStorage reads
    const loadState = () => {
      if (typeof window !== 'undefined') {
        const saved = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
        setIsSaved(saved.includes(event.id))

        const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
        setIsGoing(going.includes(event.id))
      }
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadState)
    } else {
      setTimeout(loadState, 0)
    }
  }, [event.id])

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const saved = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')

    if (isSaved) {
      const newSaved = saved.filter((id: string) => id !== event.id)
      localStorage.setItem('sweatbuddies_saved', JSON.stringify(newSaved))
    } else {
      localStorage.setItem('sweatbuddies_saved', JSON.stringify([...saved, event.id]))
    }

    setIsSaved(!isSaved)
    window.dispatchEvent(new Event('savedEventsUpdated'))
  }

  const handleGoingClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isGoing) {
      // Toggle off
      const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
      const newGoing = going.filter((id: string) => id !== event.id)
      localStorage.setItem('sweatbuddies_going', JSON.stringify(newGoing))
      setIsGoing(false)
      setGoingCount(Math.max(0, goingCount - 1))
    } else {
      // Open sheet to collect info
      setIsSheetOpen(true)
    }
  }

  const handleGoingSuccess = () => {
    setIsGoing(true)
    setGoingCount(goingCount + 1)
  }

  return (
    <>
      <div
        onClick={() => setIsSheetOpen(true)}
        className="h-full flex flex-col bg-white rounded-xl cursor-pointer transition-all duration-250 hover:shadow-card-hover active:scale-[0.98]"
        style={{
          // CSS animation for staggered fade-in
          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
        }}
      >
        {/* Image Section - Clean square aspect ratio, contain to show full image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              loading="lazy"
              className="object-contain transition-transform duration-250 group-hover:scale-105"
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
          {!event.isFree && event.price && event.price > 0 && (
            <div className={`absolute ${event.isFull ? 'top-10' : 'top-2'} left-2 px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-sm`}>
              ${(event.price / 100).toFixed(0)}
            </div>
          )}

          {/* Save Button - Top Right (minimal heart) */}
          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isSaved
                ? 'text-neutral-900'
                : 'text-white hover:text-white/80'
            }`}
            style={{
              filter: isSaved ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
          >
            <Heart className={`w-6 h-6 ${isSaved ? 'fill-neutral-900 stroke-neutral-900' : 'stroke-2'}`} />
          </button>

          {/* Weekly Badge - Bottom Left (subtle) */}
          {event.recurring && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-neutral-700 rounded-md">
                Weekly
              </span>
            </div>
          )}
        </div>

        {/* Content Section - Clean minimalist typography */}
        <div className="flex-1 flex flex-col pt-3 pb-2">
          {/* Category - subtle, uppercase */}
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
            {event.category}
          </span>

          {/* Event Name */}
          <h3 className="text-[15px] font-semibold text-neutral-900 leading-tight line-clamp-1 mb-1">
            {event.name}
          </h3>

          {/* Date & Time */}
          <p className="text-sm text-neutral-500 mb-0.5">
            {formatEventDate(event.eventDate, event.day)} · {event.time}
          </p>

          {/* Location */}
          <p className="text-sm text-neutral-500 line-clamp-1 mb-4">
            {event.location}
          </p>

          {/* Going Count / CTA - clean black button */}
          <div className="mt-auto">
            {isGoing ? (
              <button
                onClick={handleGoingClick}
                className="w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2 bg-success-light text-success rounded-lg transition-all"
              >
                <span>✓ You&apos;re Going</span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                {goingCount > 0 && (
                  <span className="text-xs text-neutral-400">
                    {goingCount === 1 ? '1 going' : `${goingCount} going`}
                  </span>
                )}
                <button
                  onClick={handleGoingClick}
                  className="flex-1 py-2.5 font-semibold text-sm flex items-center justify-center gap-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-all active:scale-[0.98]"
                >
                  <span>Join</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sheet - Only rendered when opened (lazy loaded) */}
      {isSheetOpen && (
        <Suspense fallback={null}>
          <EventDetailSheet
            event={event}
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            onGoingSuccess={handleGoingSuccess}
          />
        </Suspense>
      )}
    </>
  )
})
