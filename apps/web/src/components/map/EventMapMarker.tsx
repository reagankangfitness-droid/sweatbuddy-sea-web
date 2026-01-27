'use client'

import { useState } from 'react'
import { OverlayView } from '@react-google-maps/api'
import Image from 'next/image'

const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

export interface MapEvent {
  id: string
  slug?: string | null
  name: string
  category: string
  imageUrl?: string | null
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
  const [imgError, setImgError] = useState(false)
  const emoji = categoryEmojis[event.category] || '✨'
  const hasImage = event.imageUrl && !imgError

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
        {/* Outer ring */}
        <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-pink-500 to-rose-500 p-[3px] shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
          {/* Inner circle */}
          <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-neutral-900 flex items-center justify-center">
            {hasImage ? (
              <Image
                src={event.imageUrl!}
                alt={event.name}
                width={38}
                height={38}
                className="w-full h-full object-cover rounded-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-lg leading-none">{emoji}</span>
            )}
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
