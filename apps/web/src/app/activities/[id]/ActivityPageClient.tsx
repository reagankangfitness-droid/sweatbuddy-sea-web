'use client'

import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, DollarSign, Users, ChevronDown, ChevronUp, Flag, Settings, MessageCircle, Calendar, BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState, lazy, Suspense, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useActivityJoin } from '@/hooks/useActivityJoin'
import Link from 'next/link'
import { WhosGoing } from '@/components/whos-going'
import { ShareButton } from '@/components/share-button'
import { SpotsIndicator } from '@/components/spots-indicator'
import { WaitlistButton } from '@/components/waitlist-button'
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar'
import { PostActivityPrompt } from '@/components/post-activity-prompt'
import { GoingSoloPrompt } from '@/components/going-solo-prompt'
import { getSignInUrl } from '@/lib/auth-utils'
import { ReportModal } from '@/components/p2p/ReportModal'
import { BlockUserButton } from '@/components/p2p/BlockUserButton'
import { ManageAttendeesModal } from '@/components/p2p/ManageAttendeesModal'
import { SessionComments } from '@/components/p2p/SessionComments'
import { getActivityConfig } from '@/lib/activity-types'

import { DESCRIPTION_CHAR_LIMIT } from '@/config/constants'

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
  address?: string | null
  categorySlug?: string | null
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
  // P2P fields
  activityMode?: string
  fitnessLevel?: string | null
  whatToBring?: string | null
  requiresApproval?: boolean
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
    slug?: string | null
    bio?: string | null
    sessionsHostedCount?: number
    sessionsAttendedCount?: number
    fitnessLevel?: string | null
    isCoach?: boolean
    coachType?: string | null
    coachVerificationStatus?: string | null
    coachBio?: string | null
  }
  userActivities: Array<{
    id: string
    userId: string
    status: string
    user: {
      id: string
      name: string | null
      imageUrl: string | null
      slug?: string | null
    }
  }>
  friendsGoing?: { id: string; name: string | null; firstName: string | null; imageUrl: string | null }[]
}

function formatEventDate(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Singapore',
  }) + ' \u00b7 ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Singapore',
  })
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free'
  return `${currency} ${(price / 100).toFixed(2)}`
}

