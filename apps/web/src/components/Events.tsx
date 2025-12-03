'use client'

import { useState, useMemo } from 'react'
import { EventCard } from './EventCard'
import { SectionGradient } from './GradientBackground'
import eventsData from '@/data/events.json'
import { Search, X, Filter, Sparkles } from 'lucide-react'

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

// Get unique categories from events
const categories = [...new Set(eventsData.events.map(e => e.category))].sort()

// Get unique days from events
const days = [...new Set(eventsData.events.map(e => e.day))].sort((a, b) => {
  const dayOrder = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays', 'Monthly', 'Various', 'Special Events']
  return dayOrder.indexOf(a) - dayOrder.indexOf(b)
})

export function Events() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')

  const filteredEvents = useMemo(() => {
    return eventsData.events.filter(event => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = searchQuery === '' ||
        event.name.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        (event.description?.toLowerCase().includes(searchLower)) ||
        event.organizer.toLowerCase().includes(searchLower)

      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
      const matchesDay = selectedDay === 'all' || event.day === selectedDay

      return matchesSearch && matchesCategory && matchesDay
    })
  }, [searchQuery, selectedCategory, selectedDay])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedDay('all')
  }

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedDay !== 'all'

  return (
    <section id="events" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F] via-[#0A0F18] to-[#080A0F]" />
      <SectionGradient />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3CCFBB]/10 border border-[#3CCFBB]/20 text-[#3CCFBB] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Updated Weekly</span>
          </div>
          <h2
            className="font-heading font-extrabold text-white mb-4 tracking-wide"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            What&apos;s On <span className="text-gradient">This Week</span>
          </h2>
          <p className="font-body text-white/50 text-lg">
            Singapore • {getCurrentWeekRange()}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-10 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, locations, organizers..."
              className="w-full h-14 pl-14 pr-14 rounded-2xl input-dark text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-11 pl-4 pr-10 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80 focus:outline-none focus:border-[#3CCFBB] cursor-pointer appearance-none transition-colors hover:bg-white/10"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>

            {/* Day Filter */}
            <div className="relative">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="h-11 pl-4 pr-10 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80 focus:outline-none focus:border-[#3CCFBB] cursor-pointer appearance-none transition-colors hover:bg-white/10"
              >
                <option value="all">All Days</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-11 px-5 rounded-full bg-[#3CCFBB] text-[#080A0F] text-sm font-semibold hover:bg-[#3CCFBB]/90 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results Count */}
          {hasActiveFilters && (
            <p className="text-center text-sm text-white/50">
              Showing {filteredEvents.length} of {eventsData.events.length} events
            </p>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-2xl max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
              🔍
            </div>
            <h3 className="font-heading font-bold text-white mb-3 text-xl tracking-wide">No events found</h3>
            <p className="font-body text-white/50 mb-6">Try adjusting your search or filters</p>
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
          <p className="text-white/50 mb-3">
            More events added every Wednesday
          </p>
          <a
            href="https://instagram.com/adidassg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#3CCFBB] font-medium hover:underline underline-offset-4"
          >
            Follow @adidassg for updates
            <span className="text-lg">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
