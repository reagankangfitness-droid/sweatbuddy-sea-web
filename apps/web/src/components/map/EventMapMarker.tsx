'use client'

import { OverlayView } from '@react-google-maps/api'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'

// Build lookup maps from the authoritative category list
// Keyed by both slug and display name for maximum coverage
const emojiByCategory: Record<string, string> = {}
const colorByCategory: Record<string, string> = {}
for (const cat of ACTIVITY_CATEGORIES) {
  emojiByCategory[cat.slug] = cat.emoji
  emojiByCategory[cat.name] = cat.emoji
  colorByCategory[cat.slug] = cat.color
  colorByCategory[cat.name] = cat.color
}

function getCategoryEmoji(category: string): string {
  return emojiByCategory[category] || '✨'
}

function getCategoryColor(category: string): string {
  return colorByCategory[category] || '#EC4899' // fallback pink
}

export interface MapEvent {
  id: string
  slug?: string | null
  name: string
  category: string
  imageUrl?: string | null
  organizerImageUrl?: string | null
  latitude: number
  longitude: number
  day: string
  time: string
  location: string
  eventDate?: string | null
  recurring: boolean
  organizer: string
  isFree?: boolean
  price?: number | null
  isFull?: boolean
  description?: string | null
  goingCount?: number
}

interface EventMapMarkerProps {
  event: MapEvent
  onClick: (event: MapEvent) => void
}

interface ClusterMarkerProps {
  count: number
  position: google.maps.LatLngLiteral
  onClick: () => void
}

export function EventMapMarker({ event, onClick }: EventMapMarkerProps) {
  const emoji = getCategoryEmoji(event.category)
  const color = getCategoryColor(event.category)

  return (
    <OverlayView
      position={{ lat: event.latitude, lng: event.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -22, y: -22 })}
    >
      <button
        onClick={() => onClick(event)}
        className="relative group focus:outline-none"
        aria-label={`View ${event.name}`}
      >
        {/* Outer ring — colored by category */}
        <div
          className="w-[44px] h-[44px] rounded-full p-[3px] shadow-lg transition-transform group-hover:scale-110 group-active:scale-95"
          style={{ background: color }}
        >
          {/* Inner circle — emoji */}
          <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
            <span className="text-xl leading-none">{emoji}</span>
          </div>
        </div>
      </button>
    </OverlayView>
  )
}

export function ClusterMarker({ count, position, onClick }: ClusterMarkerProps) {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -24, y: -24 })}
    >
      <button
        onClick={onClick}
        className="relative focus:outline-none group"
        aria-label={`${count} events in this area`}
      >
        <div className="w-[48px] h-[48px] rounded-full bg-gradient-to-br from-pink-500 to-rose-500 p-[3px] shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
          <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center">
            <span className="text-sm font-bold text-neutral-900 dark:text-white">{count}</span>
          </div>
        </div>
      </button>
    </OverlayView>
  )
}
