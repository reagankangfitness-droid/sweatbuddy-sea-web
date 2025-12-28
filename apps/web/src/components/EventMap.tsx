'use client'

import { useState, useCallback, memo } from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import Image from 'next/image'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import type { Event } from '@/lib/events'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Singapore locations with approximate coordinates
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Parks
  'east coast park': { lat: 1.3008, lng: 103.9122 },
  'botanic gardens': { lat: 1.3138, lng: 103.8159 },
  'gardens by the bay': { lat: 1.2816, lng: 103.8636 },
  'marina barrage': { lat: 1.2804, lng: 103.8714 },
  'fort canning': { lat: 1.2929, lng: 103.8466 },
  'macritchie': { lat: 1.3413, lng: 103.8322 },
  'bishan park': { lat: 1.3590, lng: 103.8448 },
  'punggol waterway': { lat: 1.4043, lng: 103.9021 },
  'bedok reservoir': { lat: 1.3384, lng: 103.9325 },
  'west coast park': { lat: 1.2816, lng: 103.7563 },
  // Areas
  'tanjong pagar': { lat: 1.2764, lng: 103.8461 },
  'orchard': { lat: 1.3048, lng: 103.8318 },
  'bugis': { lat: 1.3009, lng: 103.8558 },
  'raffles place': { lat: 1.2840, lng: 103.8514 },
  'clarke quay': { lat: 1.2905, lng: 103.8464 },
  'dhoby ghaut': { lat: 1.2988, lng: 103.8456 },
  'novena': { lat: 1.3204, lng: 103.8438 },
  'holland village': { lat: 1.3112, lng: 103.7961 },
  'tiong bahru': { lat: 1.2867, lng: 103.8273 },
  'chinatown': { lat: 1.2830, lng: 103.8434 },
  'sentosa': { lat: 1.2494, lng: 103.8303 },
  'kallang': { lat: 1.3106, lng: 103.8713 },
  // Default center (Singapore)
  'singapore': { lat: 1.3521, lng: 103.8198 },
}

function getEventCoordinates(location: string): { lat: number; lng: number } | null {
  const lowerLocation = location.toLowerCase()

  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (lowerLocation.includes(key)) {
      // Add small random offset to prevent marker stacking
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.002,
        lng: coords.lng + (Math.random() - 0.5) * 0.002,
      }
    }
  }

  // Default to Singapore center with random offset
  return {
    lat: 1.3521 + (Math.random() - 0.5) * 0.05,
    lng: 103.8198 + (Math.random() - 0.5) * 0.05,
  }
}

const categoryColors: Record<string, string> = {
  'Run Club': '#EF4444',
  'Running': '#EF4444',
  'Yoga': '#8B5CF6',
  'HIIT': '#F59E0B',
  'Bootcamp': '#10B981',
  'Dance': '#EC4899',
  'Combat': '#EF4444',
  'Outdoor': '#22C55E',
  'Meditation': '#6366F1',
}

interface EventMapProps {
  events: Event[]
  height?: string
  onEventClick?: (event: Event) => void
}

function EventMapComponent({ events, height = '500px', onEventClick }: EventMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map)
  }, [])

  const handleMarkerClick = useCallback((event: Event) => {
    setSelectedEvent(event)
  }, [])

  const handleInfoWindowClose = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  const handleViewDetails = useCallback(() => {
    if (selectedEvent && onEventClick) {
      onEventClick(selectedEvent)
    }
  }, [selectedEvent, onEventClick])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className="flex items-center justify-center bg-neutral-100 rounded-2xl"
        style={{ height }}
      >
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">Map view coming soon</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center bg-neutral-100 rounded-2xl"
        style={{ height }}
      >
        <p className="text-neutral-500">Failed to load map</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-neutral-100 rounded-2xl skeleton-shimmer"
        style={{ height }}
      >
        <p className="text-neutral-400">Loading map...</p>
      </div>
    )
  }

  // Filter events that have valid coordinates
  const mappableEvents = events.map((event) => ({
    ...event,
    coords: getEventCoordinates(event.location),
  })).filter((e) => e.coords !== null)

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: 1.3521, lng: 103.8198 }}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {mappableEvents.map((event) => (
          <Marker
            key={event.id}
            position={event.coords!}
            onClick={() => handleMarkerClick(event)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: categoryColors[event.category] || '#171717',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ))}

        {selectedEvent && (
          <InfoWindow
            position={getEventCoordinates(selectedEvent.location)!}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-1 max-w-[250px]">
              {selectedEvent.imageUrl && (
                <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden">
                  <Image
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="font-bold text-sm mb-1 line-clamp-1">
                {selectedEvent.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                <Clock className="w-3 h-3" />
                {selectedEvent.day} · {selectedEvent.time}
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{selectedEvent.location}</span>
              </div>
              <button
                onClick={handleViewDetails}
                className="w-full py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 hover:bg-neutral-700 transition-colors"
              >
                View Details
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="text-xs font-semibold mb-2 text-neutral-700">Categories</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(categoryColors).slice(0, 6).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-neutral-600">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const EventMap = memo(EventMapComponent)
