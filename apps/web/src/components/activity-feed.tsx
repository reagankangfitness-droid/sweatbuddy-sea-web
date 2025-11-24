'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { AvatarStack } from '@/components/avatar-stack'
import { Heart, MapPin, Users, Calendar } from 'lucide-react'

const ACTIVITY_TYPE_EMOJI: Record<string, string> = {
  'RUN': '🏃',
  'GYM': '💪',
  'YOGA': '🧘',
  'HIKE': '🥾',
  'CYCLING': '🚴',
  'COMBAT': '🥊',
  'SWIM': '🏊',
  'SPORTS': '🏀',
  'OTHER': '✨',
}

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
        <p className="text-muted-foreground mb-6" style={{ fontSize: '16px' }}>
          <span role="img" aria-label="search" className="mr-2">🔍</span>
          No activities yet. Be the first to create one!
          <span role="img" aria-label="sparkles" className="ml-2">✨</span>
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
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontSize: '13px' }}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontSize: '13px' }}
          >
            🗺️ Map View
          </button>
        </div>
      </div>

      {/* List View - Airbnb Style Grid */}
      {viewMode === 'list' && (
        <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-8 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {activities.map((activity) => (
            <div key={activity.id} className="group">
              <Link href={`/activities/${activity.id}`}>
                <div className="relative h-[220px] sm:h-[240px] md:h-[260px] lg:h-[280px] rounded-md overflow-hidden cursor-pointer transition-all duration-300 ease-airbnb hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-card-hover shadow-card">
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
                        <span className="text-sm">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Activity Type Badge - Top Left */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-pill bg-white text-foreground font-semibold shadow-md inline-flex items-center gap-1" style={{ fontSize: '11px' }}>
                      {ACTIVITY_TYPE_EMOJI[activity.type] && (
                        <span role="img" aria-label={activity.type}>
                          {ACTIVITY_TYPE_EMOJI[activity.type]}
                        </span>
                      )}
                      <span className="hidden sm:inline">{activity.type}</span>
                    </span>
                  </div>

                  {/* Heart Icon - Top Right */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // TODO: Implement favorite functionality
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2.5 sm:p-2 rounded-full hover:bg-black/20 transition-colors duration-200 group/heart min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-2 group-hover/heart:fill-[#0066FF] group-hover/heart:text-[#0066FF] transition-all duration-200" />
                  </button>

                  {/* Content Overlay - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                    {/* Location */}
                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" style={{ color: '#0066FF' }} />
                      <span className="font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate" style={{ fontSize: '13px' }}>{activity.city}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold mb-2 sm:mb-3 line-clamp-2 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight" style={{ fontSize: '15px', lineHeight: '1.3' }}>
                      {activity.title}
                    </h3>

                    {/* Bottom Row: Price */}
                    <div className="flex items-center justify-between">
                      {activity.price !== undefined && activity.price > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold drop-shadow-lg" style={{ color: '#0066FF', fontSize: '16px' }}>
                            {activity.currency || 'SGD'} {activity.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/90 font-medium" style={{ fontSize: '13px' }}>Free</span>
                      )}

                      {/* Participants */}
                      {activity.maxPeople && (
                        <div className="flex items-center gap-0.5 sm:gap-1 text-white/90" style={{ fontSize: '12px' }}>
                          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="font-medium">
                            {activity.userActivities?.length || 0}/{activity.maxPeople}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Info below card */}
              <div className="mt-2 sm:mt-3 px-0.5 sm:px-1">
                {activity.user.name && (
                  <p className="text-muted-foreground truncate" style={{ fontSize: '13px' }}>
                    Hosted by <span className="font-medium text-foreground">{activity.user.name}</span>
                  </p>
                )}
                {activity.startTime && (
                  <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate" style={{ fontSize: '13px' }}>
                      {new Date(activity.startTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
                      <h3 className="font-semibold mb-1" style={{ fontSize: '15px' }}>{selectedActivity.title}</h3>
                      <p className="text-gray-600 mb-2" style={{ fontSize: '12px' }}>
                        {selectedActivity.type} • {selectedActivity.city}
                      </p>
                      {selectedActivity.price !== undefined && selectedActivity.price > 0 && (
                        <p className="font-semibold mb-2" style={{ fontSize: '13px', color: '#0066FF' }}>
                          {selectedActivity.currency || 'USD'} {selectedActivity.price.toFixed(2)}
                        </p>
                      )}
                      {selectedActivity.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2" style={{ fontSize: '12px' }}>
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
