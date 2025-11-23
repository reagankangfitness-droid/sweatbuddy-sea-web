'use client'

import { Header } from '@/components/header'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { AvatarStack } from '@/components/avatar-stack'
import { ActivityMessaging } from '@/components/activity-messaging'
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar'
import { Calendar, MessageCircle } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
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
  imageUrl: string | null
  price: number
  currency: string
  hostId: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
  }
  userActivities: Array<{
    id: string
    userId: string
    status: string
    user: {
      id: string
      name: string | null
      imageUrl: string | null
    }
  }>
}

export default function ActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded: userLoaded } = useUser()
  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isMessagingOpen, setIsMessagingOpen] = useState(false)

  // Handle payment status from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      toast.success('Payment successful! You have joined the activity.')
      // Remove the query param
      router.replace(`/activities/${params.id}`)
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. Please try again if you want to join.')
      // Remove the query param
      router.replace(`/activities/${params.id}`)
    }
  }, [searchParams, router, params.id])

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch(`/api/activities/${params.id}`)
        if (!response.ok) {
          setActivity(null)
          return
        }
        const data = await response.json()
        setActivity(data)

        // Check if current user has joined
        if (user && data.userActivities) {
          const userRsvp = data.userActivities.find(
            (ua: any) => ua.userId === user.id && ua.status === 'JOINED'
          )
          setHasJoined(!!userRsvp)
        }
      } catch (error) {
        console.error('Error fetching activity:', error)
        setActivity(null)
      } finally {
        setIsLoading(false)
      }
    }
    if (userLoaded) {
      fetchActivity()
    }
  }, [params.id, user, userLoaded])

  const handleJoin = async () => {
    if (!user) {
      toast.error('Please sign in to join activities')
      return
    }

    // If activity is free, join directly without payment
    if (activity && activity.price === 0) {
      setIsJoining(true)
      try {
        const response = await fetch(`/api/activities/${params.id}/join`, {
          method: 'POST',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to join activity')
        }

        toast.success('Successfully joined the activity!')
        setHasJoined(true)

        // Refresh activity data
        const activityResponse = await fetch(`/api/activities/${params.id}`)
        const data = await activityResponse.json()
        setActivity(data)
      } catch (error) {
        console.error('Error joining activity:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to join activity')
      } finally {
        setIsJoining(false)
      }
      return
    }

    // For paid activities, redirect to Stripe Checkout
    setIsJoining(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: params.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start payment')
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return

    setIsJoining(true)
    try {
      const response = await fetch(`/api/activities/${params.id}/join`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to leave activity')
      }

      toast.success('Successfully left the activity')
      setHasJoined(false)

      // Refresh activity data
      const activityResponse = await fetch(`/api/activities/${params.id}`)
      const data = await activityResponse.json()
      setActivity(data)
    } catch (error) {
      console.error('Error leaving activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to leave activity')
    } finally {
      setIsJoining(false)
    }
  }

  const handleAddToGoogleCalendar = () => {
    if (!activity || !activity.startTime) {
      toast.error('Activity details are incomplete')
      return
    }

    const joinedCount = activity.userActivities.filter(ua => ua.status === 'JOINED').length
    const location = activity.city
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

    const description = `${activity.description || ''}

📍 Location: ${location}
🔗 Maps: ${mapsLink}

👤 Host: ${activity.user.name || 'Anonymous'} (${activity.user.email})
💰 Price: ${activity.currency} ${activity.price.toFixed(2)}
👥 Participants: ${joinedCount}${activity.maxPeople ? ` of ${activity.maxPeople}` : ''}

Organized via sweatbuddies - Find local workouts and wellness activities
`.trim()

    const calendarUrl = generateGoogleCalendarUrl({
      title: activity.title,
      description,
      location,
      startTime: new Date(activity.startTime),
      endTime: activity.endTime ? new Date(activity.endTime) : new Date(new Date(activity.startTime).getTime() + 60 * 60 * 1000), // Default 1 hour if no end time
    })

    window.open(calendarUrl, '_blank')
    toast.success('Opening Google Calendar...')
  }

  const handleDownloadIcs = () => {
    if (!activity || !activity.startTime) {
      toast.error('Activity details are incomplete')
      return
    }

    const joinedCount = activity.userActivities.filter(ua => ua.status === 'JOINED').length
    const location = activity.city
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

    const description = `${activity.description || ''}

Location: ${location}
Maps: ${mapsLink}

Host: ${activity.user.name || 'Anonymous'} (${activity.user.email})
Price: ${activity.currency} ${activity.price.toFixed(2)}
Participants: ${joinedCount}${activity.maxPeople ? ` of ${activity.maxPeople}` : ''}

Organized via sweatbuddies
`.trim()

    downloadIcsFile(
      {
        title: activity.title,
        description,
        location,
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : new Date(new Date(activity.startTime).getTime() + 60 * 60 * 1000),
      },
      `${activity.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
    )

    toast.success('Calendar event downloaded!')
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </>
    )
  }

  if (!activity) {
    notFound()
  }

  const mapCenter = {
    lat: activity.latitude,
    lng: activity.longitude,
  }

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{activity.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {activity.type}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                📍 {activity.city}
              </a>
              {activity.startTime && (
                <span>
                  🕒 {new Date(activity.startTime).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {activity.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden border">
              <img
                src={activity.imageUrl}
                alt={activity.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              {activity.description && (
                <div className="rounded-lg border p-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground">{activity.description}</p>
                </div>
              )}

              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-3">Details</h2>
                <dl className="space-y-2">
                  {activity.price > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Price:</dt>
                      <dd className="font-semibold text-green-600">
                        {activity.currency} {activity.price.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  {activity.maxPeople && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Max People:</dt>
                      <dd className="font-medium">{activity.maxPeople}</dd>
                    </div>
                  )}
                  {activity.startTime && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Start:</dt>
                      <dd className="font-medium">
                        {new Date(activity.startTime).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {activity.endTime && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">End:</dt>
                      <dd className="font-medium">
                        {new Date(activity.endTime).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <dt className="text-muted-foreground mb-2">Participants:</dt>
                    <dd>
                      <AvatarStack
                        participants={activity.userActivities
                          .filter(ua => ua.status === 'JOINED')
                          .map(ua => ua.user)}
                        maxPeople={activity.maxPeople}
                        size="md"
                      />
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-3">Organizer</h2>
                <div className="flex items-center gap-3">
                  {activity.user.imageUrl ? (
                    <img
                      src={activity.user.imageUrl}
                      alt={activity.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {activity.user.name?.[0] || activity.user.email[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{activity.user.name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">{activity.user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-3">Location</h2>
              {GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' && mapLoaded ? (
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={mapCenter}
                  zoom={15}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
              ) : (
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      📍 {activity.city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
                    </p>
                    {GOOGLE_MAPS_API_KEY && !mapLoaded && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Loading map...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RSVP Action Section - Sticky on mobile */}
          {user && (
            <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-8 bg-background border-t md:border md:rounded-lg p-4 shadow-lg md:shadow-none z-50">
              <div className="container mx-auto max-w-4xl">
                {user.id === activity.hostId || user.id === activity.user.id ? (
                  <div className="flex gap-4">
                    <Link href={`/activities/${activity.id}/edit`} className="flex-1">
                      <Button size="lg" className="w-full">
                        Edit Activity
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center">
                      You are the host
                    </p>
                  </div>
                ) : hasJoined ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        onClick={() => setIsMessagingOpen(true)}
                        className="flex-1"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message Host
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddToGoogleCalendar}
                        className="flex-1"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLeave}
                        disabled={isJoining}
                        className="flex-1"
                      >
                        {isJoining ? 'Leaving...' : 'Leave Activity'}
                      </Button>
                      <p className="text-sm text-green-600 font-medium flex items-center">
                        ✓ Joined
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full"
                  >
                    {isJoining
                      ? 'Processing...'
                      : activity.price > 0
                        ? `Pay ${activity.currency} ${activity.price.toFixed(2)} & Join`
                        : 'Join Activity'
                    }
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {activity && (
          <ActivityMessaging
            activityId={activity.id}
            hostName={activity.user.name}
            open={isMessagingOpen}
            onOpenChange={setIsMessagingOpen}
          />
        )}
      </main>
    </>
  )
}
