'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import { FeaturedEventsCarousel } from './FeaturedEventsCarousel'
import { EventListCard } from './EventListCard'
import type { Event } from '@/lib/events'

// Lazy load EventDetailSheet - only loaded when user taps an event
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

interface Props {
  events: Event[]
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'weekend' | 'next-week'

// Date filtering helpers - uses browser's local timezone automatically
// new Date() creates a date in the user's local timezone
function getDateFilters() {
  const now = new Date() // User's local timezone
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

// Parse date string (YYYY-MM-DD) to local date at midnight
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function filterEventsByDate(events: Event[], filter: DateFilter): Event[] {
  if (filter === 'all') return events

  const { today, tomorrow, saturday, sunday, nextMonday, nextSunday } = getDateFilters()

  return events.filter(event => {
    // Recurring events show in all filters
    if (event.recurring) return true

    // Events without a date don't match specific date filters
    if (!event.eventDate) return false

    // Parse the date string as local date to avoid timezone issues
    const eventDate = parseLocalDate(event.eventDate)

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

export function MobileEventsSection({ events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [activeFilter, setActiveFilter] = useState<DateFilter>('all')

  // Featured events are first 5 with images
  const featuredEvents = useMemo(() => {
    return events.filter(e => e.imageUrl).slice(0, 5)
  }, [events])

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    return filterEventsByDate(events, activeFilter)
  }, [events, activeFilter])

  const filters: DateFilter[] = ['all', 'today', 'tomorrow', 'weekend', 'next-week']

  return (
    <div id="events-mobile" className="md:hidden pt-4 pb-4">
      {/* Featured Carousel */}
      <FeaturedEventsCarousel
        events={featuredEvents.length > 0 ? featuredEvents : events.slice(0, 5)}
        onSelect={setSelectedEvent}
      />

      {/* Divider */}
      <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-4 my-6" />

      {/* Section Header */}
      <div className="px-4 mb-4">
        <h2 className="font-sans text-xl font-bold text-neutral-900 dark:text-white">Upcoming Events</h2>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="px-4 mt-4 space-y-3">
        {filteredEvents.map((event) => (
          <EventListCard
            key={event.id}
            event={event}
            onSelect={setSelectedEvent}
          />
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <p className="text-4xl mb-2">🏃</p>
            <p className="font-medium">No events {activeFilter === 'all' ? 'yet' : getFilterLabel(activeFilter).toLowerCase()}</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        )}
      </div>

      {/* More events prompt */}
      <div className="px-4 mt-6">
        <div className="bg-white dark:bg-neutral-900 p-4 text-center rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-card">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            More events added every Wednesday
          </p>
        </div>
      </div>

      {/* Event Detail Sheet - Lazy loaded */}
      {selectedEvent && (
        <Suspense fallback={null}>
          <EventDetailSheet
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
