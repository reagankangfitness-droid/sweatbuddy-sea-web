'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { format } from 'date-fns'
import { Plus, Loader2, Zap, Map, List, Search, X, ArrowRight, ChevronDown, Check, Users, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { LogoWithText } from '@/components/logo'
import { ACTIVITY_TYPES, getActivityEmoji } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { CreateChoiceSheet } from '@/components/CreateChoiceSheet'
import { SessionFeedbackSheet } from '@/components/SessionFeedbackSheet'
import { BioPromptSheet } from '@/components/BioPromptSheet'
import { LazySessionVectorMap, type SessionVectorMapPin } from '@/components/maps/LazySessionVectorMap'
import {
  CITY_LOCATION_CONFIGS,
  DEFAULT_CITY_LOCATION_CONFIG,
  getCityLocationConfig,
  getCityLocationConfigFromText,
  getNearestCityLocationConfig,
  type CityLocationConfig,
  type CityNeighborhood,
} from '@/lib/location-config'

interface Host {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
  sessionsHostedCount: number
  fitnessLevel: string | null
  isCoach?: boolean
  coachVerificationStatus?: string | null
}

interface Attendee {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
  goingSolo?: boolean
}

interface Session {
  id: string
  title: string
  description: string | null
  activityMode: string
  categorySlug: string | null
  city: string
  address: string | null
  latitude?: number
  longitude?: number
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  price: number
  currency: string
  status: string
  fitnessLevel: string | null
  whatToBring: string | null
  requiresApproval: boolean
  imageUrl: string | null
  host: Host
  community?: {
    id: string
    name: string
    logoImage: string | null
    slug: string
    communityLink?: string | null
    websiteUrl?: string | null
    sourceUrl?: string | null
    joinPlatform?: string | null
    lastVerifiedAt?: string | null
  } | null
  officialJoinUrl?: string | null
  officialJoinPlatform?: string | null
  lastVerifiedAt?: string | null
  attendees: Attendee[]
  attendeeCount: number
  goingSoloCount?: number
  isFull: boolean
  userStatus: string | null
  isFeatured?: boolean
  avgRating: number | null
  reviewCount: number
  acceptPayNow?: boolean
  acceptStripe?: boolean
  paynowQrImageUrl?: string | null
  paynowName?: string | null
  paynowPhoneNumber?: string | null
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

interface TimeBucket {
  key: string
  label: string
  sessions: Session[]
}

interface CrewSpotlight {
  id: string
  name: string
  slug: string
  logoImage: string | null
  city: string
  categorySlug: string | null
  nextSessionTitle: string
  nextSessionTime: string | null
  sessionCount: number
  peopleCount: number
  attendees: Attendee[]
}

function getRelativeTime(startTime: string): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMin < 0) return 'Started'
  if (diffMin < 60) return `In ${diffMin} min`
  if (diffHrs < 3) return `In ${diffHrs}h ${diffMin % 60}m`

  // Check if same calendar day
  const isToday = start.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = start.toDateString() === tomorrow.toDateString()

  const h = start.getHours() % 12 || 12
  const ampm = start.getHours() >= 12 ? 'PM' : 'AM'
  const min = start.getMinutes()
  const timeStr = min === 0 ? `${h} ${ampm}` : `${h}:${String(min).padStart(2, '0')} ${ampm}`

  if (isToday) return `Today ${timeStr}`
  if (isTomorrow) return `Tomorrow ${timeStr}`
  return format(start, 'EEE, MMM d') + ` · ${timeStr}`
}

function getSocialDiscoveryScore(session: Session): number {
  const hasVerifiedSource = session.community ? 6 : 0
  const attendeeScore = Math.min(session.attendeeCount, 12) * 5
  const soloScore = Math.min(session.goingSoloCount ?? 0, 6) * 4
  const beginnerScore = session.fitnessLevel === 'ALL' ? 4 : 0
  const officialLinkScore = session.officialJoinUrl ? 2 : 0

  return hasVerifiedSource + attendeeScore + soloScore + beginnerScore + officialLinkScore
}

function sortSessionsBySocialMomentum(sessions: Session[]): Session[] {
  return sessions.slice().sort((a, b) => {
    const scoreDelta = getSocialDiscoveryScore(b) - getSocialDiscoveryScore(a)
    if (scoreDelta !== 0) return scoreDelta
    return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime()
  })
}

function bucketSessions(sessions: Session[]): TimeBucket[] {
  const now = new Date()
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const endOfTomorrow = new Date(endOfToday)
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1)

  const happeningNow: Session[] = []
  const nextFewHours: Session[] = []
  const today: Session[] = []
  const tomorrow: Session[] = []
  const later: Session[] = []

  for (const s of sessions) {
    if (!s.startTime) { later.push(s); continue }
    const start = new Date(s.startTime)
    const diffMs = start.getTime() - now.getTime()
    const diffHrs = diffMs / (1000 * 60 * 60)

    if (diffHrs < 0 && diffHrs > -2) happeningNow.push(s)
    else if (diffHrs >= 0 && diffHrs < 3) nextFewHours.push(s)
    else if (start <= endOfToday) today.push(s)
    else if (start <= endOfTomorrow) tomorrow.push(s)
    else later.push(s)
  }

  const buckets: TimeBucket[] = []
  if (happeningNow.length) buckets.push({ key: 'now', label: 'Now', sessions: sortSessionsBySocialMomentum(happeningNow) })
  if (nextFewHours.length) buckets.push({ key: 'soon', label: 'Soon', sessions: sortSessionsBySocialMomentum(nextFewHours) })
  if (today.length) buckets.push({ key: 'today', label: 'Today', sessions: sortSessionsBySocialMomentum(today) })
  if (tomorrow.length) buckets.push({ key: 'tomorrow', label: 'Tomorrow', sessions: sortSessionsBySocialMomentum(tomorrow) })
  if (later.length) buckets.push({ key: 'later', label: 'This week', sessions: sortSessionsBySocialMomentum(later) })
  return buckets
}

function formatBuddyMapPrice(price: number, currency: string): string {
  if (price <= 0) return 'Free'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price / 100)
  } catch {
    return `${currency} ${Math.round(price / 100)}`
  }
}

function getLocalDateString(timezone: string, offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA', { timeZone: timezone })
}

