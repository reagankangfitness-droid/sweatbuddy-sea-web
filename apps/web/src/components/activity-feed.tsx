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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Link key={activity.id} href={`/activities/${activity.id}`}>
              <div className="rounded-lg border overflow-hidden hover:border-primary transition-all hover:shadow-lg">
                {activity.imageUrl && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold">{activity.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {activity.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary mb-3">
                    📍 {activity.city}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {activity.description}
                    </p>
                  )}
                  {activity.price !== undefined && activity.price > 0 && (
                    <p className="text-sm font-semibold text-green-600 mb-3">
                      💰 {activity.currency || 'USD'} {activity.price.toFixed(2)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {activity.user.imageUrl ? (
                      <img
                        src={activity.user.imageUrl}
                        alt={activity.user.name || 'User'}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                        {activity.user.name?.[0] || '?'}
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {activity.user.name || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                    {activity.startTime && (
                      <span className="flex items-center gap-1">
                        🕒 {new Date(activity.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  {activity.userActivities && activity.userActivities.length > 0 ? (
                    <div className="mb-3">
                      <AvatarStack
                        participants={activity.userActivities.map(ua => ua.user)}
                        maxPeople={activity.maxPeople}
                      />
                    </div>
                  ) : activity.maxPeople ? (
                    <p className="text-xs text-muted-foreground mb-3">
                      0/{activity.maxPeople} spots filled
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(activity.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
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
