'use client'

import { useState, useEffect } from 'react'
import { Heart, X } from 'lucide-react'
import Image from 'next/image'
import { MapPin, Clock, Calendar } from 'lucide-react'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'

interface Event {
  id: string
  name: string
  category: string
  day: string
  time: string
  location: string
  description?: string | null
  organizer: string
  imageUrl?: string | null
  recurring: boolean
}

interface SavedEventsProps {
  allEvents: Event[]
}

export function SavedEvents({ allEvents }: SavedEventsProps) {
  const [savedIds, setSavedIds] = useState<string[]>([])

  useEffect(() => {
    const loadSaved = () => {
      const saved = safeGetJSON<string[]>('sweatbuddies_saved', [])
      setSavedIds(saved)
    }

    loadSaved()

    // Listen for updates
    window.addEventListener('savedEventsUpdated', loadSaved)
    return () => window.removeEventListener('savedEventsUpdated', loadSaved)
  }, [])

  const savedEvents = allEvents.filter((event) => savedIds.includes(event.id))

  const removeSaved = (eventId: string) => {
    const newSaved = savedIds.filter((id) => id !== eventId)
    safeSetJSON('sweatbuddies_saved', newSaved)
    setSavedIds(newSaved)
    window.dispatchEvent(new Event('savedEventsUpdated'))
  }

  if (savedEvents.length === 0) return null

  return (
    <section className="mb-12 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
        <h2 className="font-sans text-xl font-bold text-white">
          Your Saved Experiences
        </h2>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
          {savedEvents.length}
        </span>
      </div>
      <p className="font-sans text-sm text-white/50 mb-6">
        Experiences you&apos;re interested in
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {savedEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white/10 rounded-xl shadow-lg border border-white/10 overflow-hidden group relative"
          >
            {/* Remove button */}
            <button
              onClick={() => removeSaved(event.id)}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/50 transition-colors"
              aria-label="Remove from saved"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>

            {/* Image */}
            {event.imageUrl && (
              <div className="relative w-full h-32 overflow-hidden">
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
            )}

            <div className="p-4">
              {/* Category */}
              <span className="inline-block text-xs font-sans font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-white/10 text-white/80 mb-2">
                {event.category}
              </span>

              {/* Name */}
              <h3 className="font-sans font-bold text-white text-sm mb-2 line-clamp-1">
                {event.name}
              </h3>

              {/* Meta */}
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Calendar className="w-3 h-3" />
                <span>{event.day}</span>
                <span className="text-white/20">•</span>
                <Clock className="w-3 h-3" />
                <span>{event.time}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-white/50 text-xs mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
