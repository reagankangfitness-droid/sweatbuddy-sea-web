'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Heart, Calendar, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface SavedEvent {
  id: string
  name: string
  category: string
  day: string
  time: string
  location: string
  imageUrl?: string | null
  recurring: boolean
}

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Wellness': '💆',
  'Strength': '💪',
  'Cycling': '🚴',
  'Dance': '💃',
  'Boxing': '🥊',
  'Bootcamp': '⚡',
}

function getCategoryEmoji(category: string): string {
  return categoryEmojis[category] || '✨'
}

export default function SavedPage() {
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([])
  const [allEvents, setAllEvents] = useState<SavedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all events and filter by saved IDs
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events')
        const data = await response.json()
        // API returns { events: [...] }
        setAllEvents(data.events || [])
      } catch (error) {
        console.error('Error fetching events:', error)
      }
    }

    fetchEvents()
  }, [])

  // Load saved events from localStorage
  useEffect(() => {
    if (allEvents.length === 0) return

    const savedIds = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
    const saved = allEvents.filter((event: SavedEvent) => savedIds.includes(event.id))
    setSavedEvents(saved)
    setIsLoading(false)
  }, [allEvents])

  // Listen for changes to saved events
  useEffect(() => {
    const handleSavedUpdate = () => {
      const savedIds = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
      const saved = allEvents.filter((event: SavedEvent) => savedIds.includes(event.id))
      setSavedEvents(saved)
    }

    window.addEventListener('savedEventsUpdated', handleSavedUpdate)
    return () => window.removeEventListener('savedEventsUpdated', handleSavedUpdate)
  }, [allEvents])

  const handleRemove = (eventId: string) => {
    const savedIds = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
    const newSavedIds = savedIds.filter((id: string) => id !== eventId)
    localStorage.setItem('sweatbuddies_saved', JSON.stringify(newSavedIds))
    setSavedEvents(savedEvents.filter(e => e.id !== eventId))
    window.dispatchEvent(new Event('savedEventsUpdated'))
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-sand/95 backdrop-blur-lg border-b border-forest-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-cream border border-forest-200"
            >
              <ArrowLeft className="w-5 h-5 text-forest-700" />
            </Link>
            <div>
              <h1 className="text-display-card">Saved Events</h1>
              <p className="text-meta-sm">{savedEvents.length} events saved</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-cream rounded-2xl border border-forest-100 shadow-card p-4 flex gap-4">
                <div className="w-20 h-20 bg-sand/50 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-coral/20 rounded w-1/4 mb-2" />
                  <div className="h-5 bg-forest-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-forest-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-cream rounded-2xl border border-forest-100 shadow-card mb-6">
              <Heart className="w-10 h-10 text-forest-300" />
            </div>
            <h2 className="text-display-section mb-2">No saved events yet</h2>
            <p className="text-body-default mb-6">
              Tap the heart icon on events you&apos;re interested in to save them here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-coral text-white px-6 py-3 text-ui-lg font-semibold rounded-full shadow-md hover:bg-coral-600 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-cream rounded-2xl border border-forest-100 shadow-card flex gap-4 p-4"
              >
                {/* Image */}
                <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-sand relative rounded-xl">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-sand to-mist">
                      {getCategoryEmoji(event.category)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="text-label-sm text-forest-500">
                    {event.category.toUpperCase()}
                  </span>
                  <h3 className="text-display-card text-base line-clamp-1 mt-0.5">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-forest-600 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-forest-400" />
                    <span>{event.day} • {event.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-forest-400 mt-1">
                    <MapPin className="w-3 h-3 text-forest-300" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                {/* Remove button - neutral, coral on hover */}
                <button
                  onClick={() => handleRemove(event.id)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-forest-400 hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom spacer for nav */}
      <div className="h-20" />
    </div>
  )
}
