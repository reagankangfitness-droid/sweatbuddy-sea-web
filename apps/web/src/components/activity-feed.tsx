'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { AvatarStack } from '@/components/avatar-stack'
import { Heart, MapPin } from 'lucide-react'

// Lazy load Google Maps (heavy component - only load when needed)
const GoogleMapSection = dynamic(
  () => import('@/components/google-map-section'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
    ssr: false,
  }
)

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

const DEFAULT_CENTER = {
  lat: 13.7563, // Bangkok
  lng: 100.5018,
}

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
          No sessions yet. Build what moves you
          <span role="img" aria-label="sparkles" className="ml-2">✨</span>
        </p>
        <Link href="/activities/new">
          <Button size="lg">Host Your First Session</Button>
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

      {/* List View - Premium Airbnb/Meetup Style Grid */}
      {viewMode === 'list' && (
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {activities.map((activity) => (
            <Link key={activity.id} href={`/activities/${activity.id}`}>
              <div className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                {/* Image Section */}
                <div className="relative h-40 sm:h-48 lg:h-56 overflow-hidden bg-muted">
                  {activity.imageUrl ? (
                    <Image
                      src={activity.imageUrl}
                      alt={activity.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span style={{ fontSize: '13px' }}>No image</span>
                    </div>
                  )}

                  {/* Date Badge - Top Left (Meetup Style) */}
                  {activity.startTime && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-primary px-2 py-0.5 text-center">
                          <span className="text-primary-foreground font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                            {new Date(activity.startTime).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </div>
                        <div className="px-2 py-1 text-center">
                          <span className="text-foreground font-bold" style={{ fontSize: '18px', lineHeight: '1' }}>
                            {new Date(activity.startTime).getDate()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Type Badge - Top Right */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-foreground font-semibold shadow-sm inline-flex items-center gap-1" style={{ fontSize: '11px' }}>
                      {ACTIVITY_TYPE_EMOJI[activity.type] && (
                        <span role="img" aria-label={activity.type}>
                          {ACTIVITY_TYPE_EMOJI[activity.type]}
                        </span>
                      )}
                      <span className="hidden sm:inline">{activity.type}</span>
                    </span>
                  </div>

                  {/* Heart Icon - Bottom Right on Image */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // TODO: Implement favorite functionality
                    }}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm group/heart"
                  >
                    <Heart className="w-4 h-4 text-foreground stroke-2 group-hover/heart:fill-primary group-hover/heart:text-primary transition-colors duration-200" />
                  </button>
                </div>

                {/* Content Section - White Background */}
                <div className="p-3 sm:p-4">
                  {/* Location */}
                  <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                    <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="font-medium text-muted-foreground truncate" style={{ fontSize: '13px' }}>
                      {activity.city}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-3 line-clamp-2 leading-snug" style={{ fontSize: '16px', lineHeight: '1.4' }}>
                    {activity.title}
                  </h3>

                  {/* Host Info with Avatar */}
                  <div className="flex items-center gap-2 mb-3">
                    {activity.user.imageUrl ? (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={activity.user.imageUrl}
                          alt={activity.user.name || 'Host'}
                          fill
                          sizes="24px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
                          {activity.user.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-muted-foreground truncate" style={{ fontSize: '13px' }}>
                      Hosted by <span className="font-medium text-foreground">{activity.user.name || 'Unknown'}</span>
                    </span>
                  </div>

                  {/* Attendee Avatars - Social Proof */}
                  {activity.userActivities && activity.userActivities.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-border-subtle">
                      {/* Show 3 avatars on mobile, 4 on larger screens */}
                      <div className="sm:hidden">
                        <AvatarStack
                          participants={activity.userActivities.map(ua => ua.user)}
                          maxDisplay={3}
                          size="xs"
                          showGoingText={true}
                          showEmptyState={false}
                        />
                      </div>
                      <div className="hidden sm:block">
                        <AvatarStack
                          participants={activity.userActivities.map(ua => ua.user)}
                          maxDisplay={4}
                          size="sm"
                          showGoingText={true}
                          showEmptyState={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Row: Price & Spots */}
                  <div className="flex items-center justify-between">
                    {/* Price */}
                    {activity.price !== undefined && activity.price > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-primary-dark" style={{ fontSize: '18px' }}>
                          {activity.currency || 'SGD'} {activity.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-foreground font-semibold" style={{ fontSize: '14px' }}>Free</span>
                    )}

                    {/* Spots remaining */}
                    {activity.maxPeople && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-medium" style={{ fontSize: '12px' }}>
                          {Math.max(0, activity.maxPeople - (activity.userActivities?.length || 0))} spots left
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Map View - Lazy loaded */}
      {viewMode === 'map' && (
        <GoogleMapSection
          activities={activities}
          selectedActivity={selectedActivity}
          mapCenter={mapCenter}
          onMarkerClick={handleMarkerClick}
          onInfoWindowClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  )
}