export default function ActivityPageClient({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded: userLoaded } = useUser()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagingOpen, setIsMessagingOpen] = useState(false)
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false)
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(true)
  const [showGoingSoloPrompt, setShowGoingSoloPrompt] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showManageAttendees, setShowManageAttendees] = useState(false)
  const [showAllAttendees, setShowAllAttendees] = useState(false)

  const onShowGoingSoloPrompt = useCallback(() => setShowGoingSoloPrompt(true), [])

  const {
    isJoining,
    hasJoined,
    spotsInfo,
    userBookingId,
    handleJoin,
    handleLeave,
    handleWaitlistChange,
    checkJoinStatus,
    setHasJoined,
    joinButtonText,
  } = useActivityJoin(params.id, user?.id ?? null, {
    activityMode: activity?.activityMode,
    userActivities: activity?.userActivities,
    onActivityRefresh: setActivity,
    onShowGoingSoloPrompt,
  })

  // Handle payment status from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'success' || sessionId) {
      toast.success('Payment successful! You have joined the activity.')
      checkJoinStatus()
      // Remove the query param
      router.replace(`/activities/${params.id}`)
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. Please try again if you want to join.')
      // Remove the query param
      router.replace(`/activities/${params.id}`)
    }
  }, [searchParams, router, params.id, checkJoinStatus])

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

  const handleAddToGoogleCalendar = () => {
    if (!activity || !activity.startTime) {
      toast.error('Activity details are incomplete')
      return
    }

    const joinedCount = activity.userActivities.filter(ua => ua.status === 'JOINED').length
    const location = activity.city
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

    const description = `${activity.description || ''}

\u{1F4CD} Location: ${location}
\u{1F517} Maps: ${mapsLink}

\u{1F464} Host: ${activity.user.name || 'Anonymous'} (${activity.user.email})
\u{1F4B0} Price: ${activity.currency} ${(activity.price / 100).toFixed(2)}
\u{1F465} Participants: ${joinedCount}${activity.maxPeople ? ` of ${activity.maxPeople}` : ''}

Organized via sweatbuddies - Find local workouts and wellness activities
`.trim()

    const calendarUrl = generateGoogleCalendarUrl({
      title: activity.title,
      description,
      location,
      startTime: new Date(activity.startTime),
      endTime: activity.endTime ? new Date(activity.endTime) : new Date(new Date(activity.startTime).getTime() + 60 * 60 * 1000),
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
Price: ${activity.currency} ${(activity.price / 100).toFixed(2)}
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
      <div className="min-h-screen bg-[#FFFBF8]">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-black/[0.06]">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="max-w-2xl mx-auto flex items-center gap-4 px-4 py-3">
              <button onClick={() => router.back()} aria-label="Go back" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFFBF8] border border-black/[0.06]">
                <ArrowLeft className="w-5 h-5 text-[#71717A]" />
              </button>
              <span className="text-sm font-medium text-[#71717A]">Activity Details</span>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto p-8">
          <div className="text-center">
            <div className="w-full h-56 bg-neutral-100 rounded-2xl animate-pulse mb-6" />
            <div className="h-6 bg-neutral-100 rounded-lg animate-pulse w-2/3 mx-auto mb-3" />
            <div className="h-4 bg-neutral-100 rounded-lg animate-pulse w-1/2 mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  if (!activity) {
    notFound()
  }

  const joinedAttendees = activity.userActivities.filter(ua => ua.status === 'JOINED')
  const joinedCount = joinedAttendees.length
  const activityConfig = activity.categorySlug ? getActivityConfig(activity.categorySlug) : null
  const emoji = activityConfig?.emoji || '\u{1F3CB}\u{FE0F}'
  const isHost = user && (user.id === activity.hostId || user.id === activity.user.id)
  const isVerifiedCoach = activity.user.isCoach && activity.user.coachVerificationStatus === 'VERIFIED'
  const locationDisplay = activity.address || activity.city
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationDisplay)}`

  return (
    <div className="min-h-screen bg-[#FFFBF8]">
      {/* ─── HERO ─── */}
      <div className="relative">
        {/* Back button overlay */}
        <div className="absolute top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top,0px)]">
          <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
            <button onClick={() => router.back()} aria-label="Go back" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-black/[0.06] shadow-sm">
              <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <ShareButton
              activityId={activity.id}
              activityTitle={activity.title}
              activityDescription={activity.description}
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-black/[0.06] shadow-sm"
              showLabel={false}
            />
          </div>
        </div>

        {activity.imageUrl ? (
          <div className="relative h-56 md:h-72 w-full">
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              className="w-full h-full object-cover"
              fill
              priority
              unoptimized
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight mb-1 line-clamp-2">{activity.title}</h1>
                {activity.startTime && (
                  <p className="text-sm text-white/80 font-medium">{formatEventDate(new Date(activity.startTime))}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-56 md:h-72 w-full bg-gradient-to-br from-[#FF6B35]/20 via-[#FF8B55]/10 to-[#FFFBF8] flex items-center justify-center">
            <span className="text-7xl md:text-8xl">{emoji}</span>
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] leading-tight mb-1 line-clamp-2">{activity.title}</h1>
                {activity.startTime && (
                  <p className="text-sm text-[#4A4A5A] font-medium">{formatEventDate(new Date(activity.startTime))}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-5 pb-32 sm:pb-8">
        {/* ─── GOING SOLO PROMPT ─── */}
        {hasJoined && showGoingSoloPrompt && (
          <div className="mb-5">
            <GoingSoloPrompt
              activityId={activity.id}
              onOptIn={() => setShowGoingSoloPrompt(false)}
            />
          </div>
        )}

        {/* ─── POST-ACTIVITY COMPLETION PROMPT ─── */}
        {hasJoined &&
          userBookingId &&
          showCompletionPrompt &&
          activity.startTime &&
          new Date(activity.startTime) < new Date() && (
          <div className="mb-5">
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

        {/* ─── STRUCTURED INFO CARD ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4">
          <div className="space-y-3.5">
            {/* Date/time */}
            {activity.startTime && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4.5 h-4.5 text-[#FF6B35]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#1A1A1A]">
                    {formatEventDate(new Date(activity.startTime))}
                  </p>
                  {activity.endTime && (
                    <p className="text-[12px] text-[#71717A] mt-0.5">
                      Ends {new Date(activity.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4.5 h-4.5 text-[#FF6B35]" />
              </div>
              <div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-[#1A1A1A] hover:text-[#FF6B35] transition-colors"
                >
                  {locationDisplay}
                </a>
                <p className="text-[12px] text-[#FF6B35] mt-0.5">Open in Google Maps</p>
              </div>
            </div>

            {/* Price + Spots row */}
            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                activity.price === 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-[#FF6B35]/10 text-[#FF6B35]'
              }`}>
                {activity.price === 0 ? (
                  'Free'
                ) : (
                  <>{formatPrice(activity.price, activity.currency)}</>
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-[12px] font-semibold text-[#4A4A5A]">
                <Users className="w-3.5 h-3.5" />
                {activity.maxPeople
                  ? `${joinedCount}/${activity.maxPeople} spots filled`
                  : joinedCount > 0
                    ? `${joinedCount} going`
                    : 'Open'
                }
              </span>

              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-100 text-[12px] font-medium text-[#4A4A5A]">
                {activity.type}
              </span>
            </div>
          </div>
        </div>

        {/* ─── INLINE ATTENDEE PREVIEW ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Who&apos;s going</h3>
            {joinedCount > 0 && (
              <button
                onClick={() => setShowAllAttendees(true)}
                className="text-[12px] font-medium text-[#FF6B35] hover:text-[#FF6B35]/80 transition-colors"
              >
                See all
              </button>
            )}
          </div>
          {joinedCount > 0 ? (
            <button
              onClick={() => setShowAllAttendees(true)}
              className="flex items-center gap-2 mt-3 w-full text-left"
            >
              <div className="flex -space-x-2">
                {joinedAttendees.slice(0, 5).map((ua) => (
                  ua.user.imageUrl ? (
                    <Image
                      key={ua.id}
                      src={ua.user.imageUrl}
                      alt={ua.user.name || 'Attendee'}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      unoptimized
                    />
                  ) : (
                    <div
                      key={ua.id}
                      className="w-9 h-9 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[12px] font-semibold text-[#71717A]"
                    >
                      {(ua.user.name ?? '?')[0]}
                    </div>
                  )
                ))}
              </div>
              {joinedCount > 5 && (
                <span className="text-[13px] font-medium text-[#4A4A5A]">+{joinedCount - 5} more</span>
              )}
            </button>
          ) : (
            <p className="text-[13px] text-[#9A9AAA] mt-2">Be the first to join!</p>
          )}
        </div>

        {/* ─── FRIENDS GOING ─── */}
        {activity.friendsGoing && activity.friendsGoing.length > 0 && (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 mb-4">
            <h3 className="text-[14px] font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends Going
            </h3>
            <div className="flex flex-wrap gap-3">
              {activity.friendsGoing.map((friend) => (
                <div key={friend.id} className="flex items-center gap-2">
                  {friend.imageUrl ? (
                    <Image
                      src={friend.imageUrl}
                      alt={friend.name || 'Friend'}
                      width={28}
                      height={28}
                      className="rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-medium text-indigo-700">
                      {(friend.firstName || friend.name || '?').charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-indigo-800">
                    {friend.firstName || friend.name || 'Anonymous'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── MEET YOUR HOST CARD ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9AAA] mb-3">
            {isVerifiedCoach ? 'Your coach' : 'Meet your host'}
          </h3>
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              {activity.user.slug ? (
                <Link href={`/user/${activity.user.slug}`}>
                  {activity.user.imageUrl ? (
                    <Image
                      src={activity.user.imageUrl}
                      alt={activity.user.name || 'Host'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-100"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-semibold text-[#71717A]">
                      {(activity.user.name ?? '?')[0]}
                    </div>
                  )}
                </Link>
              ) : (
                activity.user.imageUrl ? (
                  <Image
                    src={activity.user.imageUrl}
                    alt={activity.user.name || 'Host'}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-100"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-semibold text-[#71717A]">
                    {(activity.user.name ?? '?')[0]}
                  </div>
                )
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {activity.user.slug ? (
                  <Link href={`/user/${activity.user.slug}`} className="font-semibold text-[15px] text-[#1A1A1A] hover:text-[#FF6B35] transition-colors">
                    {activity.user.name || 'Anonymous'}
                  </Link>
                ) : (
                  <p className="font-semibold text-[15px] text-[#1A1A1A]">{activity.user.name || 'Anonymous'}</p>
                )}
                {isVerifiedCoach && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              {isVerifiedCoach && activity.user.coachType && (
                <p className="text-[12px] text-[#71717A] mt-0.5">{activity.user.coachType}</p>
              )}
              {/* Stats row */}
              <div className="flex items-center gap-2 mt-1 text-[12px] text-[#71717A]">
                {(activity.user.sessionsHostedCount ?? 0) > 0 && (
                  <span>{activity.user.sessionsHostedCount} sessions hosted</span>
                )}
                {(activity.user.sessionsHostedCount ?? 0) > 0 && (activity.user.sessionsAttendedCount ?? 0) > 0 && (
                  <span className="text-[#9A9AAA]">&middot;</span>
                )}
                {(activity.user.sessionsAttendedCount ?? 0) > 0 && (
                  <span>{activity.user.sessionsAttendedCount} attended</span>
                )}
                {activity.user.fitnessLevel && (
                  <>
                    <span className="text-[#9A9AAA]">&middot;</span>
                    <span className="capitalize">{activity.user.fitnessLevel.toLowerCase()}</span>
                  </>
                )}
              </div>
              {/* Bio */}
              {isVerifiedCoach && activity.user.coachBio ? (
                <p className="text-[13px] text-[#4A4A5A] mt-2 line-clamp-2">{activity.user.coachBio}</p>
              ) : activity.user.bio ? (
                <p className="text-[13px] text-[#4A4A5A] mt-2 line-clamp-2">{activity.user.bio}</p>
              ) : null}
            </div>
          </div>

          {/* P2P details */}
          {activity.activityMode?.startsWith('P2P') && (activity.fitnessLevel || activity.whatToBring) && (
            <div className="mt-4 pt-3 border-t border-black/[0.04] space-y-2 text-[13px] text-[#4A4A5A]">
              {activity.fitnessLevel && activity.fitnessLevel !== 'ALL' && (
                <div className="flex items-center gap-2">
                  <span>💪</span>
                  <span>
                    {activity.fitnessLevel === 'INTERMEDIATE_PLUS' ? 'Intermediate & above' :
                     activity.fitnessLevel === 'ADVANCED' ? 'Advanced only' : 'All levels welcome'}
                  </span>
                </div>
              )}
              {activity.whatToBring && (
                <div className="flex items-center gap-2">
                  <span>🎒</span>
                  <span>{activity.whatToBring}</span>
                </div>
              )}
            </div>
          )}

          {/* Report / Block -- only for non-hosts */}
          {user && user.id !== activity.user.id && user.id !== activity.hostId && (
            <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center gap-4">
              <button
                onClick={() => setShowReportModal(true)}
                aria-label="Report this activity"
                className="flex items-center gap-1.5 text-[12px] text-[#9A9AAA] hover:text-amber-500 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
              <BlockUserButton
                blockedUserId={activity.user.id}
                blockedUserName={activity.user.name ?? undefined}
              />
            </div>
          )}

          {/* Manage Attendees -- host only */}
          {user && (user.id === activity.user.id || user.id === activity.hostId) && (
            <div className="mt-4 pt-3 border-t border-black/[0.04]">
              <button
                onClick={() => setShowManageAttendees(true)}
                aria-label="Manage session attendees"
                className="flex items-center gap-1.5 text-[12px] text-[#71717A] hover:text-[#1A1A1A] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage attendees
              </button>
            </div>
          )}
        </div>

        {/* ─── DESCRIPTION ─── */}
        {activity.description && (
          <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9AAA] mb-3">About this session</h3>
            <div className="relative">
              <p className={`text-[14px] text-[#4A4A5A] whitespace-pre-wrap break-words leading-relaxed ${
                !isDescriptionExpanded && activity.description.length > DESCRIPTION_CHAR_LIMIT
                  ? 'line-clamp-4'
                  : ''
              }`}>
                {activity.description}
              </p>
              {activity.description.length > DESCRIPTION_CHAR_LIMIT && (
                <>
                  {!isDescriptionExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    aria-expanded={isDescriptionExpanded}
                    aria-label={isDescriptionExpanded ? 'Show less description' : 'Read more description'}
                    className="mt-2 text-[13px] font-medium text-[#FF6B35] hover:text-[#FF6B35]/80 transition-colors flex items-center gap-1"
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

        {/* ─── MAP ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9AAA] mb-3">Location</h3>
          <Suspense fallback={
            <div className="w-full h-[200px] bg-neutral-100 rounded-xl animate-pulse flex items-center justify-center">
              <p className="text-[13px] text-[#9A9AAA]">Loading map...</p>
            </div>
          }>
            <div className="rounded-xl overflow-hidden">
              <GoogleMapLazy
                latitude={activity.latitude}
                longitude={activity.longitude}
                title={activity.title}
              />
            </div>
          </Suspense>
        </div>

        {/* ─── FULL ATTENDEE LIST (WhosGoing component) ─── */}
        {showAllAttendees && (
          <div className="mb-4">
            <WhosGoing
              activityId={activity.id}
              hasJoined={hasJoined}
              currentUserId={user?.id || null}
            />
          </div>
        )}

        {/* ─── STICKY BOTTOM CTA ─── */}
        {user && (
          <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-4 bg-white/95 backdrop-blur-lg border-t border-black/[0.06] md:border md:rounded-2xl p-3 sm:p-4 shadow-lg md:shadow-sm z-40 pb-[env(safe-area-inset-bottom,16px)]">
            <div className="max-w-2xl mx-auto">
              {isHost ? (
                /* Host view */
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex gap-2 sm:gap-3">
                    <Link href={`/activities/${activity.id}/edit`} className="flex-1">
                      <Button size="sm" className="w-full h-11 sm:h-10 text-xs sm:text-sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => setIsGroupChatOpen(true)}
                      variant="default"
                      className="flex-1 h-11 sm:h-10 text-xs sm:text-sm"
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
                  <p className="text-xs sm:text-sm text-[#9A9AAA] text-center">
                    You are the host
                  </p>
                </div>
              ) : hasJoined ? (
                /* Joined user view */
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      size="sm"
                      onClick={() => setIsGroupChatOpen(true)}
                      variant="default"
                      className="flex-1 h-11 sm:h-10 text-xs sm:text-sm"
                    >
                      <Users className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Group Chat</span>
                      <span className="sm:hidden">Chat</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsMessagingOpen(true)}
                      variant="outline"
                      className="flex-1 h-11 sm:h-10 text-xs sm:text-sm"
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
                      className="flex-1 h-11 sm:h-10 text-xs sm:text-sm"
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
                      className="text-xs sm:text-sm text-[#9A9AAA]"
                    >
                      {isJoining ? 'Leaving...' : 'Leave'}
                    </Button>
                    <span className="text-xs sm:text-sm text-green-500 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Joined
                    </span>
                  </div>
                </div>
              ) : spotsInfo?.isFull && spotsInfo.waitlistEnabled ? (
                /* Full -- waitlist */
                <div className="space-y-3">
                  <SpotsIndicator
                    spotsRemaining={spotsInfo.spotsRemaining}
                    totalSpots={spotsInfo.totalSpots}
                    waitlistCount={spotsInfo.waitlistCount}
                    urgencyLevel={spotsInfo.urgencyLevel}
                    variant="detailed"
                    showProgress
                  />
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
                  <p className="text-xs text-center text-[#9A9AAA]">
                    We&apos;ll notify you immediately when a spot opens up
                  </p>
                </div>
              ) : (
                /* Not joined -- CTA */
                <div className="space-y-3">
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
                      className="flex-1 h-12 sm:h-11 text-sm sm:text-base touch-manipulation bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] hover:from-[#FF6B35]/90 hover:to-[#FF8B55]/90 text-white border-0 shadow-md"
                    >
                      {isJoining ? 'Processing...' : (
                        <>
                          {activity.user.isCoach ? 'Book Session' : joinButtonText}
                          {activity.price > 0 && (
                            <span className="ml-2 opacity-90">&middot; {formatPrice(activity.price, activity.currency)}</span>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action bar for non-logged-in users */}
        {!user && userLoaded && (
          <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-4 bg-white/95 backdrop-blur-lg border-t border-black/[0.06] md:border md:rounded-2xl p-3 sm:p-4 shadow-lg md:shadow-sm z-40 pb-[env(safe-area-inset-bottom,16px)]">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 sm:gap-3 items-center">
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
                    const signInUrl = getSignInUrl({
                      intent: 'rsvp',
                      eventId: params.id,
                    })
                    window.location.href = signInUrl
                  }}
                  className="flex-1 h-11 text-sm sm:text-base bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] hover:from-[#FF6B35]/90 hover:to-[#FF8B55]/90 text-white border-0 shadow-md"
                >
                  {activity.price > 0
                    ? `Sign in \u00b7 ${formatPrice(activity.price, activity.currency)}`
                    : 'Sign in to Join'
                  }
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── P2P COMMENTS ─── */}
        {activity?.activityMode?.startsWith('P2P') && (
          <div className="mt-4">
            <SessionComments
              activityId={activity.id}
              currentUserId={user?.id ?? null}
              hostUserId={activity.user.id}
            />
          </div>
        )}

        {/* ─── MODALS ─── */}
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

        {showReportModal && activity && (
          <ReportModal
            reportedType="ACTIVITY"
            reportedId={activity.id}
            reportedName={activity.title}
            onClose={() => setShowReportModal(false)}
          />
        )}
        {showManageAttendees && activity && (
          <ManageAttendeesModal
            activityId={activity.id}
            attendees={activity.userActivities
              .filter((ua) => ua.status === 'JOINED')
              .map((ua) => ({ ...ua.user, slug: ua.user.slug ?? null }))}
            onClose={() => setShowManageAttendees(false)}
            onAttendeeRemoved={(userId) => {
              setActivity((prev) => prev ? {
                ...prev,
                userActivities: prev.userActivities.map((ua) =>
                  ua.userId === userId ? { ...ua, status: 'CANCELLED' } : ua
                ),
              } : prev)
            }}
          />
        )}
      </main>
    </div>
  )
}
