'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Map, Layers, Sparkles } from 'lucide-react'
import { SwipeableEventBrowser } from '@/components/SwipeableEventBrowser'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import type { Event } from '@/lib/events'

// Lazy load map component
const EventMap = dynamic(
  () => import('@/components/EventMap').then((mod) => ({ default: mod.EventMap })),
  {
    loading: () => (
      <div className="h-[500px] bg-neutral-100 rounded-2xl skeleton-shimmer flex items-center justify-center">
        <p className="text-neutral-400">Loading map...</p>
      </div>
    ),
    ssr: false,
  }
)

type ViewMode = 'swipe' | 'map'

export default function DiscoverPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('swipe')
  const [joinedCount, setJoinedCount] = useState(0)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        if (data.events) {
          // Shuffle events for discovery
          const shuffled = [...data.events].sort(() => Math.random() - 0.5)
          setEvents(shuffled)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleJoin = (event: Event) => {
    setJoinedCount((prev) => prev + 1)
    // Save to localStorage
    const going = JSON.parse(localStorage.getItem('sweatbuddies_going') || '[]')
    if (!going.includes(event.id)) {
      localStorage.setItem('sweatbuddies_going', JSON.stringify([...going, event.id]))
    }
  }

  const handleSave = (event: Event) => {
    setSavedCount((prev) => prev + 1)
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
    if (!saved.includes(event.id)) {
      localStorage.setItem('sweatbuddies_saved', JSON.stringify([...saved, event.id]))
    }
  }

  const handleSkip = () => {
    // Just move to next card
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>

          <h1 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Discover
          </h1>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1">
            <button
              onClick={() => setViewMode('swipe')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'swipe'
                  ? 'bg-white shadow-sm text-neutral-900'
                  : 'text-neutral-400'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'map'
                  ? 'bg-white shadow-sm text-neutral-900'
                  : 'text-neutral-400'
              }`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={joinedCount} duration={500} />
            </div>
            <div className="text-xs text-neutral-500">Joined</div>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={savedCount} duration={500} />
            </div>
            <div className="text-xs text-neutral-500">Saved</div>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              <AnimatedCounter value={events.length} duration={1000} />
            </div>
            <div className="text-xs text-neutral-500">Events</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-500">Loading events...</p>
            </div>
          </div>
        ) : viewMode === 'swipe' ? (
          <div className="pt-8 pb-24">
            <SwipeableEventBrowser
              events={events}
              onJoin={handleJoin}
              onSkip={handleSkip}
              onSave={handleSave}
            />

            {/* Instructions */}
            <div className="mt-24 text-center text-sm text-neutral-400">
              <p>Swipe right to join · Swipe left to skip · Swipe up to save</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <EventMap events={events} height="calc(100vh - 200px)" />
          </div>
        )}
      </main>
    </div>
  )
}
