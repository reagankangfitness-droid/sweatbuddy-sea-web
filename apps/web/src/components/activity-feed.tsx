'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { AvatarStack } from '@/components/avatar-stack'
import { Heart, MapPin, Users, Calendar } from 'lucide-react'

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
            <div key={activity.id} className="group">
              <Link href={`/activities/${activity.id}`}>
                <div className="relative h-[280px] rounded-md overflow-hidden cursor-pointer transition-all duration-200 ease-airbnb hover:-translate-y-1 hover:shadow-airbnb-hover shadow-airbnb">
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
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 rounded-pill bg-white text-foreground text-xs font-semibold shadow-md">
                      {activity.type}
                    </span>
                  </div>

                  {/* Heart Icon - Top Right */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // TODO: Implement favorite functionality
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full hover:bg-black/20 transition-colors duration-200 group/heart"
                  >
                    <Heart className="w-5 h-5 text-white stroke-2 group-hover/heart:fill-[#FFD483] group-hover/heart:text-[#FFD483] transition-all duration-200" />
                  </button>

                  {/* Content Overlay - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    {/* Location */}
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" style={{ color: '#FFD483' }} />
                      <span className="text-sm font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{activity.city}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-3 line-clamp-2 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {activity.title}
                    </h3>

                    {/* Bottom Row: Price */}
                    <div className="flex items-center justify-between">
                      {activity.price !== undefined && activity.price > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold drop-shadow-lg" style={{ color: '#FFD483' }}>
                            {activity.currency || 'SGD'} {activity.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/90 text-sm font-medium">Free</span>
                      )}

                      {/* Participants */}
                      {activity.maxPeople && (
                        <div className="flex items-center gap-1 text-white/90 text-xs">
                          <Users className="w-3.5 h-3.5" />
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
              <div className="mt-3 px-1">
                {activity.user.name && (
                  <p className="text-sm text-muted-foreground">
                    Hosted by <span className="font-medium text-foreground">{activity.user.name}</span>
                  </p>
                )}
                {activity.startTime && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
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
