'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, ChevronDown } from 'lucide-react'
import { NeighborhoodPin } from '@/components/map/NeighborhoodPin'
import { NeighborhoodDrawer } from '@/components/map/NeighborhoodDrawer'
import { MapSummaryBar } from '@/components/map/MapSummaryBar'
import { ViewToggle } from '@/components/map/ViewToggle'
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
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
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
      } catch (error) {
        console.error('Failed to fetch map overview:', error)
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
      } catch (error) {
        console.error('Failed to fetch all events:', error)
      }
    }

    if (neighborhoods.length > 0) {
      fetchAllEvents()
    }
  }, [viewMode, neighborhoods, timeRange])

  const handleNeighborhoodSelect = (id: string) => {
    setSelectedNeighborhood(id === selectedNeighborhood ? null : id)
  }

  const handleCloseDrawer = () => {
    setSelectedNeighborhood(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>

            <h1 className="font-bold text-lg">Explore</h1>

            {/* Time range selector */}
            <button
              onClick={() => setShowTimeRangePicker(!showTimeRangePicker)}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{TIME_RANGE_LABELS[timeRange]}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time range dropdown */}
          {showTimeRangePicker && (
            <div className="absolute right-4 top-14 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 min-w-[140px] z-50">
              {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range)
                    setShowTimeRangePicker(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 transition-colors ${
                    timeRange === range ? 'font-semibold text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  {TIME_RANGE_LABELS[range]}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* View toggle - floating */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20">
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Main content */}
      <main className="pt-14">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="relative h-[calc(100vh-56px)] bg-gradient-to-b from-blue-50 to-blue-100">
            {/* Singapore map background */}
            <div className="absolute inset-0 opacity-40">
              <Image
                src="/images/singapore-map.svg"
                alt="Singapore Map"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Loading state */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-neutral-500">Loading neighborhoods...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Neighborhood pins */}
                <div className="absolute inset-0">
                  {neighborhoods.map((neighborhood) => (
                    <NeighborhoodPin
                      key={neighborhood.id}
                      neighborhood={neighborhood}
                      isSelected={selectedNeighborhood === neighborhood.id}
                      onSelect={handleNeighborhoodSelect}
                    />
                  ))}
                </div>

                {/* Summary bar */}
                <MapSummaryBar
                  totalEvents={summary.totalEvents}
                  totalAttendees={summary.totalAttendees}
                  hotSpot={summary.hotSpot}
                  onHotSpotClick={handleNeighborhoodSelect}
                />
              </>
            )}

            {/* Neighborhood drawer */}
            <NeighborhoodDrawer
              neighborhoodId={selectedNeighborhood}
              timeRange={timeRange}
              onClose={handleCloseDrawer}
            />
          </div>
        ) : (
          /* List View */
          <div className="max-w-lg mx-auto px-4 pt-16 pb-8">
            {/* Stats summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 mb-6">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900">{summary.totalEvents}</p>
                  <p className="text-xs text-neutral-500">Events</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900">{summary.totalAttendees}</p>
                  <p className="text-xs text-neutral-500">Attendees</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900">
                    {neighborhoods.filter((n) => n.eventCount > 0).length}
                  </p>
                  <p className="text-xs text-neutral-500">Areas</p>
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
                  <div key={i} className="animate-pulse flex gap-3 p-3 bg-white rounded-2xl">
                    <div className="w-20 h-20 bg-neutral-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                      <div className="h-3 w-1/2 bg-neutral-100 rounded" />
                      <div className="h-3 w-1/3 bg-neutral-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500">No events found for {TIME_RANGE_LABELS[timeRange].toLowerCase()}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Click outside to close time range picker */}
      {showTimeRangePicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowTimeRangePicker(false)} />
      )}
    </div>
  )
}