function EventDiscoveryBand({
  sessions,
  crews,
  sessionCount,
  peopleCount,
  goingSoloCount,
  beginnerCount,
  cityName,
  activeTypeLabel,
  onCreate,
  onPreviewAttendees,
}: {
  sessions: Session[]
  crews: CrewSpotlight[]
  sessionCount: number
  peopleCount: number
  goingSoloCount: number
  beginnerCount: number
  cityName: string
  activeTypeLabel: string
  onCreate: () => void
  onPreviewAttendees: (session: Session) => void
}) {
  const topSessions = sessions
    .slice()
    .sort((a, b) => {
      const aScore = a.attendeeCount * 4 + (a.goingSoloCount ?? 0) * 2 + (a.fitnessLevel === 'ALL' ? 2 : 0)
      const bScore = b.attendeeCount * 4 + (b.goingSoloCount ?? 0) * 2 + (b.fitnessLevel === 'ALL' ? 2 : 0)
      if (bScore !== aScore) return bScore - aScore
      return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime()
    })
    .slice(0, 4)
  const hasCrews = crews.length > 0

  return (
    <section className="border-b border-white/10 pb-5 pt-4">
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#63FF8F]">
            Events near {cityName}
          </p>
          <h1 className="mt-1 text-xl font-bold leading-tight text-white">
            Find a fitness plan with people already going
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-white/58">
            {activeTypeLabel === 'All types'
              ? 'Browse the next sessions first. See who is going, who is showing up solo, and which hosts are verified.'
              : `${activeTypeLabel} sessions with people signals before you decide where to show up.`}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="min-h-11 flex-shrink-0 rounded-full bg-[#63FF8F] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#83FFA6]"
        >
          Create
        </button>
      </div>

      <div className="mt-4 hidden grid-cols-3 gap-2 sm:grid">
        {[
          { value: sessionCount.toString(), label: 'events live' },
          { value: peopleCount.toString(), label: 'people going' },
          { value: goingSoloCount > 0 ? goingSoloCount.toString() : beginnerCount.toString(), label: goingSoloCount > 0 ? 'going solo' : 'easy starts' },
        ].map((stat) => (
          <div key={stat.label} className="min-h-[58px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <p className="truncate text-sm font-bold leading-none text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{stat.label}</p>
          </div>
        ))}
      </div>

      {topSessions.length > 0 && (
        <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {topSessions.map((session) => (
            <EventPulseCard key={session.id} session={session} onPreviewAttendees={onPreviewAttendees} />
          ))}
        </div>
      )}

      {hasCrews ? (
        <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          <div className="flex w-[150px] shrink-0 snap-start flex-col justify-center rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#666666]">
              Hosted by
            </p>
            <p className="mt-1 text-xs leading-snug text-[#999999]">
              Verified source pages behind these events.
            </p>
          </div>
          {crews.map((crew) => (
            <CrewSpotlightCard key={crew.id} crew={crew} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-white/15 bg-white/[0.035] px-4 py-5 text-center">
          <p className="text-sm font-semibold text-white">Start with a plan people can join.</p>
          <p className="mt-1 text-xs text-[#666666]">Host/source pages stay in the background as the trust layer.</p>
        </div>
      )}
    </section>
  )
}

function EventPulseCard({
  session,
  onPreviewAttendees,
}: {
  session: Session
  onPreviewAttendees: (session: Session) => void
}) {
  const timeLabel = session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'
  const soloCount = session.goingSoloCount ?? 0

  return (
    <div className="group w-[255px] flex-shrink-0 snap-start rounded-lg border border-white/10 bg-[#151515] p-3.5 transition-colors hover:border-[#63FF8F]/45 hover:bg-[#1B1B1B]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#63FF8F]">
            {timeLabel}
          </p>
          <Link
            href={`/activities/${session.id}`}
            className="mt-1 block line-clamp-2 text-sm font-bold leading-snug text-white transition-colors hover:text-[#63FF8F]"
            onClick={() => trackSessionClick(session, 'event_pulse', 0)}
          >
            {session.title}
          </Link>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-xl">
          {pinEmoji(session.categorySlug ?? 'other')}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <AttendeePreview attendees={session.attendees} attendeeCount={session.attendeeCount} onClick={() => onPreviewAttendees(session)} />
        <p className="shrink-0 text-right text-[11px] font-medium text-[#999999]">
          {session.attendeeCount > 0 ? `${session.attendeeCount} going` : 'Open invite'}
          {soloCount > 0 ? <span className="block text-[#B6FF00]">{soloCount} solo</span> : null}
        </p>
      </div>
      <p className="mt-3 truncate text-[11px] text-[#666666]">
        Hosted by {hostLabel}
      </p>
    </div>
  )
}

function CrewSpotlightCard({ crew }: { crew: CrewSpotlight }) {
  const href = `/communities/${crew.slug}`
  const emoji = pinEmoji(crew.categorySlug ?? 'other')
  const nextTime = crew.nextSessionTime ? getRelativeTime(crew.nextSessionTime) : null

  return (
    <Link
      href={href}
      className="group w-[230px] flex-shrink-0 snap-start rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-3.5 hover:bg-[#222222] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#262626]">
          {crew.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={crew.logoImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">{emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white group-hover:text-neutral-200">{crew.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#666666]">{crew.city}</p>
        </div>
      </div>

      <div className="mt-4 min-h-[56px]">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#D4D4D4]">
          {crew.nextSessionTitle}
        </p>
        <p className="mt-1 text-[11px] text-[#666666]">
          {nextTime ? `${nextTime} · ` : ''}{crew.sessionCount} known plan{crew.sessionCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div className="flex -space-x-2">
          {crew.attendees.length > 0 ? (
            crew.attendees.map((attendee) => (
              <span
                key={attendee.id}
                className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[#1A1A1A] bg-[#333333] text-[10px] font-bold text-white"
              >
                {attendee.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={attendee.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  attendee.name?.[0]?.toUpperCase() ?? '?'
                )}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[#666666]">Be first in</span>
          )}
        </div>
        <p className="text-[11px] font-medium text-[#999999]">
          {crew.peopleCount > 0 ? 'Active crew' : 'Open listing'}
        </p>
      </div>
    </Link>
  )
}

// Gradient pairs for poster-style fallback cards (from → to)
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  running: ['#EA580C', '#9A3412'],
  yoga: ['#9333EA', '#581C87'],
  hiit: ['#DC2626', '#991B1B'],
  bootcamp: ['#DC2626', '#7F1D1D'],
  cycling: ['#CA8A04', '#854D0E'],
  swimming: ['#0891B2', '#155E75'],
  volleyball: ['#D97706', '#92400E'],
  basketball: ['#EA580C', '#7C2D12'],
  pilates: ['#DB2777', '#831843'],
  hiking: ['#65A30D', '#3F6212'],
  strength: ['#4F46E5', '#312E81'],
  gym: ['#2563EB', '#1E3A5F'],
  cold_plunge: ['#0284C7', '#0C4A6E'],
  dance_fitness: ['#C026D3', '#701A75'],
  badminton: ['#059669', '#064E3B'],
  padel: ['#0D9488', '#134E4A'],
  combat_fitness: ['#E11D48', '#881337'],
  pickleball: ['#16A34A', '#14532D'],
  other: ['#525252', '#262626'],
}

function pinEmoji(slug: string | null | undefined) { return getActivityEmoji(slug, '🏅') }

// ─── Fitness / type filters ───────────────────────────────────────────────────

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'pickleball', label: 'Pickleball' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'strength', label: 'Strength' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'social', label: 'Social' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'pilates', label: 'Pilates' },
]

const PRICING_FILTERS = [
  { value: '', label: 'All prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const LEVEL_FILTERS = [
  { value: '', label: 'All levels' },
  { value: 'ALL', label: 'Beginner-friendly' },
  { value: 'INTERMEDIATE_PLUS', label: 'Intermediate+' },
  { value: 'ADVANCED', label: 'Advanced' },
]

const STARTER_SESSION_IDEAS = [
  { label: 'Morning run', type: 'running', note: 'Easy pace, open invite' },
  { label: 'Beginner gym', type: 'strength', note: 'Train with one or two people' },
  { label: 'Weekend yoga', type: 'yoga', note: 'Park, studio, or rooftop' },
  { label: 'Pickleball hit', type: 'pickleball', note: 'Find a court and fill spots' },
]

export default function BuddyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#666666]" /></div>}>
      <BuddyPageInner />
    </Suspense>
  )
}

function BuddyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const requestedCitySlug = searchParams.get('city')
  const initialCityConfig = useMemo(
    () => getCityLocationConfig(requestedCitySlug),
    [requestedCitySlug],
  )
  const initialTypeFilter = searchParams.get('type') ?? searchParams.get('cat') ?? ''
  const initialPricingFilter = searchParams.get('pricing') ?? ''
  const initialLevelFilter = searchParams.get('fitnessLevel') ?? searchParams.get('level') ?? ''
  const initialDateFilter = searchParams.get('date') ?? ''
  const initialViewMode = searchParams.get('view') === 'map' ? 'map' : 'list'
  const initialCreateMode = searchParams.get('create')

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(initialCityConfig.center)
  const [cityConfig, setCityConfig] = useState<CityLocationConfig>(initialCityConfig)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const profileCityLockedRef = useRef(Boolean(requestedCitySlug))

  const [typeFilter, setTypeFilter] = useState(() =>
    TYPE_FILTERS.some((filter) => filter.value === initialTypeFilter) ? initialTypeFilter : '',
  )
  const [pricingFilter, setPricingFilter] = useState(() =>
    PRICING_FILTERS.some((filter) => filter.value === initialPricingFilter)
      ? initialPricingFilter
      : '',
  )
  const [levelFilter, setLevelFilter] = useState(() =>
    LEVEL_FILTERS.some((filter) => filter.value === initialLevelFilter)
      ? initialLevelFilter
      : '',
  )
  const [dateFilter, setDateFilter] = useState(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(initialDateFilter)) return initialDateFilter
    return initialViewMode === 'map' ? getLocalDateString(initialCityConfig.timezone) : ''
  })
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [selectedPin, setSelectedPin] = useState<Session | null>(null)
  const [feedbackSession, setFeedbackSession] = useState<{ id: string; title: string; hostId: string; hostName: string | null } | null>(null)
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  const [profileLocationReady, setProfileLocationReady] = useState(false)
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null)
  const [followPromptSession, setFollowPromptSession] = useState<Session | null>(null)
  const [pendingFollowSession, setPendingFollowSession] = useState<Session | null>(null)
  const [soloPromptSession, setSoloPromptSession] = useState<Session | null>(null)
  const [attendeeSheetSession, setAttendeeSheetSession] = useState<Session | null>(null)
  const [soloPromptLoading, setSoloPromptLoading] = useState(false)
  const [soloOptedSessionIds, setSoloOptedSessionIds] = useState<Set<string>>(new Set())
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null)
  const [followedCommunityIds, setFollowedCommunityIds] = useState<Set<string>>(new Set())

  // View mode: list-first (default) or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode)

  // Neighborhood filter
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<CityNeighborhood | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Session[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (initialCreateMode === 'session') {
      setShowCreateSheet(true)
    } else if (initialCreateMode === 'community') {
      setShowCreateMenu(true)
    }
  }, [initialCreateMode])

  const featuredCrews = useMemo<CrewSpotlight[]>(() => {
    const crews = new globalThis.Map<string, CrewSpotlight>()

    for (const session of sessions) {
      if (!session.community) continue

      const existing = crews.get(session.community.id)
      const nextTime = session.startTime
      const candidate: CrewSpotlight = existing ?? {
        id: session.community.id,
        name: session.community.name,
        slug: session.community.slug,
        logoImage: session.community.logoImage,
        city: session.city,
        categorySlug: session.categorySlug,
        nextSessionTitle: session.title,
        nextSessionTime: nextTime,
        sessionCount: 0,
        peopleCount: 0,
        attendees: [],
      }

      candidate.sessionCount += 1
      candidate.peopleCount += session.attendeeCount
      if (
        nextTime &&
        (!candidate.nextSessionTime || new Date(nextTime).getTime() < new Date(candidate.nextSessionTime).getTime())
      ) {
        candidate.nextSessionTitle = session.title
        candidate.nextSessionTime = nextTime
        candidate.categorySlug = session.categorySlug
        candidate.city = session.city
      }

      for (const attendee of session.attendees) {
        if (candidate.attendees.length >= 4) break
        if (!candidate.attendees.some((a) => a.id === attendee.id)) {
          candidate.attendees.push(attendee)
        }
      }

      crews.set(session.community.id, candidate)
    }

    return Array.from(crews.values())
      .sort((a, b) => (b.peopleCount + b.sessionCount * 2) - (a.peopleCount + a.sessionCount * 2))
      .slice(0, 6)
  }, [sessions])

  const discoveryStats = useMemo(() => ({
    sessionCount: sessions.length,
    peopleCount: sessions.reduce((sum, session) => sum + session.attendeeCount, 0),
    goingSoloCount: sessions.reduce((sum, session) => sum + (session.goingSoloCount ?? 0), 0),
    beginnerCount: sessions.filter((session) => session.fitnessLevel === 'ALL').length,
  }), [sessions])

  const todayDateString = useMemo(
    () => getLocalDateString(cityConfig.timezone),
    [cityConfig.timezone],
  )

  const activeDateLabel = dateFilter
    ? dateFilter === todayDateString
      ? 'Today'
      : (() => {
          const parsed = new Date(`${dateFilter}T00:00:00`)
          if (Number.isNaN(parsed.getTime())) return 'Selected day'
          return parsed.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: cityConfig.timezone,
          })
        })()
    : 'Upcoming'

  const sessionById = useMemo(
    () => new globalThis.Map(sessions.map((session) => [session.id, session])),
    [sessions],
  )

  const mapPins = useMemo<SessionVectorMapPin[]>(
    () =>
      sessions.map((session) => {
        const activityLabel = session.categorySlug ? session.categorySlug.replace(/[-_]/g, ' ') : 'session'
        const hostIsReal =
          session.host?.name && session.host.name !== 'sweatbuddies' && session.host.name !== 'SweatBuddies'
        const displayName = session.community?.name ?? (hostIsReal ? session.host.name : null) ?? session.title
        const location = session.address?.split(',')[0] || session.city

        return {
          id: session.id,
          title: session.title,
          latitude: session.latitude,
          longitude: session.longitude,
          city: session.city,
          primaryLabel: activityLabel,
          priceLabel: formatBuddyMapPrice(session.price, session.currency),
          activityLabel: pinEmoji(session.categorySlug ?? 'other'),
          previewTitle: displayName,
          previewSubtitle: session.community ? `Known plan: ${session.title}` : session.title,
          previewMeta: `${session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'} · ${location}`,
          previewImage: session.imageUrl || session.community?.logoImage || (hostIsReal ? session.host.imageUrl : null),
        }
      }),
    [sessions],
  )

  const activeTypeLabel = TYPE_FILTERS.find((type) => type.value === typeFilter)?.label ?? 'fitness'
  const activePriceLabel = PRICING_FILTERS.find((price) => price.value === pricingFilter)?.label ?? 'All prices'
  const activeLevelLabel = LEVEL_FILTERS.find((level) => level.value === levelFilter)?.label ?? 'All levels'

  function updateTypeFilter(value: string) {
    const next = typeFilter === value ? '' : value
    setTypeFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'type',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updatePricingFilter(value: string) {
    const next = pricingFilter === value ? '' : value
    setPricingFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'pricing',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updateLevelFilter(value: string) {
    const next = levelFilter === value ? '' : value
    setLevelFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'fitnessLevel',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updateDateFilter(value: string) {
    const next = dateFilter === value ? '' : value
    setDateFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'date',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updateNeighborhoodFilter(value: CityNeighborhood) {
    const next = neighborhoodFilter?.name === value.name ? null : value
    setNeighborhoodFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'neighborhood',
      value: next?.name ?? 'all',
      city: cityConfig.slug,
    })
  }

  function updateCityFilter(value: string) {
    const nextCity = getCityLocationConfig(value)
    profileCityLockedRef.current = true
    setCityConfig(nextCity)
    setUserLocation(nextCity.center)
    setNeighborhoodFilter(null)
    setSelectedPin(null)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'city',
      value: nextCity.slug,
      city: nextCity.slug,
    })
  }

  function updateNeighborhoodSelect(value: string) {
    if (!value) {
      setNeighborhoodFilter(null)
      trackBrowserEvent('buddy_filter_used', {
        filter: 'neighborhood',
        value: 'all',
        city: cityConfig.slug,
      })
      return
    }

    const selected = cityConfig.neighborhoods.find((n) => n.name === value)
    if (selected) updateNeighborhoodFilter(selected)
  }

  const handleMapPinClick = useCallback(
    (session: Session | null) => {
      setSelectedPin(session)
      if (!session) return

      trackBrowserEvent('buddy_map_pin_clicked', {
        sessionId: session.id,
        category: session.categorySlug ?? 'unknown',
        city: cityConfig.slug,
        viewMode,
      })
    },
    [cityConfig.slug, viewMode],
  )

  const handleVectorMapPinClick = useCallback(
    (pin: SessionVectorMapPin | null) => {
      handleMapPinClick(pin ? sessionById.get(pin.id) ?? null : null)
    },
    [handleMapPinClick, sessionById],
  )

  function updateSessionAfterRsvp(sessionId: string, updates: Partial<Session>) {
    setSessions((prev) => prev.map((session) => (
      session.id === sessionId ? { ...session, ...updates } : session
    )))
    setSearchResults((prev) => prev.map((session) => (
      session.id === sessionId ? { ...session, ...updates } : session
    )))
    setSelectedPin((current) => current?.id === sessionId ? { ...current, ...updates } : current)
  }

  function redirectToSignIn(session: Session) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_intent', JSON.stringify({
        intent: 'buddy_rsvp',
        sessionId: session.id,
        timestamp: Date.now(),
      }))
    }

    const redirectUrl = `/buddy?city=${cityConfig.slug}`
    router.push(`/sign-in?intent=rsvp&redirect_url=${encodeURIComponent(redirectUrl)}`)
  }

  async function handleJoinSession(session: Session, source: string) {
    if (!authLoaded) return
    if (!isSignedIn) {
      redirectToSignIn(session)
      return
    }

    if (session.isFull || session.requiresApproval || session.activityMode === 'P2P_PAID') {
      router.push(`/activities/${session.id}`)
      return
    }

    if (rsvpLoadingId) return
    setRsvpLoadingId(session.id)
    const userMarkedSolo = soloOptedSessionIds.has(session.id)

    try {
      const res = await fetch(`/api/buddy/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 402 || data.code === 'PAYMENT_REQUIRED') {
        router.push(`/activities/${session.id}`)
        return
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to RSVP')
      }

      updateSessionAfterRsvp(session.id, {
        userStatus: 'JOINED',
        attendeeCount: session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
          ? session.attendeeCount
          : session.attendeeCount + 1,
        isFull: typeof session.maxPeople === 'number'
          ? session.attendeeCount + 1 >= session.maxPeople
          : session.isFull,
      })
      toast.success("You're going")
      trackBrowserEvent('buddy_quick_rsvp_joined', {
        sessionId: session.id,
        source,
        city: session.city,
        category: session.categorySlug ?? 'unknown',
        communityId: session.community?.id ?? null,
      })
      setSoloPromptSession(session)
      if (session.community && !followedCommunityIds.has(session.community.id)) {
        setPendingFollowSession(session)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to RSVP')
    } finally {
      setRsvpLoadingId(null)
    }
  }

  async function handleLeaveSession(session: Session, source: string) {
    if (!authLoaded) return
    if (!isSignedIn) {
      redirectToSignIn(session)
      return
    }

    if (rsvpLoadingId) return
    setRsvpLoadingId(session.id)
    const userMarkedSolo = soloOptedSessionIds.has(session.id)

    try {
      const res = await fetch(`/api/buddy/sessions/${session.id}/leave`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update RSVP')
      }

      updateSessionAfterRsvp(session.id, {
        userStatus: 'CANCELLED',
        attendeeCount: Math.max(0, session.attendeeCount - 1),
        goingSoloCount: userMarkedSolo
          ? Math.max(0, (session.goingSoloCount ?? 0) - 1)
          : session.goingSoloCount,
        isFull: false,
      })
      if (userMarkedSolo) {
        setSoloOptedSessionIds((prev) => {
          const next = new Set(prev)
          next.delete(session.id)
          return next
        })
      }
      toast.success('RSVP cancelled')
      trackBrowserEvent('buddy_quick_rsvp_cancelled', {
        sessionId: session.id,
        source,
        city: session.city,
        category: session.categorySlug ?? 'unknown',
        communityId: session.community?.id ?? null,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update RSVP')
    } finally {
      setRsvpLoadingId(null)
    }
  }

  async function handleFollowPrompt() {
    const community = followPromptSession?.community
    if (!community) return

    setFollowLoadingId(community.id)
    try {
      const res = await fetch('/api/community/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: community.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to follow host')
      }

      setFollowedCommunityIds((prev) => new Set(prev).add(community.id))
      setFollowPromptSession(null)
      toast.success(`Following ${community.name}`)
      trackBrowserEvent('buddy_post_rsvp_followed_host', {
        communityId: community.id,
        communitySlug: community.slug,
        sessionId: followPromptSession.id,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to follow host')
    } finally {
      setFollowLoadingId(null)
    }
  }

  function revealPendingFollowPrompt() {
    if (pendingFollowSession?.community && !followedCommunityIds.has(pendingFollowSession.community.id)) {
      setFollowPromptSession(pendingFollowSession)
    }
    setPendingFollowSession(null)
  }

  async function handleGoingSoloAnswer(goingSolo: boolean) {
    const session = soloPromptSession
    if (!session) return

    setSoloPromptLoading(true)
    try {
      const res = await fetch(`/api/events/${session.id}/going-solo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goingSolo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      if (goingSolo) {
        updateSessionAfterRsvp(session.id, {
          goingSoloCount: (session.goingSoloCount ?? 0) + 1,
        })
        setSoloOptedSessionIds((prev) => new Set(prev).add(session.id))
      }

      trackBrowserEvent('buddy_going_solo_answered', {
        sessionId: session.id,
        goingSolo,
        city: session.city,
        category: session.categorySlug ?? 'unknown',
        communityId: session.community?.id ?? null,
      })
      setSoloPromptSession(null)
      revealPendingFollowPrompt()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSoloPromptLoading(false)
    }
  }

  function dismissGoingSoloPrompt() {
    if (soloPromptSession) {
      trackBrowserEvent('buddy_going_solo_dismissed', {
        sessionId: soloPromptSession.id,
        city: soloPromptSession.city,
        category: soloPromptSession.categorySlug ?? 'unknown',
        communityId: soloPromptSession.community?.id ?? null,
      })
    }
    setSoloPromptSession(null)
    revealPendingFollowPrompt()
  }

  function toggleViewMode() {
    const next = viewMode === 'list' ? 'map' : 'list'
    const nextDateFilter = next === 'map' && !dateFilter ? todayDateString : dateFilter
    setViewMode(next)
    if (nextDateFilter !== dateFilter) setDateFilter(nextDateFilter)
    setSelectedPin(null)

    const params = new URLSearchParams(searchParams.toString())
    if (next === 'map') {
      params.set('view', 'map')
      if (nextDateFilter) params.set('date', nextDateFilter)
    } else {
      params.delete('view')
    }
    router.replace(`/buddy${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })

    trackBrowserEvent('buddy_view_changed', {
      viewMode: next,
      city: cityConfig.slug,
      type: typeFilter || 'all',
      pricing: pricingFilter || 'all',
      fitnessLevel: levelFilter || 'all',
      sessionCount: sessions.length,
    })
  }

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ tab: 'happening' })
        if (typeFilter) params.set('type', typeFilter)
        if (pricingFilter) params.set('pricing', pricingFilter)
        if (levelFilter) params.set('fitnessLevel', levelFilter)
        if (dateFilter) params.set('date', dateFilter)
        if (cursor) params.set('cursor', cursor)
        const effectiveLocation = neighborhoodFilter
          ? { lat: neighborhoodFilter.lat, lng: neighborhoodFilter.lng }
          : userLocation
        const activeCityConfig = profileCityLockedRef.current || neighborhoodFilter
          ? cityConfig
          : effectiveLocation
            ? getNearestCityLocationConfig(effectiveLocation.lat, effectiveLocation.lng)
            : cityConfig
        params.set('city', activeCityConfig.slug)
        params.set('timezone', activeCityConfig.timezone)
        if (effectiveLocation) {
          params.set('lat', String(effectiveLocation.lat))
          params.set('lng', String(effectiveLocation.lng))
        }
        if (neighborhoodFilter) {
          params.set('radius', String(neighborhoodFilter.radius))
        }

        const res = await fetch(`/api/buddy/sessions?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()

        if (cursor) {
          setSessions((prev) => [...prev, ...(data.sessions ?? [])])
        } else {
          setSessions(data.sessions ?? [])
        }
        setNextCursor(data.nextCursor ?? null)
        if (data.currentUserId) setCurrentUserId(data.currentUserId)
      } catch {
        toast.error('Failed to load sessions')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [typeFilter, pricingFilter, levelFilter, dateFilter, userLocation, neighborhoodFilter, cityConfig]
  )

  const [locationReady, setLocationReady] = useState(true)

  useEffect(() => {
    if (!userLocation) return
    if (profileCityLockedRef.current) return
    const detectedCity = getNearestCityLocationConfig(userLocation.lat, userLocation.lng)
    setCityConfig((current) => current.slug === detectedCity.slug ? current : detectedCity)
  }, [userLocation])

  useEffect(() => {
    setNeighborhoodFilter(null)
  }, [cityConfig.slug])

  // Get user location on mount — resolve quickly with timeout fallback
  useEffect(() => {
    if (profileCityLockedRef.current) {
      setUserLocation(initialCityConfig.center)
      setLocationReady(true)
      return
    }

    if (!navigator.geolocation) { setUserLocation(DEFAULT_CITY_LOCATION_CONFIG.center); setLocationReady(true); return }

    let settled = false
    const settle = () => { if (!settled) { settled = true; setLocationReady(true) } }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (profileCityLockedRef.current) return
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        settle()
      },
      () => {
        if (profileCityLockedRef.current) return
        setUserLocation(DEFAULT_CITY_LOCATION_CONFIG.center)
        settle()
      },
      { timeout: 3000, maximumAge: 60000 }
    )

    // Fallback: don't wait longer than 3s for GPS.
    const timer = setTimeout(() => {
      if (profileCityLockedRef.current) return
      if (!settled) setUserLocation(DEFAULT_CITY_LOCATION_CONFIG.center)
      settle()
    }, 3000)
    return () => clearTimeout(timer)
  }, [initialCityConfig.center])

  // Load user context after browser location resolves. Profile location wins when GPS is unavailable or stale.
  useEffect(() => {
    if (!locationReady) return

    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/user/p2p-onboarding')
        const data = res.ok ? await res.json() : null
        if (data?.user?.accountStatus === 'BANNED' || data?.user?.accountStatus === 'SUSPENDED') {
          router.replace('/banned')
          return
        }
        if (data?.user?.id) setCurrentUserId(data.user.id)

        const profileCity = getCityLocationConfigFromText(data?.user?.location)
        if (profileCity && !profileCityLockedRef.current) {
          profileCityLockedRef.current = true
          setCityConfig(profileCity)
          setUserLocation(profileCity.center)
        }
      } finally {
        setProfileLocationReady(true)
      }
    }
    loadInitialData()
  }, [locationReady, router])

  // Check for pending feedback + bio prompt on past sessions
  useEffect(() => {
    if (!currentUserId) return

    // Check pending feedback
    fetch('/api/buddy/sessions/pending-feedback')
      .then((r) => r.ok ? r.json() : { sessions: [] })
      .then((data) => {
        if (data.sessions?.length > 0) {
          setTimeout(() => setFeedbackSession(data.sessions[0]), 2000)
        }
      })
      .catch(() => {})

    // Check if bio prompt should show (3+ sessions, no bio, not dismissed)
    try {
      if (localStorage.getItem('sb_bio_prompted')) return
    } catch { return }
    fetch('/api/user/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile && !data.profile.bio && data.profile.sessionsAttendedCount >= 3) {
          // Show after feedback dismisses (or 5s if no feedback)
          setTimeout(() => setShowBioPrompt(true), 5000)
        }
      })
      .catch(() => {})
  }, [currentUserId])


  // Refetch when filters change
  useEffect(() => {
    if (!locationReady) return
    setSessions([])
    fetchSessions()
  }, [locationReady, profileLocationReady, typeFilter, pricingFilter, levelFilter, dateFilter, neighborhoodFilter, fetchSessions])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type: 'sessions',
        })
        const activeCityConfig = profileCityLockedRef.current
          ? cityConfig
          : userLocation
            ? getNearestCityLocationConfig(userLocation.lat, userLocation.lng)
            : cityConfig
        const searchLocation = userLocation ?? activeCityConfig.center
        params.set('city', activeCityConfig.slug)
        params.set('lat', String(searchLocation.lat))
        params.set('lng', String(searchLocation.lng))
        const res = await fetch(`/api/search?${params}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.sessions ?? [])
        }
      } catch { /* ignore */ } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, userLocation, cityConfig])

  return (
    <div className="flex flex-col bg-[#0B0B0B] md:pl-14" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Create Session Sheet */}
      <CreateSessionSheet open={showCreateSheet} onClose={() => setShowCreateSheet(false)} onSuccess={() => fetchSessions()} />
      <CreateChoiceSheet
        open={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
        onHostSession={() => {
          setShowCreateMenu(false)
          setShowCreateSheet(true)
        }}
      />

      {/* Bio Prompt */}
      <BioPromptSheet open={showBioPrompt && !feedbackSession} onClose={() => setShowBioPrompt(false)} />

      {/* Post-Session Feedback */}
      <SessionFeedbackSheet
        open={!!feedbackSession}
        onClose={() => setFeedbackSession(null)}
        sessionId={feedbackSession?.id ?? ''}
        sessionTitle={feedbackSession?.title ?? ''}
        hostId={feedbackSession?.hostId ?? ''}
        hostName={feedbackSession?.hostName ?? null}
      />

      {/* ── Filters — sticky top bar ── */}
      <div className="sticky top-0 z-20 pt-[env(safe-area-inset-top,4px)]">
        <div className="space-y-2 border-b border-white/10 bg-[#0B0B0B]/95 px-3 pb-2 pt-2 font-mono backdrop-blur">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Link href="/" aria-label="SweatBuddies home" className="inline-flex min-w-0 items-center">
              <LogoWithText size={27} color="#FFFFFF" textColor="#FFFFFF" />
            </Link>
            <p className="hidden min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.16em] text-white/42 sm:block">
              Social fitness events
            </p>
            <Link
              href="/host"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-white/12 px-3 text-[10px] font-black uppercase tracking-wide text-white/70 transition-colors hover:border-[#63FF8F] hover:text-[#63FF8F]"
            >
              Host
            </Link>
          </div>
          {/* Search bar */}
          <div className="relative mb-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Search run clubs, yoga, pickleball, or neighborhoods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-white/15 bg-[#111111] py-2.5 pl-9 pr-10 text-sm text-white transition-all placeholder:text-[#555555] focus:border-[#63FF8F] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-[#666666] hover:text-white transition-colors" />
              </button>
            )}
          </div>
          {/* Row 1: Date strip */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
              {(() => {
                const days = []
                for (let i = 0; i < 7; i++) {
                  const dateStr = getLocalDateString(cityConfig.timezone, i)
                  const d = new Date(`${dateStr}T00:00:00`)
                  const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmr' : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: cityConfig.timezone })
                  const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: cityConfig.timezone })
                  days.push(
                    <button
                      key={dateStr}
                      onClick={() => updateDateFilter(dateStr)}
                      className={`flex min-h-11 min-w-[44px] flex-shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-center transition-all ${
                        dateFilter === dateStr
                          ? 'bg-white text-black shadow-md'
                          : 'bg-[#171717] text-[#999999] shadow-none'
                      }`}
                    >
                      <span className="text-[10px] font-medium leading-tight">{dayLabel}</span>
                      <span className="text-[13px] font-bold leading-tight">{dateNum}</span>
                    </button>
                  )
                }
                return days
              })()}
              <button
                onClick={() => updateDateFilter('')}
                className={`flex min-h-11 min-w-[70px] flex-shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-center transition-all ${
                  !dateFilter
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#171717] text-[#999999] shadow-none'
                  }`}
              >
                <span className="text-[10px] font-medium leading-tight">All</span>
                <span className="text-[13px] font-bold leading-tight">Upcoming</span>
              </button>
            </div>
            <button
              onClick={() => setShowCreateMenu(true)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#63FF8F] shadow-lg shadow-[#63FF8F]/20 transition-colors hover:bg-[#83FFA6] active:scale-95"
              aria-label="Add to the map"
            >
              <Plus className="w-4 h-4 text-black" />
            </button>
            <button
              type="button"
              onClick={toggleViewMode}
              className="flex h-11 flex-shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#171717] px-3 text-[11px] font-black uppercase tracking-wide text-white transition-colors hover:border-[#63FF8F] active:scale-95 lg:hidden"
              aria-label={viewMode === 'list' ? 'Show map' : 'Show list'}
            >
              {viewMode === 'list' ? (
                <><Map className="w-3.5 h-3.5" /> Map</>
              ) : (
                <><List className="w-3.5 h-3.5" /> List</>
              )}
            </button>
          </div>

          {/* Mobile collapsed filters */}
          <details className="group sm:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-white/[0.12] bg-[#171717] px-3 text-[12px] font-black uppercase tracking-wide text-white transition-colors group-open:border-[#63FF8F] [&::-webkit-details-marker]:hidden">
              <span>Filters</span>
              <span className="min-w-0 truncate text-right text-[10px] text-[#999999]">
                {[neighborhoodFilter?.name ?? cityConfig.name, activeTypeLabel, activePriceLabel]
                  .filter(Boolean)
                  .join(' / ')}
              </span>
            </summary>
            <div className="mt-2 grid gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <FilterOptionGroup
                label="City"
                value={cityConfig.slug}
                onChange={updateCityFilter}
                options={CITY_LOCATION_CONFIGS.map((city) => ({
                  value: city.slug,
                  label: city.name,
                }))}
              />
              <FilterOptionGroup
                label="Area"
                value={neighborhoodFilter?.name ?? ''}
                onChange={updateNeighborhoodSelect}
                options={[
                  { value: '', label: 'All areas' },
                  ...cityConfig.neighborhoods.map((n) => ({ value: n.name, label: n.name })),
                ]}
              />
              <FilterOptionGroup
                label="Activity"
                value={typeFilter}
                onChange={updateTypeFilter}
                options={TYPE_FILTERS}
              />
              <FilterOptionGroup
                label="Price"
                value={pricingFilter}
                onChange={updatePricingFilter}
                options={PRICING_FILTERS}
              />
              <FilterOptionGroup
                label="Level"
                value={levelFilter}
                onChange={updateLevelFilter}
                options={LEVEL_FILTERS}
              />
            </div>
          </details>

          {/* Tablet and desktop dropdown filters */}
          <div className="hidden grid-cols-5 gap-1.5 sm:grid">
            <FilterMenu
              label="City"
              displayValue={cityConfig.name}
              value={cityConfig.slug}
              onChange={updateCityFilter}
              options={CITY_LOCATION_CONFIGS.map((city) => ({
                value: city.slug,
                label: city.name,
              }))}
            />
            <FilterMenu
              label="Area"
              displayValue={neighborhoodFilter?.name ?? 'All areas'}
              value={neighborhoodFilter?.name ?? ''}
              onChange={updateNeighborhoodSelect}
              options={[
                { value: '', label: 'All areas' },
                ...cityConfig.neighborhoods.map((n) => ({ value: n.name, label: n.name })),
              ]}
            />
            <FilterMenu
              label="Activity"
              displayValue={activeTypeLabel}
              value={typeFilter}
              onChange={updateTypeFilter}
              options={TYPE_FILTERS}
            />
            <FilterMenu
              label="Price"
              displayValue={activePriceLabel}
              value={pricingFilter}
              onChange={updatePricingFilter}
              options={PRICING_FILTERS}
            />
            <FilterMenu
              label="Level"
              displayValue={activeLevelLabel}
              value={levelFilter}
              onChange={updateLevelFilter}
              options={LEVEL_FILTERS}
            />
          </div>

          <div className="hidden min-h-7 items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#777777] sm:flex">
            {[neighborhoodFilter?.name ?? cityConfig.name, activeTypeLabel, activePriceLabel, activeLevelLabel].map((value) => (
              <span key={value} className="shrink-0 rounded-full border border-white/[0.08] bg-[#111111] px-2.5 py-1">
                {value}
              </span>
            ))}
            {(typeFilter || pricingFilter || levelFilter || dateFilter || neighborhoodFilter) && (
              <button
                onClick={() => {
                  setTypeFilter('')
                  setPricingFilter('')
                  setLevelFilter('')
                  setDateFilter('')
                  setNeighborhoodFilter(null)
                }}
                className="shrink-0 rounded-full border border-white/[0.10] px-2.5 py-1 text-[#999999] hover:border-white/30 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[minmax(390px,42vw)_1fr]">
          {/* List view — community-first cards backed by known sessions */}
          <div className="min-h-0 overflow-y-auto border-white/[0.08] px-4 pb-24 lg:border-r">
            {/* Search results mode */}
            {searchQuery.trim() ? (
              <div className="pt-3">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-16">
                    <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
                    <p className="text-sm text-[#666666]">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-[#999999]">No events or hosts for &apos;{searchQuery}&apos;</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-xs text-[#666666] hover:text-white underline transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-[#666666] uppercase tracking-wider">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#666666] hover:text-white transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 sm:overflow-visible">
                      {searchResults.map((session, i) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          index={i}
                          source="search_results"
                          rsvpLoading={rsvpLoadingId === session.id}
                          onJoin={handleJoinSession}
                          onLeave={handleLeaveSession}
                          onPreviewAttendees={setAttendeeSheetSession}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
            <>
            {/* Event-first discovery */}
            {!loading && sessions.length > 0 && (
              <EventDiscoveryBand
                sessions={sessions}
                crews={featuredCrews}
                sessionCount={discoveryStats.sessionCount}
                peopleCount={discoveryStats.peopleCount}
                goingSoloCount={discoveryStats.goingSoloCount}
                beginnerCount={discoveryStats.beginnerCount}
                cityName={neighborhoodFilter?.name ?? cityConfig.name}
                activeTypeLabel={activeTypeLabel}
                onCreate={() => setShowCreateMenu(true)}
                onPreviewAttendees={setAttendeeSheetSession}
              />
            )}

            {/* Directory count header */}
            {!loading && sessions.length > 0 && (
              <p className="text-xs font-medium text-[#666666] py-3 uppercase tracking-wider">
                {sessions.length} social fitness event{sessions.length !== 1 ? 's' : ''} with live people signals{neighborhoodFilter ? ` in ${neighborhoodFilter.name}` : ' nearby'}
              </p>
            )}

            {loading ? (
              <div className="pt-3 space-y-8">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-white/[0.06] bg-[#111111] p-3">
                    <div className="h-20 rounded-lg bg-[#1A1A1A] shimmer" />
                    <div className="min-w-0 py-1">
                      <div className="h-3 w-20 rounded bg-[#1A1A1A] shimmer" />
                      <div className="mt-3 h-4 w-4/5 rounded bg-[#1A1A1A] shimmer" />
                      <div className="mt-2 h-3 w-3/5 rounded bg-[#1A1A1A] shimmer" />
                      <div className="mt-4 flex gap-2">
                        <div className="h-6 w-16 rounded-full bg-[#1A1A1A] shimmer" />
                        <div className="h-6 w-20 rounded-full bg-[#1A1A1A] shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
                <style>{`
                  .shimmer {
                    background: linear-gradient(90deg, #1A1A1A 25%, #2A2A2A 50%, #1A1A1A 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                  }
                  @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                `}</style>
              </div>
            ) : sessions.length === 0 ? (
              <CityEmptyState
                cityName={neighborhoodFilter?.name ?? cityConfig.name}
                citySlug={cityConfig.slug}
                hasFilters={Boolean(typeFilter || pricingFilter || levelFilter || dateFilter || neighborhoodFilter)}
                onClearFilters={() => {
                  setTypeFilter('')
                  setPricingFilter('')
                  setLevelFilter('')
                  setDateFilter('')
                  setNeighborhoodFilter(null)
                }}
                onCreate={() => setShowCreateMenu(true)}
                onStarterSelect={(type) => {
                  setTypeFilter(type)
                  setShowCreateSheet(true)
                }}
              />
            ) : (
              <div className="space-y-8 pt-1">
                {bucketSessions(sessions).map((bucket) => (
                  <div key={bucket.key}>
                    {/* Section header — NTC style */}
                    <div className="flex items-center justify-between px-1 mb-3">
                      <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">
                        {bucket.label}
                      </h2>
                      <span className="text-[11px] text-[#666666] uppercase tracking-wider">
                        {bucket.sessions.length} event{bucket.sessions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Horizontal scroll on mobile, grid on desktop */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 sm:overflow-visible">
                      {bucket.sessions.map((session, i) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          index={i}
                          source={`bucket_${bucket.key}`}
                          rsvpLoading={rsvpLoadingId === session.id}
                          onJoin={handleJoinSession}
                          onLeave={handleLeaveSession}
                          onPreviewAttendees={setAttendeeSheetSession}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {nextCursor && (
                  <button
                    onClick={() => fetchSessions(nextCursor)}
                    disabled={loadingMore}
                    className="w-full py-3 text-sm text-[#666666] hover:text-[#999999] flex items-center justify-center gap-2"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                  </button>
                )}

                {sessions.length > 0 && sessions.length < 6 && !nextCursor && (
                  <div className="text-center py-6 border-t border-white/[0.06]">
                    <p className="text-xs text-[#666666] mb-3">That&apos;s everything nearby for now. RSVP to an event or list one we should map.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowCreateSheet(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-black uppercase tracking-wider"
                      >
                        <Zap className="w-3 h-3" />
                        Host a session
                      </button>
                      <Link
                        href="/communities"
                        className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-[#999999]"
                      >
                        Browse crews
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
          <div className="relative hidden min-h-0 bg-[#151515] lg:block">
            <LazySessionVectorMap
              center={userLocation ?? cityConfig.center}
              pins={mapPins}
              selectedPinId={selectedPin?.id ?? null}
              onPinClick={handleVectorMapPinClick}
              onMapClick={() => setSelectedPin(null)}
              initialZoom={12}
              maxFitZoom={13}
            />
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-white/[0.10] bg-black/55 px-3 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white/70 backdrop-blur">
              {activeDateLabel} · {sessions.filter((session) => session.latitude && session.longitude).length} mapped listings
            </div>
            {selectedPin && (
              <div className="absolute bottom-5 left-5 z-20 w-[260px] max-w-[calc(100%-40px)]">
                <SessionCard
                  session={selectedPin}
                  index={0}
                  source="desktop_map_selected_pin"
                  rsvpLoading={rsvpLoadingId === selectedPin.id}
                  onJoin={handleJoinSession}
                  onLeave={handleLeaveSession}
                  onPreviewAttendees={setAttendeeSheetSession}
                />
              </div>
            )}
            {!loading && sessions.length === 0 && (
              <MapEmptyOverlay
                cityName={neighborhoodFilter?.name ?? cityConfig.name}
                onCreate={() => setShowCreateMenu(true)}
              />
            )}
            {!loading && dateFilter === todayDateString && sessions.length > 0 && sessions.length < 3 && (
              <MapQuietTodayBanner
                sessionCount={sessions.length}
                onViewUpcoming={() => updateDateFilter('')}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Map view ── */}
          <div className="relative w-full" style={{ height: 'calc(100dvh - 190px)' }}>
            <LazySessionVectorMap
              center={userLocation ?? cityConfig.center}
              pins={mapPins}
              selectedPinId={selectedPin?.id ?? null}
              onPinClick={handleVectorMapPinClick}
              onMapClick={() => setSelectedPin(null)}
              initialZoom={12}
              maxFitZoom={13}
            />

            {/* Selected pin card overlay */}
            {selectedPin && (
              <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-3 right-3 z-30 lg:bottom-5 lg:left-5 lg:right-auto lg:w-[340px]">
                <MapSelectedSessionCard
                  session={selectedPin}
                  onClose={() => setSelectedPin(null)}
                  source="map_selected_pin"
                  rsvpLoading={rsvpLoadingId === selectedPin.id}
                  onJoin={handleJoinSession}
                  onLeave={handleLeaveSession}
                  onPreviewAttendees={setAttendeeSheetSession}
                />
              </div>
            )}
            {!loading && sessions.length === 0 && (
              <MapEmptyOverlay
                cityName={neighborhoodFilter?.name ?? cityConfig.name}
                onCreate={() => setShowCreateMenu(true)}
              />
            )}
            {!loading && dateFilter === todayDateString && sessions.length > 0 && sessions.length < 3 && (
              <MapQuietTodayBanner
                sessionCount={sessions.length}
                onViewUpcoming={() => updateDateFilter('')}
              />
            )}
          </div>
        </>
      )}

      {soloPromptSession ? (
        <GoingSoloAfterRsvpPrompt
          session={soloPromptSession}
          loading={soloPromptLoading}
          onAnswer={handleGoingSoloAnswer}
          onDismiss={dismissGoingSoloPrompt}
        />
      ) : null}

      {!soloPromptSession && followPromptSession?.community ? (
        <FollowAfterRsvpPrompt
          session={followPromptSession}
          loading={followLoadingId === followPromptSession.community.id}
          onFollow={handleFollowPrompt}
          onDismiss={() => setFollowPromptSession(null)}
        />
      ) : null}

      {attendeeSheetSession ? (
        <AttendeePreviewSheet
          session={attendeeSheetSession}
          rsvpLoading={rsvpLoadingId === attendeeSheetSession.id}
          onClose={() => setAttendeeSheetSession(null)}
          onJoin={handleJoinSession}
        />
      ) : null}

    </div>
  )
}

function AttendeePreviewSheet({
  session,
  rsvpLoading,
  onClose,
  onJoin,
}: {
  session: Session
  rsvpLoading: boolean
  onClose: () => void
  onJoin: (session: Session, source: string) => void
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const isPaid = session.activityMode === 'P2P_PAID'
  const canQuickRsvp = !isPaid && !session.requiresApproval && !session.isFull
  const visibleAttendees = session.attendees.slice(0, 8)
  const soloCount = session.goingSoloCount ?? 0
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 mx-auto max-w-md rounded-2xl border border-[#3A332B] bg-[#1B1814]/97 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur md:left-auto md:right-5 md:mx-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#F2C879]">
            Going to this
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-black leading-tight text-[#F7F0E8]">
            {session.title}
          </h3>
          <p className="mt-1 truncate text-xs font-semibold text-[#A9A19A]">
            Hosted by {hostLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#A9A19A] transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Close attendees"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-[#3A332B] bg-[#16130F] px-3 py-2">
          <p className="text-lg font-black text-[#F7F0E8]">{session.attendeeCount}</p>
          <p className="font-mono text-[9px] font-black uppercase tracking-wide text-[#A9A19A]">Going</p>
        </div>
        <div className="rounded-xl border border-[#3A332B] bg-[#16130F] px-3 py-2">
          <p className="text-lg font-black text-[#66D9C2]">{soloCount}</p>
          <p className="font-mono text-[9px] font-black uppercase tracking-wide text-[#A9A19A]">Solo</p>
        </div>
        <div className="rounded-xl border border-[#3A332B] bg-[#16130F] px-3 py-2">
          <p className="text-lg font-black text-[#F2C879]">
            {session.maxPeople ? Math.max(session.maxPeople - session.attendeeCount, 0) : 'Open'}
          </p>
          <p className="font-mono text-[9px] font-black uppercase tracking-wide text-[#A9A19A]">Spots</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {visibleAttendees.length > 0 ? (
          visibleAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#3A332B] bg-[#16130F] px-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#332B23] text-xs font-black text-[#F7F0E8]">
                  {attendee.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attendee.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    attendee.name?.[0]?.toUpperCase() ?? '?'
                  )}
                </span>
                <span className="truncate text-sm font-bold text-[#F7F0E8]">
                  {attendee.name?.split(' ')[0] ?? 'Someone'}
                </span>
              </div>
              {attendee.goingSolo ? (
                <span className="shrink-0 rounded-full border border-[#66D9C2]/25 bg-[#66D9C2]/10 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-[#66D9C2]">
                  Solo
                </span>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#4A4035] bg-[#16130F] px-4 py-5 text-center">
            <p className="text-sm font-bold text-[#F7F0E8]">No one has joined yet.</p>
            <p className="mt-1 text-xs text-[#A9A19A]">Be first in.</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {canQuickRsvp && !isJoined ? (
          <button
            type="button"
            disabled={rsvpLoading}
            onClick={() => onJoin(session, 'attendee_preview_sheet')}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#F7F0E8] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-[#11100E] transition-colors hover:bg-white disabled:cursor-wait disabled:bg-[#2A241D] disabled:text-[#71675D]"
          >
            {rsvpLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            I&apos;m going
          </button>
        ) : null}
        <Link
          href={`/activities/${session.id}`}
          onClick={() => trackSessionClick(session, 'attendee_preview_sheet', 0)}
          className={`inline-flex min-h-10 items-center justify-center rounded-full border border-[#4A4035] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-[#D7CEC4] transition-colors hover:border-[#F2C879]/55 hover:text-[#F7F0E8] ${canQuickRsvp && !isJoined ? '' : 'col-span-2'}`}
        >
          Details
        </Link>
      </div>
    </motion.div>
  )
}

function GoingSoloAfterRsvpPrompt({
  session,
  loading,
  onAnswer,
  onDismiss,
}: {
  session: Session
  loading: boolean
  onAnswer: (goingSolo: boolean) => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md rounded-2xl border border-[#B6FF00]/20 bg-[#101010]/96 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur md:left-auto md:right-5 md:mx-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B6FF00]/12">
          <Users className="h-5 w-5 text-[#B6FF00]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            Going solo?
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#999999]">
            Let others know you are open to meeting people at {session.title}.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#B6FF00] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#CAFF33] disabled:cursor-wait disabled:bg-neutral-300"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
              Yes, open
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/[0.10] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white/74 transition-colors hover:border-white/25 hover:text-white disabled:cursor-wait disabled:text-white/35"
            >
              Not today
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Dismiss going solo prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function FollowAfterRsvpPrompt({
  session,
  loading,
  onFollow,
  onDismiss,
}: {
  session: Session
  loading: boolean
  onFollow: () => void
  onDismiss: () => void
}) {
  if (!session.community) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md rounded-2xl border border-white/[0.12] bg-[#101010]/96 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur md:left-auto md:right-5 md:mx-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#242424]">
          {session.community.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.community.logoImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserPlus className="h-5 w-5 text-[#63FF8F]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-bold text-white">
            Follow {session.community.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#999999]">
            Get updates after {session.title}.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onFollow}
              disabled={loading}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-neutral-200 disabled:cursor-wait disabled:bg-neutral-300"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Follow host
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/[0.10] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white/70 transition-colors hover:border-white/25 hover:text-white"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Dismiss follow prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface FilterOption {
  value: string
  label: string
}

function FilterMenu({
  label,
  displayValue,
  value,
  options,
  onChange,
}: {
  label: string
  displayValue: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  return (
    <details className="group relative min-w-0">
      <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-2 rounded-md border-2 border-white/70 bg-[#0D0D0D] px-3 py-2 font-mono shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:border-[#63FF8F] group-open:border-[#63FF8F] [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/44">
            {label}
          </span>
          <span className="mt-1 block truncate text-[13px] font-black text-white">
            {displayValue}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/56 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[360px] overflow-y-auto rounded-md border border-white/14 bg-[#151515]/94 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              key={`${label}-${option.value || 'all'}`}
              type="button"
              onClick={(event) => {
                onChange(option.value)
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded px-3 text-left text-sm font-bold transition-colors ${
                active
                  ? 'bg-[#63FF8F] text-black'
                  : 'text-white/76 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {active && <Check className="h-4 w-4 shrink-0" />}
            </button>
          )
        })}
      </div>
    </details>
  )
}

function FilterOptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </p>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              key={`${label}-${option.value || 'all'}`}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-11 shrink-0 rounded-md border px-3 font-mono text-[11px] font-black uppercase tracking-wide transition-colors ${
                active
                  ? 'border-[#63FF8F] bg-[#63FF8F] text-black'
                  : 'border-white/[0.10] bg-[#171717] text-white/66 hover:border-white/24 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CityEmptyState({
  cityName,
  citySlug,
  hasFilters,
  onClearFilters,
  onCreate,
  onStarterSelect,
}: {
  cityName: string
  citySlug: string
  hasFilters: boolean
  onClearFilters: () => void
  onCreate: () => void
  onStarterSelect: (type: string) => void
}) {
  const otherCity = citySlug === 'bangkok'
    ? { name: 'Singapore', href: '/buddy?city=singapore' }
    : { name: 'Bangkok', href: '/buddy?city=bangkok' }

  return (
    <div className="grid gap-4 py-5 sm:py-6">
      <section className="rounded-2xl border border-white/[0.08] bg-[#141414] p-4 sm:p-5">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#63FF8F]">
          {cityName} is open
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
          No events listed here yet.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#999999]">
          SweatBuddies shows upcoming sessions first, backed by reviewed host and community pages in the selected city.
          Add a host source for review, publish a session if you run one, or clear filters if you narrowed the search too far.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/communities/create"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black uppercase tracking-wide text-black hover:bg-neutral-200"
            >
            Suggest community
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-[#1A1A1A] px-4 text-xs font-black uppercase tracking-wide text-white hover:border-[#63FF8F] hover:text-[#63FF8F]"
          >
            <Zap className="h-3.5 w-3.5" />
            Host session
          </button>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex min-h-11 items-center rounded-full border border-white/[0.12] px-4 text-xs font-black uppercase tracking-wide text-[#999999] hover:border-white/30 hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[#101010] p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#666666]">
              Good first community listings
            </p>
            <h3 className="mt-1 text-base font-bold text-white">
              Low-pressure plans people understand
            </h3>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {STARTER_SESSION_IDEAS.map((idea) => (
            <button
              key={idea.label}
              onClick={() => onStarterSelect(idea.type)}
              className="min-h-[74px] rounded-xl border border-white/[0.08] bg-[#181818] p-3 text-left transition-colors hover:border-[#63FF8F]"
            >
              <p className="text-sm font-bold text-white">{idea.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#777777]">{idea.note}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/communities"
          className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 hover:border-white/18"
        >
          <p className="text-sm font-bold text-white">Browse crews</p>
          <p className="mt-1 text-xs leading-5 text-[#777777]">
            Find communities already listed, even before their next session is live.
          </p>
        </Link>
        <Link
          href={otherCity.href}
          className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 hover:border-white/18"
        >
          <p className="text-sm font-bold text-white">Browse {otherCity.name}</p>
          <p className="mt-1 text-xs leading-5 text-[#777777]">
            Switch markets intentionally. Your current city remains {cityName}.
          </p>
        </Link>
      </section>
    </div>
  )
}

function MapEmptyOverlay({
  cityName,
  onCreate,
}: {
  cityName: string
  onCreate: () => void
}) {
  return (
    <div className="absolute inset-x-4 top-4 z-20 max-w-sm rounded-2xl border border-white/[0.10] bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#63FF8F]">
        No mapped listings
      </p>
      <h3 className="mt-2 text-lg font-bold leading-tight text-white">
        Be first in {cityName}.
      </h3>
      <p className="mt-2 text-xs leading-5 text-[#999999]">
        The map shows reviewed community pages and hosted sessions that pass guardrails.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black uppercase tracking-wide text-black hover:bg-neutral-200"
      >
        <Zap className="h-3.5 w-3.5" />
        Create
      </button>
    </div>
  )
}

function MapQuietTodayBanner({
  sessionCount,
  onViewUpcoming,
}: {
  sessionCount: number
  onViewUpcoming: () => void
}) {
  return (
    <div className="absolute left-3 right-3 top-3 z-20 rounded-2xl border border-white/[0.10] bg-black/70 p-3 shadow-2xl shadow-black/30 backdrop-blur md:left-4 md:right-auto md:top-[4.75rem] md:w-[320px]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#B6FF00]">
            Quiet today
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-white/80">
            {sessionCount} mapped plan{sessionCount !== 1 ? 's' : ''} today.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewUpcoming}
          className="min-h-9 shrink-0 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-neutral-200"
        >
          View upcoming
        </button>
      </div>
    </div>
  )
}

function SessionCard({
  session,
  isHosting = false,
  index = 0,
  source = 'list',
  rsvpLoading = false,
  onJoin,
  onLeave,
  onPreviewAttendees,
}: {
  session: Session
  isHosting?: boolean
  index?: number
  source?: string
  rsvpLoading?: boolean
  onJoin?: (session: Session, source: string) => void
  onLeave?: (session: Session, source: string) => void
  onPreviewAttendees?: (session: Session) => void
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const isPaid = session.activityMode === 'P2P_PAID'
  const priceDisplay = isPaid ? `$${(session.price / 100).toFixed(0)}` : 'Free'
  const canQuickRsvp = !isPaid && !session.requiresApproval
  const showQuickRsvp = !isHosting && (canQuickRsvp || isJoined)
  const rsvpDisabled = rsvpLoading || (session.isFull && !isJoined)
  const rsvpLabel = isJoined
    ? "You're going"
    : session.isFull
      ? 'Full'
      : "I'm going"

  const displayName = session.title
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'
  const communityLogo = session.community?.logoImage
  const hostAvatar = session.host?.imageUrl
  const hostIsReal = session.host?.name && session.host.name !== 'sweatbuddies' && session.host.name !== 'SweatBuddies'
  const avatarSrc = communityLogo || (hostIsReal ? hostAvatar : null)

  const emoji = pinEmoji(session.categorySlug ?? 'other')
  const activityLabel = (session.categorySlug ?? 'fitness').replace(/[-_]/g, ' ')
  const officialJoinUrl = session.officialJoinUrl ?? null
  const officialJoinLabel = getOfficialJoinLabel(session)
  const freshnessLabel = getFreshnessLabel(session)
  const socialProofLabel = getSocialProofLabel(session)
  const soloCount = session.goingSoloCount ?? 0
  const isFirstTimerFriendly = session.fitnessLevel === 'ALL' || soloCount > 0
  const levelLabel = session.fitnessLevel
    ? LEVEL_FILTERS.find((filter) => filter.value === session.fitnessLevel)?.label ??
      session.fitnessLevel.toLowerCase().replace(/[_-]/g, ' ')
    : null
  const timeLabel = session.startTime ? format(new Date(session.startTime), 'EEE, MMM d · h:mm a') : 'Time TBA'
  const areaLabel = session.address?.split(',')[0] ?? session.city
  const trustLabel = session.community ? 'Verified host page' : hostIsReal ? 'Host profile' : 'Local listing'

  return (
    <motion.div
      id={`session-${session.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <div className="group flex w-[286px] min-h-[252px] flex-shrink-0 snap-start flex-col rounded-2xl border border-[#3A332B] bg-[#1B1814] p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-colors hover:border-[#E66A4E]/45 hover:bg-[#211D18] sm:w-auto sm:flex-shrink">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#F2C879]">
              {timeLabel}
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold capitalize text-[#A9A19A]">
              {areaLabel} · {activityLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isJoined && !isHosting ? (
              <span className="rounded-full bg-[#66D9C2] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-[#11100E]">
                Going
              </span>
            ) : null}
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#3A332B] bg-[#2A241D] text-xl">
              {emoji}
            </span>
          </div>
        </div>

        <Link
          href={`/activities/${session.id}`}
          onClick={() => trackSessionClick(session, source, index)}
          className="mt-3 block"
        >
          <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-black leading-tight text-[#F7F0E8] transition-colors group-hover:text-[#F2C879]">
            {displayName}
          </h3>
        </Link>

        <div className="mt-2 flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#3A332B] bg-[#2A241D] text-[11px] font-black text-[#F7F0E8]">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              hostLabel[0]?.toUpperCase() ?? 'S'
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-[#F7F0E8]">
              Hosted by {hostLabel}
            </p>
            <p className="truncate text-[10px] font-semibold text-[#A78B6D]">
              {trustLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#3A332B] bg-[#16130F] px-3 py-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <AttendeePreview
              attendees={session.attendees}
              attendeeCount={session.attendeeCount}
              onClick={onPreviewAttendees ? () => onPreviewAttendees(session) : undefined}
            />
            <span className="shrink-0 rounded-full bg-[#2A241D] px-2 py-1 text-right text-[10px] font-black uppercase tracking-wide text-[#F2C879]">
              {socialProofLabel}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          {(session.community || officialJoinUrl || freshnessLabel || levelLabel || soloCount > 0 || isFirstTimerFriendly) && (
            <div className="flex flex-wrap gap-1.5">
              {soloCount > 0 ? (
                <span className="rounded-full border border-[#66D9C2]/25 bg-[#66D9C2]/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-[#66D9C2]">
                  {soloCount} going solo
                </span>
              ) : null}
              {isFirstTimerFriendly ? (
                <span className="rounded-full border border-[#3A332B] bg-[#241F19] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-[#D7CEC4]">
                  First-timers welcome
                </span>
              ) : null}
              {session.community ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#3A332B] bg-[#241F19] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-[#D7CEC4]">
                  <ShieldCheck className="h-3 w-3" />
                  Verified host
                </span>
              ) : null}
              {officialJoinUrl ? (
                <span className="rounded-full border border-[#E66A4E]/30 bg-[#E66A4E]/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-[#FF9A83]">
                  Official link
                </span>
              ) : null}
              {freshnessLabel ? (
                <span className="rounded-full border border-[#3A332B] bg-[#241F19] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-[#D7CEC4]">
                  {freshnessLabel}
                </span>
              ) : null}
              {levelLabel ? (
                <span className="rounded-full border border-[#F2C879]/25 bg-[#F2C879]/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-[#F2C879]">
                  {levelLabel}
                </span>
              ) : null}
            </div>
          )}

          <div className="grid min-w-0 grid-cols-2 gap-2">
            {showQuickRsvp ? (
              <button
                type="button"
                disabled={rsvpDisabled}
                onClick={() => {
                  if (isJoined) {
                    onLeave?.(session, source)
                  } else {
                    onJoin?.(session, source)
                  }
                }}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 font-mono text-[10px] font-black uppercase tracking-wide transition-colors ${
                  isJoined
                    ? 'border border-[#66D9C2]/30 bg-[#66D9C2]/10 text-[#66D9C2] hover:bg-[#66D9C2]/15'
                    : 'bg-[#F7F0E8] text-[#11100E] hover:bg-white'
                } disabled:cursor-not-allowed disabled:bg-[#2A241D] disabled:text-[#71675D]`}
              >
                {rsvpLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isJoined ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}
                {rsvpLabel}
              </button>
            ) : officialJoinUrl ? (
              <a
                href={officialJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOfficialJoinClick(session, source)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#E66A4E] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white transition-colors hover:bg-[#F07D64]"
              >
                {officialJoinLabel}
              </a>
            ) : null}
            <Link
              href={`/activities/${session.id}`}
              onClick={() => trackSessionClick(session, source, index)}
              className={`inline-flex min-h-10 items-center justify-center rounded-full border border-[#4A4035] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-[#D7CEC4] transition-colors hover:border-[#F2C879]/55 hover:text-[#F7F0E8] ${showQuickRsvp || officialJoinUrl ? '' : 'col-span-2'}`}
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AttendeePreview({
  attendees,
  attendeeCount,
  onClick,
}: {
  attendees: Attendee[]
  attendeeCount: number
  onClick?: () => void
}) {
  if (attendeeCount === 0) {
    return (
      <div className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-[#777777]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/[0.16] bg-[#171717] text-[10px]">
          +
        </span>
        <span className="truncate">Be first in</span>
      </div>
    )
  }

  const content = (
    <>
      <div className="flex -space-x-2">
        {attendees.slice(0, 4).map((attendee) => (
          <span
            key={attendee.id}
            className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[#1B1814] bg-[#332B23] text-[10px] font-bold text-[#F7F0E8]"
            title={attendee.name ?? 'Attendee'}
          >
            {attendee.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attendee.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              attendee.name?.[0]?.toUpperCase() ?? '?'
            )}
          </span>
        ))}
      </div>
      <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold text-[#D7CEC4]">
        <Users className="h-3 w-3 shrink-0 text-[#66D9C2]" />
        {attendeeCount} going
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 items-center gap-2 rounded-full pr-1 text-left transition-opacity hover:opacity-85"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {content}
    </div>
  )
}

function MapSelectedSessionCard({
  session,
  onClose,
  source,
  rsvpLoading = false,
  onJoin,
  onLeave,
  onPreviewAttendees,
}: {
  session: Session
  onClose: () => void
  source: string
  rsvpLoading?: boolean
  onJoin?: (session: Session, source: string) => void
  onLeave?: (session: Session, source: string) => void
  onPreviewAttendees?: (session: Session) => void
}) {
  const isPaid = session.activityMode === 'P2P_PAID'
  const priceDisplay = isPaid ? `$${(session.price / 100).toFixed(0)}` : 'Free'
  const displayName = session.community?.name ?? session.host?.name ?? 'Someone'
  const communityLogo = session.community?.logoImage
  const hostAvatar = session.host?.imageUrl
  const hostIsReal = session.host?.name && session.host.name !== 'sweatbuddies' && session.host.name !== 'SweatBuddies'
  const avatarSrc = communityLogo || (hostIsReal ? hostAvatar : null)
  const emoji = pinEmoji(session.categorySlug ?? 'other')
  const activityLabel = (session.categorySlug ?? 'fitness').replace(/[-_]/g, ' ')
  const attendeeLabel = session.attendeeCount > 0 ? `${session.attendeeCount} going` : 'Be first to join'
  const spotsRemaining =
    typeof session.maxPeople === 'number' && session.maxPeople > 0
      ? Math.max(session.maxPeople - session.attendeeCount, 0)
      : null
  const capacityLabel = session.isFull
    ? 'Full'
    : spotsRemaining !== null
      ? `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`
      : null
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const officialJoinUrl = session.officialJoinUrl ?? null
  const ctaLabel = officialJoinUrl ? getOfficialJoinLabel(session) : isJoined || session.isFull ? 'View details' : 'Join'
  const freshnessLabel = getFreshnessLabel(session)
  const canQuickRsvp = !isPaid && !session.requiresApproval
  const showQuickRsvp = canQuickRsvp || isJoined
  const rsvpDisabled = rsvpLoading || (session.isFull && !isJoined)
  const rsvpLabel = isJoined
    ? "You're going"
    : session.isFull
      ? 'Full'
      : "I'm going"
  const soloCount = session.goingSoloCount ?? 0
  const isFirstTimerFriendly = session.fitnessLevel === 'ALL' || soloCount > 0
  const levelLabel = session.fitnessLevel
    ? LEVEL_FILTERS.find((filter) => filter.value === session.fitnessLevel)?.label ??
      session.fitnessLevel.toLowerCase().replace(/[_-]/g, ' ')
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative max-h-[42dvh] overflow-hidden rounded-2xl border border-[#3A332B] bg-[#1B1814]/96 shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur"
      data-selected-pin-card
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white/70 shadow-lg shadow-black/20 transition-colors hover:text-white"
        aria-label="Close selected session"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="grid min-h-[132px] grid-cols-[112px_minmax(0,1fr)] gap-3 p-3 pr-12">
        <Link
          href={`/activities/${session.id}`}
          onClick={() => trackSessionClick(session, source, 0)}
          className="relative min-h-[118px] overflow-hidden rounded-xl bg-[#16130F]"
        >
          {session.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${(CATEGORY_GRADIENTS[session.categorySlug ?? 'other'] ?? CATEGORY_GRADIENTS.other)[0]}, ${(CATEGORY_GRADIENTS[session.categorySlug ?? 'other'] ?? CATEGORY_GRADIENTS.other)[1]})` }}
            >
              <span className="text-4xl drop-shadow-lg">{emoji}</span>
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-[#F2C879] px-2 py-1 font-mono text-[10px] font-black uppercase text-[#11100E]">
            {priceDisplay}
          </span>
        </Link>

        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
            ) : null}
            <span className="truncate text-[11px] capitalize text-[#A9A19A]">
              {activityLabel} · {session.city}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-black leading-tight text-[#F7F0E8]">
            {displayName}
          </h3>
          <p className="line-clamp-2 text-xs leading-snug text-[#A9A19A]">
            Known plan: {session.title}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#A78B6D]">
            {session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'}
            {session.address ? ` · ${session.address.split(',')[0]}` : ''}
          </p>
          <AttendeePreview
            attendees={session.attendees}
            attendeeCount={session.attendeeCount}
            onClick={onPreviewAttendees ? () => onPreviewAttendees(session) : undefined}
          />
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {soloCount > 0 ? (
              <span className="rounded-full border border-[#B6FF00]/25 bg-[#B6FF00]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#B6FF00]">
                {soloCount} solo
              </span>
            ) : null}
            {isFirstTimerFriendly ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
                First-timers
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
              {attendeeLabel}
            </span>
            {capacityLabel ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
                {capacityLabel}
              </span>
            ) : null}
            {levelLabel ? (
              <span className="rounded-full border border-[#B6FF00]/25 bg-[#B6FF00]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#B6FF00]">
                {levelLabel}
              </span>
            ) : null}
            {officialJoinUrl ? (
              <span className="rounded-full border border-[#63FF8F]/25 bg-[#63FF8F]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#63FF8F]">
                Official link
              </span>
            ) : null}
            {freshnessLabel ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
                {freshnessLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {showQuickRsvp ? (
              <button
                type="button"
                disabled={rsvpDisabled}
                onClick={() => {
                  if (isJoined) {
                    onLeave?.(session, source)
                  } else {
                    onJoin?.(session, source)
                  }
                }}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[10px] font-black uppercase transition-colors ${
                  isJoined
                    ? 'border border-[#63FF8F]/30 bg-[#63FF8F]/10 text-[#63FF8F]'
                    : 'bg-white text-black hover:bg-neutral-200'
                } disabled:cursor-not-allowed disabled:bg-[#222222] disabled:text-[#666666]`}
              >
                {rsvpLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isJoined ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {rsvpLabel}
              </button>
            ) : null}
            {officialJoinUrl ? (
              <a
                href={officialJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOfficialJoinClick(session, source)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#63FF8F] px-3 font-mono text-[10px] font-black uppercase text-black transition-colors hover:bg-[#83FFA6]"
              >
                {ctaLabel}
                <ArrowRight className="h-3 w-3" />
              </a>
            ) : null}
            <Link
              href={`/activities/${session.id}`}
              onClick={() => trackSessionClick(session, source, 0)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase text-black transition-colors hover:bg-neutral-200"
            >
              Details
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function getOfficialJoinLabel(session: Session) {
  const platform = session.officialJoinPlatform?.trim()
  if (platform) return `Join on ${platform}`
  return 'Official link'
}

function getFreshnessLabel(session: Session) {
  if (!session.lastVerifiedAt) return null
  const verifiedAt = new Date(session.lastVerifiedAt)
  if (Number.isNaN(verifiedAt.getTime())) return null
  const daysAgo = Math.floor((Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo <= 30) return 'Verified recently'
  return null
}

function getSocialProofLabel(session: Session) {
  const soloCount = session.goingSoloCount ?? 0
  if (soloCount > 0) {
    return `${soloCount} solo`
  }
  if (session.attendeeCount > 0) {
    return `${session.attendeeCount} joined`
  }
  return 'Open invite'
}

function trackSessionClick(session: Session, source: string, position: number) {
  trackBrowserEvent('buddy_session_clicked', {
    sessionId: session.id,
    source,
    category: session.categorySlug ?? 'unknown',
    price: session.price,
    isPaid: session.activityMode === 'P2P_PAID',
    attendeeCount: session.attendeeCount,
    position,
  })
}

function trackOfficialJoinClick(session: Session, source: string) {
  trackBrowserEvent('official_join_clicked', {
    sessionId: session.id,
    communityId: session.community?.id ?? null,
    communitySlug: session.community?.slug ?? null,
    source,
    city: session.city,
    category: session.categorySlug ?? 'unknown',
    platform: session.officialJoinPlatform ?? null,
    hasVerifiedAt: Boolean(session.lastVerifiedAt),
  })
}

function trackBrowserEvent(event: string, metadata: Record<string, string | number | boolean | null>) {
  const body = JSON.stringify({ event, metadata })

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
    return
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
