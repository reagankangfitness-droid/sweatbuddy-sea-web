'use client'

import { Header } from '@/components/header'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { AvatarStack } from '@/components/avatar-stack'
import { ShareButton } from '@/components/share-button'
import { SpotsIndicator } from '@/components/spots-indicator'
import { WaitlistButton } from '@/components/waitlist-button'
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar'
import { Calendar, MessageCircle, Users, ChevronDown, ChevronUp } from 'lucide-react'
import type { UrgencyLevel } from '@/lib/waitlist'
import { PostActivityPrompt } from '@/components/post-activity-prompt'
import { getSignInUrl } from '@/lib/auth-utils'

// Character limit for description before showing "Read More"
const DESCRIPTION_CHAR_LIMIT = 300

interface SpotsInfo {
  totalSpots: number
  spotsRemaining: number
  spotsTaken: number
  percentFilled: number
  urgencyLevel: UrgencyLevel
  showSpotsRemaining: boolean
  urgencyThreshold: number
  waitlistEnabled: boolean
  waitlistLimit: number
  waitlistCount: number
  isFull: boolean
  userWaitlistStatus?: {
    isOnWaitlist: boolean
    position: number
    status: string
    notifiedAt: Date | null
    expiresAt: Date | null
  } | null
}

// Lazy load heavy components
const ActivityMessaging = lazy(() => import('@/components/activity-messaging').then(m => ({ default: m.ActivityMessaging })))
const ActivityGroupChat = lazy(() => import('@/components/activity-group-chat').then(m => ({ default: m.ActivityGroupChat })))
const GoogleMapLazy = lazy(() => import('@/components/google-map-lazy').then(m => ({ default: m.GoogleMapLazy })))

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
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isMessagingOpen, setIsMessagingOpen] = useState(false)
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false)
  const [spotsInfo, setSpotsInfo] = useState<SpotsInfo | null>(null)
  const [userBookingId, setUserBookingId] = useState<string | null>(null)
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(true)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  // Handle payment status from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'success' || sessionId) {
      toast.success('Payment successful! You have joined the activity.')
      setHasJoined(true)
      // Remove the query param
      router.replace(`/activities/${params.id}`)
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. Please try again if you want to join.')
      // Remove the query param
      router.replace(`/activities/${params.id}`)
    }
  }, [searchParams, router, params.id])

  // Fetch activity data immediately (don't wait for auth)
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
      } catch {
        setActivity(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivity()
  }, [params.id])

  // Check if user has joined (separate effect that runs when user loads)
  useEffect(() => {
    if (user && activity?.userActivities) {
      const userRsvp = activity.userActivities.find(
        (ua: any) => ua.userId === user.id && ua.status === 'JOINED'
      )
      setHasJoined(!!userRsvp)
      setUserBookingId(userRsvp?.id || null)
    }
  }, [user, activity])

  // Fetch spots info including waitlist status
  useEffect(() => {
    async function fetchSpotsInfo() {
      if (!activity?.id) return

      try {
        const response = await fetch(`/api/waitlist/status?activityId=${activity.id}`)
        if (response.ok) {
          const data = await response.json()
          setSpotsInfo(data)
        }
      } catch {
        // Error handled silently
      }
    }

    fetchSpotsInfo()
  }, [activity?.id])

  // Refresh spots info when waitlist status changes
  const handleWaitlistChange = async () => {
    if (!activity?.id) return

    try {
      const response = await fetch(`/api/waitlist/status?activityId=${activity.id}`)
      if (response.ok) {
        const data = await response.json()
        setSpotsInfo(data)
      }
    } catch {
      // Error handled silently
    }
  }

  const handleJoin = async () => {
    if (!user) {
      toast.error('Please sign in to join activities')
      return
    }

    setIsJoining(true)

    // Get invite code from URL if present (for referral discounts)
    const inviteCode = searchParams.get('invite') || searchParams.get('code')

    try {
      // Use the checkout session API for both free and paid activities
      // This ensures consistent handling and proper referral tracking
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: params.id,
          inviteCode: inviteCode || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process booking')
      }

      const data = await response.json()

      // Handle free activities (no Stripe redirect)
      if (data.isFree) {
        toast.success('Successfully joined the activity!')
        setHasJoined(true)

        // Refresh activity data
        const activityResponse = await fetch(`/api/activities/${params.id}`)
        const activityData = await activityResponse.json()
        setActivity(activityData)
        setIsJoining(false)
        return
      }

      // For paid activities, redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process booking')
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

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-32 sm:pt-28 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold leading-tight">{activity.title}</h1>
              {/* Share button in header - hidden on mobile since it's in bottom bar */}
              <ShareButton
                activityId={activity.id}
                activityTitle={activity.title}
                activityDescription={activity.description}
                variant="outline"
                size="sm"
                className="shrink-0 hidden sm:flex"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary-dark font-medium">
                {activity.type}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-dark transition-colors inline-flex items-center gap-1"
              >
                📍 {activity.city}
              </a>
              {activity.startTime && (
                <span>
                  🕒 {new Date(activity.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Singapore' })}
                </span>
              )}
            </div>
          </div>

          {activity.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden border relative h-96">
              <Image
                src={activity.imageUrl}
                alt={activity.title}
                className="w-full h-full object-cover"
                fill
                unoptimized
              />
            </div>
          )}

          {/* Post-activity completion card prompt */}
          {hasJoined &&
            userBookingId &&
            showCompletionPrompt &&
            activity.startTime &&
            new Date(activity.startTime) < new Date() && (
            <div className="mb-6">
              <PostActivityPrompt
                userActivityId={userBookingId}
                activityTitle={activity.title}
                activityImage={activity.imageUrl}
                hostName={activity.user.name || 'Host'}
                hostAvatar={activity.user.imageUrl}
                completedAt={new Date(activity.startTime)}
                durationMinutes={
                  activity.endTime && activity.startTime
                    ? Math.round((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000)
                    : null
                }
                onDismiss={() => setShowCompletionPrompt(false)}
              />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              {activity.description && (
                <div className="rounded-lg border p-6 overflow-hidden">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <div className="relative">
                    <p className={`text-muted-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere ${
                      !isDescriptionExpanded && activity.description.length > DESCRIPTION_CHAR_LIMIT
                        ? 'line-clamp-4'
                        : ''
                    }`}>
                      {activity.description}
                    </p>
                    {activity.description.length > DESCRIPTION_CHAR_LIMIT && (
                      <>
                        {!isDescriptionExpanded && (
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                        )}
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              Show less
                              <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Read more
                              <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
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
                        {new Date(activity.startTime).toLocaleString('en-US', { timeZone: 'Asia/Singapore' })}
                      </dd>
                    </div>
                  )}
                  {activity.endTime && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">End:</dt>
                      <dd className="font-medium">
                        {new Date(activity.endTime).toLocaleString('en-US', { timeZone: 'Asia/Singapore' })}
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
                    <Image
                      src={activity.user.imageUrl}
                      alt={activity.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                      width={40}
                      height={40}
                      unoptimized
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
              <Suspense fallback={
                <div className="w-full h-[300px] bg-muted rounded-lg animate-pulse flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Loading map...</p>
                </div>
              }>
                <GoogleMapLazy
                  latitude={activity.latitude}
                  longitude={activity.longitude}
                  title={activity.title}
                />
              </Suspense>
            </div>
          </div>

          {/* RSVP Action Section - Sticky on mobile with safe area */}
          {user && (
            <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-8 bg-background border-t md:border md:rounded-lg p-3 sm:p-4 shadow-lg md:shadow-none z-50 safe-area-inset-bottom">
              <div className="container mx-auto max-w-4xl">
                {user.id === activity.hostId || user.id === activity.user.id ? (
                  // Host view - simplified for mobile
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex gap-2 sm:gap-3">
                      <Link href={`/activities/${activity.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full h-10 sm:h-9 text-xs sm:text-sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => setIsGroupChatOpen(true)}
                        variant="default"
                        className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                      >
                        <Users className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Group Chat</span>
                        <span className="sm:hidden">Chat</span>
                      </Button>
                      <ShareButton
                        activityId={activity.id}
                        activityTitle={activity.title}
                        activityDescription={activity.description}
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-10 w-10 sm:hidden"
                        showLabel={false}
                      />
                      <ShareButton
                        activityId={activity.id}
                        activityTitle={activity.title}
                        activityDescription={activity.description}
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex flex-1"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      You are the host
                    </p>
                  </div>
                ) : hasJoined ? (
                  // Joined user view - compact for mobile
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        onClick={() => setIsGroupChatOpen(true)}
                        variant="default"
                        className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                      >
                        <Users className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Group Chat</span>
                        <span className="sm:hidden">Chat</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsMessagingOpen(true)}
                        variant="outline"
                        className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                      >
                        <MessageCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Message Host</span>
                        <span className="sm:hidden">Host</span>
                      </Button>
                      <ShareButton
                        activityId={activity.id}
                        activityTitle={activity.title}
                        activityDescription={activity.description}
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-10 w-10"
                        showLabel={false}
                      />
                    </div>
                    <div className="flex gap-2 sm:gap-3 items-center">
                      <Button
                        size="sm"
                        onClick={handleAddToGoogleCalendar}
                        variant="outline"
                        className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                      >
                        <Calendar className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add to Calendar</span>
                        <span className="sm:hidden">Calendar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleLeave}
                        disabled={isJoining}
                        className="text-xs sm:text-sm text-muted-foreground"
                      >
                        {isJoining ? 'Leaving...' : 'Leave'}
                      </Button>
                      <span className="text-xs sm:text-sm text-green-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Joined
                      </span>
                    </div>
                  </div>
                ) : spotsInfo?.isFull && spotsInfo.waitlistEnabled ? (
                  // Activity is full - show waitlist option
                  <div className="space-y-3">
                    {/* Spots indicator */}
                    <SpotsIndicator
                      spotsRemaining={spotsInfo.spotsRemaining}
                      totalSpots={spotsInfo.totalSpots}
                      waitlistCount={spotsInfo.waitlistCount}
                      urgencyLevel={spotsInfo.urgencyLevel}
                      variant="detailed"
                      showProgress
                    />

                    {/* Waitlist button */}
                    <div className="flex gap-2 sm:gap-3 items-center">
                      <ShareButton
                        activityId={activity.id}
                        activityTitle={activity.title}
                        activityDescription={activity.description}
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-12 w-12 sm:h-11 sm:w-11 touch-manipulation"
                        showLabel={false}
                      />
                      <div className="flex-1">
                        <WaitlistButton
                          activityId={activity.id}
                          activityTitle={activity.title}
                          userWaitlistStatus={spotsInfo.userWaitlistStatus}
                          waitlistCount={spotsInfo.waitlistCount}
                          onStatusChange={handleWaitlistChange}
                          variant="large"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      We&apos;ll notify you immediately when a spot opens up
                    </p>
                  </div>
                ) : (
                  // Not joined - simple CTA with share
                  <div className="space-y-3">
                    {/* Show urgency if low spots */}
                    {spotsInfo && spotsInfo.urgencyLevel !== 'none' && spotsInfo.urgencyLevel !== 'full' && (
                      <SpotsIndicator
                        spotsRemaining={spotsInfo.spotsRemaining}
                        totalSpots={spotsInfo.totalSpots}
                        urgencyLevel={spotsInfo.urgencyLevel}
                        variant="detailed"
                        showProgress
                      />
                    )}

                    <div className="flex gap-2 sm:gap-3 items-center">
                      <ShareButton
                        activityId={activity.id}
                        activityTitle={activity.title}
                        activityDescription={activity.description}
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-12 w-12 sm:h-11 sm:w-11 touch-manipulation"
                        showLabel={false}
                      />
                      <Button
                        size="lg"
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="flex-1 h-12 sm:h-11 text-sm sm:text-base touch-manipulation"
                      >
                        {isJoining
                          ? 'Processing...'
                          : activity.price > 0
                            ? `Pay ${activity.currency} ${activity.price.toFixed(2)} & Join`
                            : 'Join Activity'
                        }
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action bar for non-logged-in users */}
          {!user && userLoaded && (
            <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-8 bg-background border-t md:border md:rounded-lg p-3 sm:p-4 shadow-lg md:shadow-none z-50 safe-area-inset-bottom">
              <div className="container mx-auto max-w-4xl">
                <div className="flex gap-2 sm:gap-3 items-center">
                  {/* Icon-only on mobile, with label on desktop */}
                  <ShareButton
                    activityId={activity.id}
                    activityTitle={activity.title}
                    activityDescription={activity.description}
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-11 w-11 sm:hidden"
                    showLabel={false}
                  />
                  <ShareButton
                    activityId={activity.id}
                    activityTitle={activity.title}
                    activityDescription={activity.description}
                    variant="outline"
                    size="default"
                    className="shrink-0 hidden sm:flex"
                  />
                  <Button
                    size="lg"
                    onClick={() => {
                      // Redirect to sign in with RSVP intent
                      const signInUrl = getSignInUrl({
                        intent: 'rsvp',
                        eventId: params.id,
                      })
                      window.location.href = signInUrl
                    }}
                    className="flex-1 h-11 text-sm sm:text-base"
                  >
                    {activity.price > 0
                      ? `Sign in (${activity.currency} ${activity.price.toFixed(2)})`
                      : 'Sign in to Join'
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {activity && (
          <Suspense fallback={null}>
            {isMessagingOpen && (
              <ActivityMessaging
                activityId={activity.id}
                hostName={activity.user.name}
                open={isMessagingOpen}
                onOpenChange={setIsMessagingOpen}
              />
            )}
            {isGroupChatOpen && (
              <ActivityGroupChat
                activityId={activity.id}
                open={isGroupChatOpen}
                onOpenChange={setIsGroupChatOpen}
              />
            )}
          </Suspense>
        )}
      </main>
    </>
  )
}
