'use client'

import { useState, useMemo, useEffect, lazy, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { EventCard } from './EventCard'
import { SavedEvents } from './SavedEvents'
import { SectionGradient } from './GradientBackground'
import { Search, X, Sparkles } from 'lucide-react'
import { sortEventsByPreference, getPersonalizedGreeting, hasCompletedOnboarding } from '@/lib/personalization'

// Lazy load the detail sheet for shared events
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

// Separate component for shared event handling (needs useSearchParams)
function SharedEventHandler({ events, onEventFound }: { events: Event[], onEventFound: (event: Event) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const eventId = searchParams.get('event')
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId)
      if (event) {
        onEventFound(event)
        // Scroll to events section
        const eventsSection = document.getElementById('events')
        if (eventsSection) {
          setTimeout(() => {
            eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      }
    }
  }, [searchParams, events, onEventFound])

  return null
}

interface Event {
  id: string
  name: string
  category: string
  day: string
  eventDate?: string | null  // ISO date string (e.g., "2024-01-15")
  time: string
  location: string
  description: string | null
  organizer: string
  imageUrl: string | null
  recurring: boolean
  goingCount?: number
}

interface EventsProps {
  initialEvents?: Event[]
}

function getCurrentWeekRange() {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`
}

// Time filter options
type TimeFilter = 'all' | 'this-week' | 'this-weekend' | 'next-week'

function getDateRangeForFilter(filter: TimeFilter): { start: Date | null, end: Date | null } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  switch (filter) {
    case 'this-week': {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      return { start: startOfWeek, end: endOfWeek }
    }
    case 'this-weekend': {
      const saturday = new Date(now)
      saturday.setDate(now.getDate() + (6 - now.getDay()))
      const sunday = new Date(saturday)
      sunday.setDate(saturday.getDate() + 1)
      sunday.setHours(23, 59, 59, 999)
      return { start: saturday, end: sunday }
    }
    case 'next-week': {
      const nextMonday = new Date(now)
      nextMonday.setDate(now.getDate() + (7 - now.getDay() + 1))
      const nextSunday = new Date(nextMonday)
      nextSunday.setDate(nextMonday.getDate() + 6)
      nextSunday.setHours(23, 59, 59, 999)
      return { start: nextMonday, end: nextSunday }
    }
    default:
      return { start: null, end: null }
  }
}

function isEventInDateRange(event: { eventDate?: string | null, day: string }, filter: TimeFilter): boolean {
  if (filter === 'all') return true

  const { start, end } = getDateRangeForFilter(filter)
  if (!start || !end) return true

  // If event has a specific date, check if it's in range
  if (event.eventDate) {
    const eventDate = new Date(event.eventDate)
    return eventDate >= start && eventDate <= end
  }

  // For recurring events without specific date, check if the day falls within the range
  const dayMap: Record<string, number> = {
    'Sundays': 0, 'Mondays': 1, 'Tuesdays': 2, 'Wednesdays': 3,
    'Thursdays': 4, 'Fridays': 5, 'Saturdays': 6
  }

  const dayNum = dayMap[event.day]
  if (dayNum === undefined) return true // Show "Monthly", "Various", etc in all filters

  // Check if the day of week falls within the date range
  const current = new Date(start)
  while (current <= end) {
    if (current.getDay() === dayNum) return true
    current.setDate(current.getDate() + 1)
  }
  return false
}

export function Events({ initialEvents = [] }: EventsProps) {
  const [events] = useState<Event[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('all')
  const [greeting, setGreeting] = useState<string>("What's On This Week")
  const [isPersonalized, setIsPersonalized] = useState(false)

  // Shared event handling
  const [sharedEvent, setSharedEvent] = useState<Event | null>(null)
  const [isSharedSheetOpen, setIsSharedSheetOpen] = useState(false)

  const handleSharedEventFound = useCallback((event: Event) => {
    setSharedEvent(event)
    setIsSharedSheetOpen(true)
  }, [])

  // Update greeting and personalization status
  useEffect(() => {
    const updateGreeting = () => {
      if (hasCompletedOnboarding()) {
        setGreeting(getPersonalizedGreeting())
        setIsPersonalized(true)
      } else {
        setGreeting("What's On This Week")
        setIsPersonalized(false)
      }
    }

    updateGreeting()

    // Listen for preference updates
    window.addEventListener('preferencesUpdated', updateGreeting)
    return () => window.removeEventListener('preferencesUpdated', updateGreeting)
  }, [])

  // Get unique categories from events
  const categories = useMemo(() => {
    return [...new Set(events.map(e => e.category))].sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = searchQuery === '' ||
        event.name.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        (event.description?.toLowerCase().includes(searchLower)) ||
        event.organizer.toLowerCase().includes(searchLower)

      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
      const matchesTime = isEventInDateRange(event, selectedTime)

      return matchesSearch && matchesCategory && matchesTime
    })

    // Sort by user preferences if personalized
    if (isPersonalized) {
      return sortEventsByPreference(filtered)
    }
    return filtered
  }, [events, searchQuery, selectedCategory, selectedTime, isPersonalized])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedTime('all')
  }

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedTime !== 'all'

  return (
    <section id="events" className="relative py-20 md:py-32 overflow-hidden" style={{ background: '#f0f4fa' }}>
      {/* Shared Event Handler - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <SharedEventHandler events={events} onEventFound={handleSharedEventFound} />
      </Suspense>

      {/* Subtle blue glow accent */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(52, 119, 248, 0.06) 0%, transparent 50%)' }} />
      <SectionGradient />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Saved Events Section */}
        <SavedEvents allEvents={events} />

        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3477f8]/10 border border-[#3477f8]/20 text-[#3477f8] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>{isPersonalized ? 'Personalized For You' : 'Updated Weekly'}</span>
          </div>
          <h2
            className="font-heading font-extrabold text-[#0d1520] mb-4 tracking-wide"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            {isPersonalized ? (
              <>{greeting}</>
            ) : (
              <>What&apos;s On <span className="text-gradient">This Week</span></>
            )}
          </h2>
          <p className="font-body text-[#5a6b7a] text-lg">
            Singapore • {getCurrentWeekRange()}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-10 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6b7a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, locations, organizers..."
              className="w-full h-14 pl-14 pr-14 rounded-2xl input-light text-base shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#5a6b7a] hover:text-[#3477f8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 px-4 rounded-lg bg-white border border-[#e0e7ef] text-sm font-medium text-[#0d1520] focus:outline-none focus:border-[#3477f8] focus:ring-2 focus:ring-[#3477f8]/20 cursor-pointer transition-colors hover:border-[#c0cad5] shadow-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Time Filter */}
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value as TimeFilter)}
              className="h-11 px-4 rounded-lg bg-white border border-[#e0e7ef] text-sm font-medium text-[#0d1520] focus:outline-none focus:border-[#3477f8] focus:ring-2 focus:ring-[#3477f8]/20 cursor-pointer transition-colors hover:border-[#c0cad5] shadow-sm"
            >
              <option value="all">All Times</option>
              <option value="this-week">This Week</option>
              <option value="this-weekend">This Weekend</option>
              <option value="next-week">Next Week</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-11 px-5 rounded-lg bg-[#3477f8] text-white text-sm font-semibold hover:bg-[#2563eb] transition-all flex items-center gap-2 shadow-sm"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results Count */}
          {hasActiveFilters && (
            <p className="text-center text-sm text-[#5a6b7a]">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-2xl max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#3477f8]/10 flex items-center justify-center text-3xl">
              🔍
            </div>
            <h3 className="font-heading font-bold text-[#0d1520] mb-3 text-xl tracking-wide">No events found</h3>
            <p className="font-body text-[#5a6b7a] mb-6">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              <span>Clear all filters</span>
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-[#5a6b7a] mb-3">
            More events added every Wednesday
          </p>
          <a
            href="https://www.instagram.com/_sweatbuddies/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#3477f8] font-medium hover:underline underline-offset-4"
          >
            Follow @_sweatbuddies for updates
            <span className="text-lg">→</span>
          </a>
        </div>
      </div>

      {/* Shared Event Detail Sheet */}
      {sharedEvent && isSharedSheetOpen && (
        <Suspense fallback={null}>
          <EventDetailSheet
            event={sharedEvent}
            isOpen={isSharedSheetOpen}
            onClose={() => {
              setIsSharedSheetOpen(false)
              // Clear the URL parameter without reload
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                url.searchParams.delete('event')
                window.history.replaceState({}, '', url.toString())
              }
            }}
          />
        </Suspense>
      )}
    </section>
  )
}
