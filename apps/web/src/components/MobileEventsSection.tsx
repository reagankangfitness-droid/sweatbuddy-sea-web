'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import { FeaturedEventsCarousel } from './FeaturedEventsCarousel'
import { EventListCard } from './EventListCard'
import { categoryMapping } from './CategoryBar'
import type { Event } from '@/lib/events'
// Simplified Singapore region filters
const areas = [
  { id: 'all', label: 'All Areas' },
  { id: 'central', label: 'Central', keywords: ['orchard', 'somerset', 'dhoby', 'city hall', 'raffles', 'marina', 'cbd', 'tanjong pagar', 'chinatown', 'bugis', 'fort canning', 'botanic', 'novena', 'newton', 'river valley', 'robertson', 'clarke quay', 'boat quay'] },
  { id: 'east', label: 'East', keywords: ['east coast', 'bedok', 'tampines', 'pasir ris', 'changi', 'katong', 'marine parade', 'siglap', 'eunos', 'paya lebar', 'geylang', 'kallang', 'sports hub', 'stadium'] },
  { id: 'west', label: 'West', keywords: ['jurong', 'clementi', 'buona vista', 'dover', 'west coast', 'queenstown', 'commonwealth', 'holland', 'bukit timah', 'beauty world', 'king albert', 'sixth avenue'] },
  { id: 'north', label: 'North', keywords: ['woodlands', 'sembawang', 'yishun', 'admiralty', 'ang mo kio', 'bishan', 'toa payoh', 'serangoon', 'hougang', 'kovan', 'punggol', 'sengkang'] },
  { id: 'sentosa', label: 'Sentosa', keywords: ['sentosa', 'siloso', 'palawan', 'tanjong beach', 'harbourfront', 'vivocity'] },
]

// Check if event location matches an area's keywords
function eventMatchesArea(event: Event, areaId: string): boolean {
  if (areaId === 'all') return true

  const area = areas.find(a => a.id === areaId)
  if (!area || !('keywords' in area) || !area.keywords) return false

  const locationLower = event.location.toLowerCase()

  // Check if any keyword appears in the event location
  return area.keywords.some((keyword: string) =>
    locationLower.includes(keyword.toLowerCase())
  )
}

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

// Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2, 'tues': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6,
}

// Get day number from event's day field (e.g., "Saturday" -> 6, "Every Wednesday" -> 3)
function getEventDayNumber(dayField: string): number | null {
  const normalized = dayField.toLowerCase().trim()

  // Check for direct match or "Every X" pattern
  for (const [name, num] of Object.entries(dayNameToNumber)) {
    if (normalized === name || normalized.includes(name)) {
      return num
    }
  }
  return null
}

function filterEventsByDate(events: Event[], filter: DateFilter): Event[] {
  if (filter === 'all') return events

  const { today, tomorrow, saturday, sunday, nextMonday, nextSunday } = getDateFilters()
  const todayDayNum = today.getDay()
  const tomorrowDayNum = tomorrow.getDay()

  return events.filter(event => {
    // Handle recurring events - filter by their scheduled day of week
    if (event.recurring) {
      const eventDayNum = getEventDayNumber(event.day)

      if (eventDayNum === null) return false // Can't determine day, hide it

      switch (filter) {
        case 'today':
          return eventDayNum === todayDayNum
        case 'tomorrow':
          return eventDayNum === tomorrowDayNum
        case 'weekend':
          return eventDayNum === 0 || eventDayNum === 6 // Sunday or Saturday
        case 'next-week':
          return true // Recurring events happen every week
        default:
          return true
      }
    }

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

const categories = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'running', label: 'Running', icon: '🏃' },
  { id: 'yoga', label: 'Yoga', icon: '🧘' },
  { id: 'hiit', label: 'HIIT', icon: '🔥' },
  { id: 'bootcamp', label: 'Bootcamp', icon: '💪' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
]

export function MobileEventsSection({ events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [activeFilter, setActiveFilter] = useState<DateFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedArea, setSelectedArea] = useState('all')

  // Featured events are first 5 with images
  const featuredEvents = useMemo(() => {
    return events.filter(e => e.imageUrl).slice(0, 5)
  }, [events])

  // Filter events based on date, category, and area
  const filteredEvents = useMemo(() => {
    let filtered = filterEventsByDate(events, activeFilter)

    // Apply category filter
    if (selectedCategory !== 'all') {
      const categoryValues = categoryMapping[selectedCategory] || []
      if (categoryValues.length > 0) {
        filtered = filtered.filter(event =>
          categoryValues.some(cat =>
            event.category.toLowerCase().includes(cat.toLowerCase())
          )
        )
      }
    }

    // Apply area filter
    if (selectedArea !== 'all') {
      filtered = filtered.filter(event => eventMatchesArea(event, selectedArea))
    }

    return filtered
  }, [events, activeFilter, selectedCategory, selectedArea])

  const filters: DateFilter[] = ['all', 'today', 'tomorrow', 'weekend', 'next-week']

  return (
    <div id="mobile-events" className="md:hidden pt-4 pb-4">
      {/* Featured Carousel */}
      <FeaturedEventsCarousel
        events={featuredEvents.length > 0 ? featuredEvents : events.slice(0, 5)}
        onSelect={setSelectedEvent}
      />

      {/* Divider */}
      <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-4 my-6" />

      {/* Section Header */}
      <div className="px-4 mb-4">
        <h2 className="font-sans text-xl font-bold text-neutral-900 dark:text-white">Upcoming Experiences</h2>
      </div>

      {/* Date Filter Tabs */}
      <div className="px-4 mb-3 overflow-x-auto scrollbar-hide">
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

      {/* Category Filter Tabs */}
      <div className="px-4 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Area Filter Tabs */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedArea === area.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {area.label}
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
            <p className="text-4xl mb-2">🔍</p>
            <p className="font-medium">
              No experiences{activeFilter !== 'all' ? ` ${getFilterLabel(activeFilter).toLowerCase()}` : ''}{selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}{selectedArea !== 'all' ? ` near ${areas.find(a => a.id === selectedArea)?.label || selectedArea}` : ''}
            </p>
            <p className="text-sm mt-2">Try different filters or check back soon!</p>
            {(selectedCategory !== 'all' || activeFilter !== 'all' || selectedArea !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setActiveFilter('all')
                  setSelectedArea('all')
                }}
                className="mt-3 text-neutral-900 dark:text-white font-medium underline"
              >
                View all experiences
              </button>
            )}
          </div>
        )}
      </div>

      {/* More events prompt */}
      <div className="px-4 mt-6">
        <div className="bg-white dark:bg-neutral-900 p-4 text-center rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-card">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            More experiences added every Wednesday
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
