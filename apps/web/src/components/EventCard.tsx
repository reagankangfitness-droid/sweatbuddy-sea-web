'use client'

import { useState, useEffect, lazy, Suspense, memo } from 'react'
import Image from 'next/image'
import { Heart, MapPin, Calendar, ArrowRight } from 'lucide-react'

// Lazy load the bottom sheet - only loaded when user taps a card
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

interface Event {
  id: string
  name: string
  category: string
  day: string
  eventDate?: string | null  // ISO date string (e.g., "2024-01-15")
  time: string
  location: string
  description?: string | null
  organizer: string
  imageUrl?: string | null
  recurring: boolean
  goingCount?: number
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

// Color variations for brutal cards
const cardColors = [
  { shadow: '#E07A5F', accent: 'terracotta' },  // terracotta
  { shadow: '#4F46E5', accent: 'electric' },     // electric
  { shadow: '#10B981', accent: 'mint' },         // mint
  { shadow: '#0F172A', accent: 'navy' },         // navy
]

// Memoized component to prevent unnecessary re-renders
export const EventCard = memo(function EventCard({ event, index = 0 }: EventCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isGoing, setIsGoing] = useState(false)
  const [goingCount, setGoingCount] = useState(event.goingCount || 0)

  const emoji = categoryEmojis[event.category] || '✨'
  const colorScheme = cardColors[index % cardColors.length]

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
        className="h-full flex flex-col bg-white border-2 border-navy cursor-pointer transition-all duration-150 hover:translate-x-[-3px] hover:translate-y-[-3px] active:translate-x-[2px] active:translate-y-[2px]"
        style={{
          boxShadow: `4px 4px 0px 0px ${colorScheme.shadow}`,
          // CSS animation for staggered fade-in
          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `6px 6px 0px 0px ${colorScheme.shadow}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `4px 4px 0px 0px ${colorScheme.shadow}`
        }}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] border-b-2 border-navy">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-cream flex items-center justify-center">
              <span className="text-6xl">{emoji}</span>
            </div>
          )}

          {/* Category Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1.5 bg-sand border-2 border-navy text-xs font-semibold text-navy"
              style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
            >
              {emoji} {event.category}
            </span>
          </div>

          {/* Save Button - Top Right */}
          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 w-9 h-9 border-2 border-navy flex items-center justify-center transition-all active:scale-90 ${
              isSaved
                ? 'bg-coral text-white'
                : 'bg-sand text-navy hover:bg-white'
            }`}
            style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>

          {/* Live Badge - Bottom Right (on image) */}
          {event.recurring && (
            <div className="absolute bottom-3 right-3">
              <span className="bg-mint text-navy px-3 py-1.5 border-2 border-navy text-xs font-bold flex items-center gap-1.5"
                style={{ boxShadow: '2px 2px 0px 0px #0F172A' }}
              >
                <span className="w-2 h-2 bg-navy rounded-full animate-pulse" />
                Recurring
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-4">
          {/* Event Name - fixed height for 2 lines */}
          <h3 className="font-display font-semibold text-lg text-navy mb-3 line-clamp-2 leading-tight min-h-[3rem]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {event.name}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-navy/70 mb-1">
            <Calendar className="w-4 h-4 text-terracotta flex-shrink-0" />
            <span className="font-medium">{formatEventDate(event.eventDate, event.day)}</span>
            <span className="text-navy/30">•</span>
            <span>{event.time}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-navy/70 mb-4">
            <MapPin className="w-4 h-4 text-terracotta flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          {/* Spacer to push button to bottom */}
          <div className="flex-1" />

          {/* CTA - Full Width Neo-Brutalist */}
          <button
            onClick={handleGoingClick}
            className={`w-full py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 border-2 border-navy ${
              isGoing
                ? 'bg-mint text-navy'
                : 'bg-terracotta text-white hover:translate-x-[-1px] hover:translate-y-[-1px]'
            }`}
            style={{
              boxShadow: isGoing ? '2px 2px 0px 0px #0F172A' : '3px 3px 0px 0px #0F172A',
            }}
          >
            {isGoing ? (
              <>
                <span>✓</span>
                <span>You&apos;re Going</span>
              </>
            ) : (
              <>
                <span>I&apos;m Going{goingCount > 0 && ` • ${goingCount}`}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
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
