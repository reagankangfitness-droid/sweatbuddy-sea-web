'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Heart, Calendar, MapPin, Trash2, Loader2 } from 'lucide-react'
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
  slug?: string | null
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
  const { isLoaded, isSignedIn } = useUser()
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

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center gap-4 px-4 py-3">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700" />
              </Link>
              <h1 className="text-display-card">Saved Events</h1>
            </div>
          </div>
        </header>

        {/* Sign in prompt */}
        <main className="pt-24 pb-24 px-4">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl border border-neutral-100 shadow-card mb-6">
              <Heart className="w-12 h-12 text-neutral-300" />
            </div>
            <h2 className="text-display-section mb-2">Save your favorite events</h2>
            <p className="text-body-default mb-8 max-w-xs mx-auto">
              Sign in to save events and access them from any device.
            </p>
            <Link
              href="/sign-in?redirect_url=/saved"
              className="inline-flex items-center gap-2 bg-neutral-900 px-6 py-3 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 transition-colors"
              style={{ color: '#FFFFFF' }}
            >
              Sign in to continue
            </Link>
            <p className="text-sm text-neutral-500 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up?redirect_url=/saved" className="text-neutral-900 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 backdrop-blur-lg border-b border-neutral-200">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-neutral-200"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
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
              <div key={i} className="animate-pulse bg-white rounded-2xl border border-neutral-100 shadow-card p-4 flex gap-4">
                <div className="w-20 h-20 bg-neutral-50/50 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-neutral-900/20 rounded w-1/4 mb-2" />
                  <div className="h-5 bg-neutral-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl border border-neutral-100 shadow-card mb-6">
              <Heart className="w-10 h-10 text-neutral-300" />
            </div>
            <h2 className="text-display-section mb-2">No saved events yet</h2>
            <p className="text-body-default mb-6">
              Tap the heart icon on events you&apos;re interested in to save them here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-neutral-900 px-6 py-3 text-base font-semibold rounded-full shadow-md hover:bg-neutral-700 transition-colors"
              style={{ color: '#FFFFFF' }}
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/e/${event.slug || event.id}`}
                className="bg-white rounded-2xl border border-neutral-100 shadow-card flex gap-4 p-4 hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-neutral-50 relative rounded-xl">
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
                  <span className="text-label-sm text-neutral-500">
                    {event.category.toUpperCase()}
                  </span>
                  <h3 className="text-display-card text-base line-clamp-1 mt-0.5">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{event.day} • {event.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                    <MapPin className="w-3 h-3 text-neutral-300" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                {/* Remove button - neutral, coral on hover */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(event.id)
                  }}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-900/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Bottom spacer for nav */}
      <div className="h-20" />
    </div>
  )
}
