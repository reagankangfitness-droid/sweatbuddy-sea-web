'use client'

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { EventCard } from './EventCard'
import { CategoryBar, categoryMapping } from './CategoryBar'

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
  eventDate?: string | null
  time: string
  location: string
  description: string | null
  organizer: string
  imageUrl: string | null
  communityLink?: string | null
  recurring: boolean
  goingCount?: number
  isFull?: boolean
  isFree?: boolean
  price?: number | null
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
}

interface EventsProps {
  initialEvents?: Event[]
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'weekend' | 'next-week'

// Date filtering helpers
function getDateFilters() {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get this weekend (Saturday and Sunday)
  const dayOfWeek = today.getDay()
  const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek
  const saturday = new Date(today)
  saturday.setDate(today.getDate() + daysUntilSaturday)
  const sunday = new Date(saturday)
  sunday.setDate(saturday.getDate() + 1)

  // Next week is Monday to Sunday after this week
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilNextMonday)
  const nextSunday = new Date(nextMonday)
  nextSunday.setDate(nextMonday.getDate() + 6)

  return { today, tomorrow, saturday, sunday, nextMonday, nextSunday }
}

function filterEventsByDate(events: Event[], filter: DateFilter): Event[] {
  if (filter === 'all') return events

  const { today, tomorrow, saturday, sunday, nextMonday, nextSunday } = getDateFilters()

  return events.filter(event => {
    // Recurring events show in all filters
    if (event.recurring) return true

    // Events without a date don't match specific date filters
    if (!event.eventDate) return false

    const eventDate = new Date(event.eventDate)
    eventDate.setHours(0, 0, 0, 0)

    switch (filter) {
      case 'today':
        return eventDate.getTime() === today.getTime()
      case 'tomorrow':
        return eventDate.getTime() === tomorrow.getTime()
      case 'weekend':
        return eventDate.getTime() === saturday.getTime() || eventDate.getTime() === sunday.getTime()
      case 'next-week':
        return eventDate >= nextMonday && eventDate <= nextSunday
      default:
        return true
    }
  })
}

function getFilterLabel(filter: DateFilter): string {
  switch (filter) {
    case 'all': return 'All'
    case 'today': return 'Today'
    case 'tomorrow': return 'Tomorrow'
    case 'weekend': return 'This weekend'
    case 'next-week': return 'Next week'
  }
}

export function Events({ initialEvents = [] }: EventsProps) {
  const [events] = useState<Event[]>(initialEvents)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>('all')

  const dateFilters: DateFilter[] = ['all', 'today', 'tomorrow', 'weekend', 'next-week']

  // Filter events based on selected category and date filter
  const filteredEvents = useMemo(() => {
    let result = events

    // Apply category filter
    if (selectedCategory !== 'all') {
      const categoryValues = categoryMapping[selectedCategory] || []
      if (categoryValues.length > 0) {
        result = result.filter(event =>
          categoryValues.some(cat =>
            event.category.toLowerCase().includes(cat.toLowerCase())
          )
        )
      }
    }

    // Apply date filter
    result = filterEventsByDate(result, activeDateFilter)

    return result
  }, [events, selectedCategory, activeDateFilter])

  // Shared event handling
  const [sharedEvent, setSharedEvent] = useState<Event | null>(null)
  const [isSharedSheetOpen, setIsSharedSheetOpen] = useState(false)

  const handleSharedEventFound = useCallback((event: Event) => {
    setSharedEvent(event)
    setIsSharedSheetOpen(true)
  }, [])

  return (
    <section id="events" className="relative py-20 md:py-32 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Shared Event Handler - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <SharedEventHandler events={events} onEventFound={handleSharedEventFound} />
      </Suspense>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white mb-2">
            Upcoming Events
          </h2>
          <p className="text-neutral-500 dark:text-neutral-300">
            Find your next workout in Singapore
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {dateFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveDateFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeDateFilter === filter
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>

        {/* Category Filter Bar */}
        <div className="mb-8">
          <CategoryBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl max-w-md mx-auto">
            <span className="text-5xl mb-4 block">🔍</span>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-lg">
              No events {activeDateFilter !== 'all' ? getFilterLabel(activeDateFilter).toLowerCase() : ''} {selectedCategory !== 'all' ? `in ${selectedCategory}` : ''}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-300 max-w-sm mx-auto px-4 mb-4">
              Check back soon or try different filters.
            </p>
            {(selectedCategory !== 'all' || activeDateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setActiveDateFilter('all')
                }}
                className="text-neutral-900 dark:text-white font-medium hover:underline"
              >
                View all events
              </button>
            )}
          </div>
        )}

        {/* Simple CTA */}
        <div className="text-center mt-12">
          <p className="text-neutral-500 dark:text-neutral-300 text-sm">
            New events added weekly
          </p>
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

