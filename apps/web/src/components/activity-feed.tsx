'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { AvatarStack } from '@/components/avatar-stack'

interface Participant {
  id: string
  name: string | null
  imageUrl: string | null
}

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  imageUrl?: string | null
  price?: number
  currency?: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  userActivities?: Array<{
    user: Participant
  }>
}

interface ActivityFeedProps {
  activities: Activity[]
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem',
}

const DEFAULT_CENTER = {
  lat: 13.7563, // Bangkok
  lng: 100.5018,
}

const LIBRARIES: ('places')[] = ['places']

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)

  // Calculate center based on activities
  const calculateMapCenter = () => {
    if (activities.length === 0) return DEFAULT_CENTER

    const avgLat = activities.reduce((sum, a) => sum + a.latitude, 0) / activities.length
    const avgLng = activities.reduce((sum, a) => sum + a.longitude, 0) / activities.length

    return { lat: avgLat, lng: avgLng }
  }

  const handleMarkerClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setMapCenter({ lat: activity.latitude, lng: activity.longitude })
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-xl text-muted-foreground mb-6">
          No activities yet. Be the first to create one!
        </p>
        <Link href="/activities/new">
          <Button size="lg">Create First Activity</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* View Toggle - Sticky at top */}
      <div className="sticky top-20 z-10 mb-6 flex justify-end">
        <div className="inline-flex rounded-lg border bg-background p-1 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🗺️ Map View
          </button>
        </div>
      </div>

      {/* List View - Airbnb Style Grid */}
      {viewMode === 'list' && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activities.map((activity) => (
            <Link key={activity.id} href={`/activities/${activity.id}`}>
              <div className="group relative h-[280px] rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                {/* Full Background Image */}
                <div className="absolute inset-0">
                  {activity.imageUrl ? (
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                {/* Dark Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Activity Type Badge - Top Left */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold uppercase tracking-wide shadow-lg">
                    {activity.type}
                  </span>
                </div>

                {/* Content Overlay - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  {/* Location */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold drop-shadow-lg">{activity.city}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 drop-shadow-lg leading-tight">
                    {activity.title}
                  </h3>

                  {/* Bottom Row: Price, Date, Participants */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Price */}
                    {activity.price !== undefined && activity.price > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold drop-shadow-lg">
                          {activity.currency || 'SGD'} {activity.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* Date & Participants */}
                    <div className="flex items-center gap-3 text-xs">
                      {activity.startTime && (
                        <span className="font-medium drop-shadow-lg">
                          {new Date(activity.startTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {activity.maxPeople && (
                        <span className="font-medium drop-shadow-lg">
                          👥 {activity.userActivities?.length || 0}/{activity.maxPeople}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Host Info - Small at very bottom */}
                  {activity.user.name && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <span className="text-xs font-medium drop-shadow-lg opacity-90">
                        Hosted by {activity.user.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="rounded-lg border overflow-hidden">
          {GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' ? (
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={activities.length === 1 ? 12 : 6}
              >
                {activities.map((activity) => (
                  <Marker
                    key={activity.id}
                    position={{ lat: activity.latitude, lng: activity.longitude }}
                    onClick={() => handleMarkerClick(activity)}
                  />
                ))}

                {selectedActivity && (
                  <InfoWindow
                    position={{
                      lat: selectedActivity.latitude,
                      lng: selectedActivity.longitude,
                    }}
                    onCloseClick={() => setSelectedActivity(null)}
                  >
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-base mb-1">{selectedActivity.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {selectedActivity.type} • {selectedActivity.city}
                      </p>
                      {selectedActivity.price !== undefined && selectedActivity.price > 0 && (
                        <p className="text-sm font-semibold text-green-600 mb-2">
                          {selectedActivity.currency || 'USD'} {selectedActivity.price.toFixed(2)}
                        </p>
                      )}
                      {selectedActivity.description && (
                        <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                          {selectedActivity.description}
                        </p>
                      )}
                      <Link href={`/activities/${selectedActivity.id}`}>
                        <Button size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted">
              <p className="text-muted-foreground">
                Google Maps API key required for map view
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
