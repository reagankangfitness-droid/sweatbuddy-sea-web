'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import { FeaturedEventsCarousel } from './FeaturedEventsCarousel'
import { QuickFilters } from './QuickFilters'
import { EventListCard } from './EventListCard'
import type { Event } from '@/lib/events'

// Lazy load EventDetailSheet - only loaded when user taps an event
const EventDetailSheet = lazy(() => import('./EventDetailSheet').then(mod => ({ default: mod.EventDetailSheet })))

interface Props {
  events: Event[]
}

// Get current week date range string
function getWeekDateRange(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`
}

// Check if event is today
function isEventToday(event: Event): boolean {
  const today = new Date()
  const dayNames = ['sunday', 'sundays', 'monday', 'mondays', 'tuesday', 'tuesdays',
    'wednesday', 'wednesdays', 'thursday', 'thursdays', 'friday', 'fridays',
    'saturday', 'saturdays']
  const todayDayName = dayNames[today.getDay() * 2].toLowerCase()
  const eventDay = event.day.toLowerCase()

  // Check recurring events
  if (eventDay.includes(todayDayName) || eventDay.includes(todayDayName + 's')) {
    return true
  }

  // Check specific date events
  if (event.eventDate) {
    const eventDate = new Date(event.eventDate)
    return eventDate.toDateString() === today.toDateString()
  }

  return false
}

// Check if event is on weekend
function isEventWeekend(event: Event): boolean {
  const weekendDays = ['saturday', 'saturdays', 'sunday', 'sundays', 'sat', 'sun']
  const eventDay = event.day.toLowerCase()

  // Check recurring events
  if (weekendDays.some(d => eventDay.includes(d))) {
    return true
  }

  // Check specific date events
  if (event.eventDate) {
    const eventDate = new Date(event.eventDate)
    const day = eventDate.getDay()
    return day === 0 || day === 6
  }

  return false
}

export function MobileEventsSection({ events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [filter, setFilter] = useState('all')

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter === 'all') return true
      if (filter === 'today') return isEventToday(event)
      if (filter === 'weekend') return isEventWeekend(event)

      // Category filters
      const categoryLower = event.category.toLowerCase()
      if (filter === 'run') return categoryLower.includes('run')
      if (filter === 'yoga') return categoryLower.includes('yoga')
      if (filter === 'hiit') return categoryLower.includes('hiit') || categoryLower.includes('bootcamp')
      if (filter === 'social') return categoryLower.includes('social')

      return true
    })
  }, [events, filter])

  // Featured events are first 5 with images
  const featuredEvents = useMemo(() => {
    return events.filter(e => e.imageUrl).slice(0, 5)
  }, [events])

  return (
    <div id="events" className="md:hidden pt-4 pb-4">
      {/* Featured Carousel */}
      <FeaturedEventsCarousel
        events={featuredEvents.length > 0 ? featuredEvents : events.slice(0, 5)}
        onSelect={setSelectedEvent}
      />

      {/* Divider */}
      <div className="h-0.5 bg-navy/10 mx-4 my-6" />

      {/* Section Header */}
      <div className="px-4 mb-4">
        <h2 className="font-display text-xl font-bold text-navy">This Week</h2>
        <p className="text-sm text-navy/50">{getWeekDateRange()}</p>
      </div>

      {/* Quick Filters */}
      <QuickFilters onSelect={setFilter} activeFilter={filter} />

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
          <div className="text-center py-12 text-navy/40">
            <p className="text-4xl mb-2">🔍</p>
            <p className="font-medium">No events match this filter</p>
            <button
              onClick={() => setFilter('all')}
              className="mt-3 text-terracotta font-semibold text-sm"
            >
              Show all events
            </button>
          </div>
        )}
      </div>

      {/* More events prompt */}
      <div className="px-4 mt-6">
        <div
          className="bg-sand p-4 text-center border-2 border-navy"
          style={{ boxShadow: '4px 4px 0px 0px #0F172A' }}
        >
          <p className="text-sm text-navy/70 mb-3">
            More events added every Wednesday
          </p>
          <a
            href="https://instagram.com/_sweatbuddies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta font-semibold text-sm"
          >
            📸 Follow @_sweatbuddies for updates
          </a>
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
