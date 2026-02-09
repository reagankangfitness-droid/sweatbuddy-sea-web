'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ViewToggle } from '@/components/map/ViewToggle'

const ActivityMapView = dynamic(
  () => import('@/components/map/ActivityMapView').then((m) => m.ActivityMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
        <div className="w-12 h-12 border-3 border-gray-200 dark:border-neutral-700 border-t-pink-500 rounded-full animate-spin" />
      </div>
    ),
  }
)
import { EventCardCompact } from '@/components/map/EventCardCompact'
import type { NeighborhoodOverview, MapOverviewResponse, NeighborhoodEvent } from '@/types/neighborhood'

type TimeRange = 'today' | 'weekend' | 'week' | 'month'
type ViewMode = 'map' | 'list'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  weekend: 'This Weekend',
  week: 'This Week',
  month: 'This Month',
}

export default function ExplorePage() {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOverview[]>([])
  const [summary, setSummary] = useState<{
    totalEvents: number
    totalAttendees: number
    hotSpot: { id: string; name: string } | null
  }>({ totalEvents: 0, totalAttendees: 0, hotSpot: null })
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [isLoading, setIsLoading] = useState(true)
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false)
  const [allEvents, setAllEvents] = useState<NeighborhoodEvent[]>([])

  // Fetch map overview
  useEffect(() => {
    async function fetchOverview() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/map/overview?timeRange=${timeRange}`)
        const data: MapOverviewResponse = await res.json()

        if (data.success) {
          setNeighborhoods(data.data.neighborhoods)
          setSummary(data.data.summary)
        }
      } catch {
        // Error handled silently
      } finally {
        setIsLoading(false)
      }
    }

    fetchOverview()
  }, [timeRange])

  // Fetch all events for list view
  useEffect(() => {
    if (viewMode !== 'list') return

    async function fetchAllEvents() {
      try {
        // Fetch events from all neighborhoods with events
        const neighborhoodsWithEvents = neighborhoods.filter((n) => n.eventCount > 0)
        const eventPromises = neighborhoodsWithEvents.map((n) =>
          fetch(`/api/map/neighborhoods/${n.id}/events?timeRange=${timeRange}&limit=50`)
            .then((res) => res.json())
            .then((data) => (data.success ? data.data.events : []))
        )

        const eventArrays = await Promise.all(eventPromises)
        const events = eventArrays.flat()

        // Sort by datetime
        events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
        setAllEvents(events)
      } catch {
        // Error handled silently
      }
    }

    if (neighborhoods.length > 0) {
      fetchAllEvents()
    }
  }, [viewMode, neighborhoods, timeRange])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>

            <h1 className="font-bold text-lg text-neutral-900 dark:text-white">Explore Experiences</h1>

            {/* Time range selector */}
            <div className="relative">
              <button
                onClick={() => setShowTimeRangePicker(!showTimeRangePicker)}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-sm font-medium transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-700 dark:text-neutral-300">{TIME_RANGE_LABELS[timeRange]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* Time range dropdown */}
              {showTimeRangePicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTimeRangePicker(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[140px] z-50">
                    {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setTimeRange(range)
                          setShowTimeRangePicker(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                          timeRange === range
                            ? 'font-semibold text-neutral-900 dark:text-white'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {TIME_RANGE_LABELS[range]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto">
        {/* View toggle bar */}
        <div className="px-4 py-3 flex justify-center">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
        </div>

        {viewMode === 'map' ? (
          /* Map View - Individual event markers */
          <div style={{ height: 'calc(100vh - 110px)' }}>
            <ActivityMapView
              timeRange={timeRange}
              onToggleView={() => setViewMode('list')}
            />
          </div>
        ) : (
          /* List View */
          <div className="px-4 pb-8">
            {/* Stats summary */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-4 mb-6">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{summary.totalEvents}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Experiences</p>
                </div>
                <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{summary.totalAttendees}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Attendees</p>
                </div>
                <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {neighborhoods.filter((n) => n.eventCount > 0).length}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Areas</p>
                </div>
              </div>
            </div>

            {/* Events list */}
            {allEvents.length > 0 ? (
              <div className="space-y-3">
                {allEvents.map((event) => (
                  <EventCardCompact key={event.id} event={event} />
                ))}
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-3 bg-white dark:bg-neutral-800 rounded-2xl">
                    <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-600 rounded" />
                      <div className="h-3 w-1/3 bg-neutral-100 dark:bg-neutral-600 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl">
                <p className="text-neutral-500 dark:text-neutral-400">No experiences found for {TIME_RANGE_LABELS[timeRange].toLowerCase()}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
