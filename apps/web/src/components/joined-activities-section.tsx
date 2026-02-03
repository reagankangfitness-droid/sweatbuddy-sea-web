'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Clock } from 'lucide-react'
import { PostActivityPromptCompact } from '@/components/post-activity-prompt'

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

export interface BookingActivity {
  id: string
  title: string
  imageUrl: string | null
  city: string
  type: string
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  user: {
    name: string | null
    imageUrl: string | null
  }
  userActivities?: { id: string }[]
}

export interface JoinedBooking {
  id: string
  activity: BookingActivity
}

interface JoinedActivitiesSectionProps {
  bookings: JoinedBooking[]
  timeFilter: 'upcoming' | 'past'
  userId: string
}

export function JoinedActivitiesSection({
  bookings,
  timeFilter,
  userId,
}: JoinedActivitiesSectionProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancellingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel booking')
      }

      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground mb-6 text-base">
          {timeFilter === 'upcoming' ? (
            <>
              <span role="img" aria-label="search" className="mr-2">📅</span>
              No upcoming sessions yet. Start exploring!
              <span role="img" aria-label="sparkles" className="ml-2">✨</span>
            </>
          ) : (
            <>
              <span role="img" aria-label="history" className="mr-2">📜</span>
              No past sessions yet. Your journey begins now!
              <span role="img" aria-label="sparkles" className="ml-2">✨</span>
            </>
          )}
        </p>
        <Link href="/">
          <Button size="lg">Discover Workouts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => {
        const activity = booking.activity
        const isPast = activity.startTime && new Date(activity.startTime) < new Date()

        return (
          <div
            key={booking.id}
            className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
          >
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-muted">
              {activity.imageUrl ? (
                <Image
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                  fill
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-xs">No image</span>
                </div>
              )}

              {/* Date Badge - Top Left */}
              {activity.startTime && (
                <div className="absolute top-3 left-3">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-primary px-2 py-0.5 text-center">
                      <span className="text-primary-foreground font-bold uppercase text-[10px] tracking-wide">
                        {new Date(activity.startTime).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div className="px-2 py-1 text-center">
                      <span className="text-foreground font-bold text-lg leading-none">
                        {new Date(activity.startTime).getDate()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Type Badge - Top Right */}
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-foreground font-semibold shadow-sm inline-flex items-center gap-1 text-[11px]">
                  {ACTIVITY_TYPE_EMOJI[activity.type] && (
                    <span role="img" aria-label={activity.type}>
                      {ACTIVITY_TYPE_EMOJI[activity.type]}
                    </span>
                  )}
                  <span className="hidden sm:inline">{activity.type}</span>
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Location */}
              <div className="flex items-center gap-1 mb-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-muted-foreground truncate text-xs">
                  {activity.city}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-foreground mb-3 line-clamp-2 leading-snug text-base">
                {activity.title}
              </h3>

              {/* Time & Participants */}
              <div className="flex items-center gap-4 mb-3 text-muted-foreground text-xs">
                {activity.startTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(activity.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}
                {activity.maxPeople && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {activity.userActivities?.length || 0}/{activity.maxPeople}
                    </span>
                  </div>
                )}
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
                {activity.user.imageUrl ? (
                  <Image
                    src={activity.user.imageUrl}
                    alt={activity.user.name || 'Host'}
                    className="w-6 h-6 rounded-full object-cover"
                    width={24}
                    height={24}
                    unoptimized
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-[10px]">
                      {activity.user.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <span className="text-muted-foreground truncate text-xs">
                  Hosted by <span className="font-medium text-foreground">{activity.user.name || 'Unknown'}</span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col xs:flex-row gap-2">
                <Link href={`/activities/${activity.id}`} className="flex-1">
                  <Button variant="outline" className="w-full text-xs">
                    View Details
                  </Button>
                </Link>
                {!isPast && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="w-full xs:w-auto text-xs"
                  >
                    {cancellingId === booking.id ? 'Canceling...' : 'Cancel'}
                  </Button>
                )}
                {isPast && activity.startTime && (
                  <>
                    <PostActivityPromptCompact
                      userActivityId={booking.id}
                      activityTitle={activity.title}
                      activityImage={activity.imageUrl}
                      hostName={activity.user.name || 'Host'}
                      hostAvatar={activity.user.imageUrl}
                      completedAt={new Date(activity.startTime)}
                      durationMinutes={
                        activity.endTime
                          ? Math.round((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000)
                          : null
                      }
                    />
                    <Link href="/" className="w-full xs:w-auto">
                      <Button size="sm" className="w-full text-xs">
                        Book Again
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
