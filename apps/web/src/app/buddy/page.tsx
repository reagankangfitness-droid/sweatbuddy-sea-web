'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Loader2, Zap, Map, List, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { PaymentModal } from '@/components/PaymentModal'
import { DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'
import { SessionFeedbackSheet } from '@/components/SessionFeedbackSheet'
import { BioPromptSheet } from '@/components/BioPromptSheet'
import { JoinGateSheet } from '@/components/JoinGateSheet'
import {
  DEFAULT_CITY_LOCATION_CONFIG,
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
  community?: { id: string; name: string; logoImage: string | null; slug: string } | null
  attendees: Attendee[]
  attendeeCount: number
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

// ─── Map constants ───────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// ─── Vanilla Google Maps loader (no wrapper library) ─────────────────────────

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps) { resolve(); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) { existing.addEventListener('load', () => resolve()); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Maps script failed to load'))
    document.head.appendChild(script)
  })
}

function VanillaMap({ center, sessions, selectedPin, onPinClick, onMapClick }: {
  center: { lat: number; lng: number }
  sessions: Session[]
  selectedPin: Session | null
  onPinClick: (s: Session | null) => void
  onMapClick: () => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load script + init map
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) { setError('No API key'); return }
    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: DARK_MAP_STYLES,
        })
        mapInstanceRef.current.addListener('click', onMapClick)
        setLoaded(true)
      })
      .catch((err) => setError(err.message))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when sessions change
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return
    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    // Add new markers
    sessions.filter((s) => s.latitude && s.longitude).forEach((s) => {
      const marker = new google.maps.Marker({
        position: { lat: s.latitude!, lng: s.longitude! },
        map: mapInstanceRef.current!,
        label: { text: pinEmoji(s.categorySlug ?? 'other'), fontSize: '16px' },
        title: s.title,
      })
      marker.addListener('click', () => onPinClick(selectedPin?.id === s.id ? null : s))
      markersRef.current.push(marker)
    })
  }, [loaded, sessions, selectedPin, onPinClick])

  if (error) return (
    <div className="w-full h-full bg-[#1A1A1A] flex flex-col items-center justify-center gap-2">
      <p className="text-sm text-[#999999]">Map failed to load</p>
      <p className="text-xs text-[#666666]">{error}</p>
    </div>
  )

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!loaded && (
        <div className="absolute inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#999999]" />
          <p className="text-xs text-[#666666]">Loading map...</p>
        </div>
      )}
    </>
  )
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

function getUrgencyStyle(startTime: string): string {
  const diffMs = new Date(startTime).getTime() - Date.now()
  const diffHrs = diffMs / (1000 * 60 * 60)
  if (diffHrs < 0) return 'bg-white text-black animate-pulse'
  if (diffHrs < 2) return 'bg-white text-black'
  if (diffHrs < 6) return 'bg-[#FFB347] text-black'
  return 'bg-[#2A2A2A] text-[#999999]'
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
  if (happeningNow.length) buckets.push({ key: 'now', label: 'Now', sessions: happeningNow })
  if (nextFewHours.length) buckets.push({ key: 'soon', label: 'Soon', sessions: nextFewHours })
  if (today.length) buckets.push({ key: 'today', label: 'Today', sessions: today })
  if (tomorrow.length) buckets.push({ key: 'tomorrow', label: 'Tomorrow', sessions: tomorrow })
  if (later.length) buckets.push({ key: 'later', label: 'This week', sessions: later })
  return buckets
}

function formatAddress(raw: string): string {
  // "Bangkok Khlong Toei District 10110 Thailand" → "Khlong Toei, Bangkok"
  // "Benjakitti Park | Bangkok" → "Benjakitti Park"
  // "60 Thanon Ratchadaphisek" → "Thanon Ratchadaphisek"
  const cleaned = raw.replace(/\d{4,6}/g, '').replace(/\s+/g, ' ').trim()
  const parts = cleaned.split(/[,|]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return raw
  // Return first meaningful part (skip country names)
  const skip = ['singapore', 'thailand', 'indonesia', 'malaysia', 'philippines', 'vietnam']
  const meaningful = parts.filter((p) => !skip.includes(p.toLowerCase()))
  return meaningful[0] ?? parts[0]
}

function CrewDiscoveryBand({
  crews,
  peopleCount,
  sessionCount,
  freeCount,
  cityName,
  activeTypeLabel,
  onCreate,
}: {
  crews: CrewSpotlight[]
  peopleCount: number
  sessionCount: number
  freeCount: number
  cityName: string
  activeTypeLabel: string
  onCreate: () => void
}) {
  const hasCrews = crews.length > 0

  return (
    <section className="pt-4 pb-5 border-b border-white/[0.06]">
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666666]">
            Crews near {cityName}
          </p>
          <h1 className="mt-1 text-xl font-bold leading-tight text-white">
            Real crews moving nearby
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-[#777777]">
            {activeTypeLabel === 'All types'
              ? 'Run, stretch, lift, play, or recover with local crews already showing up.'
              : `${activeTypeLabel} crews with local people already showing up.`}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex-shrink-0 rounded-full border border-white/[0.08] bg-[#1A1A1A] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#222222] transition-colors"
        >
          Host one
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { value: sessionCount, label: 'sessions' },
          { value: peopleCount, label: 'people going' },
          { value: freeCount, label: 'free to join' },
        ].map((stat) => (
          <div key={stat.label} className="min-h-[58px] rounded-xl border border-white/[0.06] bg-[#151515] px-3 py-2.5">
            <p className="text-lg font-bold leading-none text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[#666666]">{stat.label}</p>
          </div>
        ))}
      </div>

      {hasCrews ? (
        <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {crews.map((crew) => (
            <CrewSpotlightCard key={crew.id} crew={crew} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] px-4 py-5 text-center">
          <p className="text-sm font-semibold text-white">Community pages are still forming here.</p>
          <p className="mt-1 text-xs text-[#666666]">The sessions below are the first signs of local momentum.</p>
        </div>
      )}
    </section>
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
          {nextTime ? `${nextTime} · ` : ''}{crew.sessionCount} session{crew.sessionCount !== 1 ? 's' : ''}
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
          {crew.peopleCount > 0 ? `${crew.peopleCount} going` : 'Open plan'}
        </p>
      </div>
    </Link>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
  running: 'bg-orange-500', pickleball: 'bg-green-500', yoga: 'bg-purple-500',
  bootcamp: 'bg-red-500', gym: 'bg-blue-500', cycling: 'bg-yellow-500',
  badminton: 'bg-emerald-500', combat_fitness: 'bg-rose-600', pilates: 'bg-pink-500',
  hiking: 'bg-lime-600', swimming: 'bg-cyan-500', padel: 'bg-teal-500',
  dance_fitness: 'bg-fuchsia-500', volleyball: 'bg-amber-500', basketball: 'bg-orange-600',
  cold_plunge: 'bg-sky-500', other: 'bg-neutral-500',
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

const EMOJI_MAP = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.key, t.emoji]))
function pinEmoji(slug: string) { return EMOJI_MAP[slug] ?? '🏅' }
function pinColor(slug: string) { return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.other }

// ─── Fitness / type filters ───────────────────────────────────────────────────

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'strength', label: 'Strength' },
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

export default function BuddyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#666666]" /></div>}>
      <BuddyPageInner />
    </Suspense>
  )
}

function BuddyPageInner() {
  const router = useRouter()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [cityConfig, setCityConfig] = useState<CityLocationConfig>(DEFAULT_CITY_LOCATION_CONFIG)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [paymentModalSession, setPaymentModalSession] = useState<Session | null>(null)
  const profileCityLockedRef = useRef(false)

  const [typeFilter, setTypeFilter] = useState('')
  const [pricingFilter, setPricingFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [shareSession, setShareSession] = useState<Session | null>(null)
  const [selectedPin, setSelectedPin] = useState<Session | null>(null)
  const [feedbackSession, setFeedbackSession] = useState<{ id: string; title: string; hostId: string; hostName: string | null } | null>(null)
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  const [showJoinGate, setShowJoinGate] = useState(false)
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(true) // assume true until checked
  const [profileLocationReady, setProfileLocationReady] = useState(false)

  // View mode: list-first (default) or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  // Neighborhood filter
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<CityNeighborhood | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Session[]>([])
  const [searching, setSearching] = useState(false)

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
    peopleCount: sessions.reduce((sum, session) => sum + session.attendeeCount, 0),
    sessionCount: sessions.length,
    freeCount: sessions.filter((session) => session.price === 0).length,
  }), [sessions])

  const activeTypeLabel = TYPE_FILTERS.find((type) => type.value === typeFilter)?.label ?? 'fitness'

  function updateTypeFilter(value: string) {
    const next = typeFilter === value ? '' : value
    setTypeFilter(next)
    trackBrowserEvent('buddy_filter_used', { filter: 'type', value: next || 'all' })
  }

  function updatePricingFilter(value: string) {
    const next = pricingFilter === value ? '' : value
    setPricingFilter(next)
    trackBrowserEvent('buddy_filter_used', { filter: 'pricing', value: next || 'all' })
  }

  function updateDateFilter(value: string) {
    const next = dateFilter === value ? '' : value
    setDateFilter(next)
    trackBrowserEvent('buddy_filter_used', { filter: 'date', value: next || 'all' })
  }

  function updateNeighborhoodFilter(value: CityNeighborhood) {
    const next = neighborhoodFilter?.name === value.name ? null : value
    setNeighborhoodFilter(next)
    trackBrowserEvent('buddy_filter_used', { filter: 'neighborhood', value: next?.name ?? 'all' })
  }

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ tab: 'happening' })
        if (typeFilter) params.set('type', typeFilter)
        if (pricingFilter) params.set('pricing', pricingFilter)
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
    [typeFilter, pricingFilter, dateFilter, userLocation, neighborhoodFilter, cityConfig]
  )

  const [locationReady, setLocationReady] = useState(false)

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
  }, [])

  // Load user context after browser location resolves. Profile location wins when GPS is unavailable or stale.
  useEffect(() => {
    if (!locationReady) return

    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/user/p2p-onboarding')
        const data = res.ok ? await res.json() : null
        if (data?.user?.id) setCurrentUserId(data.user.id)
        if (data) setIsOnboarded(!!data.completed)

        const profileCity = getCityLocationConfigFromText(data?.user?.location)
        if (profileCity) {
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
    if (!locationReady || !profileLocationReady) return
    setSessions([])
    fetchSessions()
  }, [locationReady, profileLocationReady, typeFilter, pricingFilter, dateFilter, neighborhoodFilter, fetchSessions])

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

  async function joinSession(sessionId: string) {
    // If user hasn't completed onboarding, show the join gate first
    if (!isOnboarded) {
      setPendingJoinId(sessionId)
      setShowJoinGate(true)
      return
    }

    // Find session to check if paid
    const session = sessions.find((s) => s.id === sessionId)
    if (session && session.activityMode === 'P2P_PAID') {
      // Open payment modal
      setPaymentModalSession(session)
      return
    }

    setJoiningId(sessionId)
    try {
      const res = await fetch(`/api/buddy/sessions/${sessionId}/join`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'PAYMENT_REQUIRED') {
          // Session is paid — show modal with session details
          const s = sessions.find((sess) => sess.id === sessionId)
          if (s) {
            setPaymentModalSession({
              ...s,
              acceptPayNow: data.session?.acceptPayNow ?? false,
              acceptStripe: data.session?.acceptStripe ?? false,
              paynowQrImageUrl: data.session?.paynowQrImageUrl ?? null,
              paynowName: data.session?.paynowName ?? null,
              paynowPhoneNumber: data.session?.paynowPhoneNumber ?? null,
            })
          }
          return
        }
        if (data.code === 'USE_CHECKOUT') {
          router.push(data.checkoutUrl || `/activities/${sessionId}`)
          return
        }
        toast.error(data.error || 'Failed to join')
        return
      }
      toast.success("You're in. See you there.")
      const joinedSession = sessions.find((s) => s.id === sessionId)
      fetchSessions()
      // Show share sheet after brief delay
      if (joinedSession) {
        setTimeout(() => setShareSession(joinedSession), 500)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setJoiningId(null)
    }
  }

  async function leaveSession(sessionId: string) {
    try {
      const res = await fetch(`/api/buddy/sessions/${sessionId}/leave`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to leave')
        return
      }
      toast.success('Left session')
      fetchSessions()
    } catch {
      toast.error('Something went wrong')
    }
  }


  return (
    <div className="flex flex-col bg-[#0D0D0D]" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Create Session Sheet */}
      <CreateSessionSheet open={showCreateSheet} onClose={() => setShowCreateSheet(false)} onSuccess={() => fetchSessions()} />

      {/* Post-Join Share Sheet */}
      <ShareSessionSheet
        open={!!shareSession}
        onClose={() => setShareSession(null)}
        sessionId={shareSession?.id ?? ''}
        sessionTitle={shareSession?.title ?? ''}
        sessionTime={shareSession?.startTime}
        sessionLocation={shareSession?.address ?? shareSession?.city ?? undefined}
        spotsLeft={shareSession?.maxPeople ? shareSession.maxPeople - shareSession.attendeeCount : null}
        goingCount={shareSession ? shareSession.attendeeCount + 1 : 0}
        context="joined"
      />

      {/* Join Gate — shown when un-onboarded user tries to join */}
      <JoinGateSheet
        open={showJoinGate}
        onClose={() => { setShowJoinGate(false); setPendingJoinId(null) }}
        onComplete={() => {
          setShowJoinGate(false)
          setIsOnboarded(true)
          toast.success('Welcome! 🎉')
          // Now actually join the session they tapped
          if (pendingJoinId) {
            const id = pendingJoinId
            setPendingJoinId(null)
            setTimeout(() => joinSession(id), 300)
          }
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

      {/* Payment Modal */}
      {paymentModalSession && (
        <PaymentModal
          session={{
            id: paymentModalSession.id,
            title: paymentModalSession.title,
            price: paymentModalSession.price,
            currency: paymentModalSession.currency,
            acceptPayNow: paymentModalSession.acceptPayNow ?? false,
            acceptStripe: paymentModalSession.acceptStripe ?? false,
            paynowQrImageUrl: paymentModalSession.paynowQrImageUrl,
            paynowName: paymentModalSession.paynowName,
            paynowPhoneNumber: paymentModalSession.paynowPhoneNumber,
          }}
          onClose={() => setPaymentModalSession(null)}
          onSuccess={() => { setPaymentModalSession(null); fetchSessions() }}
        />
      )}

      {/* ── Filters — sticky top bar ── */}
      <div className="sticky top-0 z-20 pt-[env(safe-area-inset-top,4px)]">
        <div className="bg-[#0D0D0D] px-3 pt-1 pb-2 space-y-1.5 border-b border-white/[0.06]">
          {/* Search bar */}
          <div className="relative mb-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Search run clubs, yoga, pickleball, or neighborhoods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-white/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
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
                const now = new Date()
                for (let i = 0; i < 7; i++) {
                  const d = new Date(now)
                  d.setDate(d.getDate() + i)
                  const dateStr = d.toLocaleDateString('en-CA', { timeZone: cityConfig.timezone })
                  const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmr' : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: cityConfig.timezone })
                  const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: cityConfig.timezone })
                  days.push(
                    <button
                      key={dateStr}
                      onClick={() => updateDateFilter(dateStr)}
                      className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-center transition-all min-w-[44px] ${
                        dateFilter === dateStr
                          ? 'bg-white text-black shadow-md'
                          : 'bg-[#1A1A1A] text-[#999999] shadow-none'
                      }`}
                    >
                      <span className="text-[10px] font-medium leading-tight">{dayLabel}</span>
                      <span className="text-[13px] font-bold leading-tight">{dateNum}</span>
                    </button>
                  )
                }
                return days
              })()}
            </div>
            <button
              onClick={() => setShowCreateSheet(true)}
              className="w-10 h-10 rounded-full bg-white shadow-lg shadow-white/20 flex items-center justify-center hover:bg-neutral-200 transition-colors active:scale-95 flex-shrink-0"
              aria-label="Create a session"
            >
              <Plus className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Row 2: Activity types */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => updateTypeFilter(f.value)}
                className={`flex-shrink-0 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all ${
                  typeFilter === f.value
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#1A1A1A]/80 text-[#999999] shadow-none hover:text-white'
                }`}
                title={f.label}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Row 3: Price + neighborhoods */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {PRICING_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => updatePricingFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  pricingFilter === f.value
                    ? 'bg-white text-black'
                    : 'bg-[#1A1A1A] text-[#999999] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="flex-shrink-0 px-2 py-1.5 text-[11px] font-semibold text-[#666666]">
              {cityConfig.name}
            </span>
            {cityConfig.neighborhoods.map((n) => (
              <button
                key={n.name}
                onClick={() => updateNeighborhoodFilter(n)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  neighborhoodFilter?.name === n.name
                    ? 'bg-white text-black'
                    : 'bg-[#1A1A1A] text-[#999999] hover:text-white'
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* ── List view — full-screen session cards ── */}
          <div className="flex-1 overflow-y-auto px-4 pb-24">
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
                    <p className="text-sm text-[#999999]">No crews or sessions for &apos;{searchQuery}&apos;</p>
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
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
                      {searchResults.map((session, i) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          currentUserId={currentUserId}
                          onJoin={joinSession}
                          onLeave={leaveSession}
                          joiningId={joiningId}
                          index={i}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
            <>
            {/* Community-first discovery */}
            {!loading && sessions.length > 0 && (
              <CrewDiscoveryBand
                crews={featuredCrews}
                peopleCount={discoveryStats.peopleCount}
                sessionCount={discoveryStats.sessionCount}
                freeCount={discoveryStats.freeCount}
                cityName={neighborhoodFilter?.name ?? cityConfig.name}
                activeTypeLabel={activeTypeLabel}
                onCreate={() => setShowCreateSheet(true)}
              />
            )}

            {/* Session count header */}
            {!loading && sessions.length > 0 && (
              <p className="text-xs font-medium text-[#666666] py-3 uppercase tracking-wider">
                {sessions.length} way{sessions.length !== 1 ? 's' : ''} to meet people{neighborhoodFilter ? ` in ${neighborhoodFilter.name}` : ' nearby'}
              </p>
            )}

            {loading ? (
              <div className="pt-3 space-y-8">
                {[0, 1].map((b) => (
                  <div key={b}>
                    <div className="flex items-center justify-between px-1 mb-3">
                      <div className="h-3 w-16 bg-[#1A1A1A] rounded shimmer" />
                      <div className="h-2.5 w-20 bg-[#1A1A1A] rounded shimmer" />
                    </div>
                    <div className="flex gap-3 overflow-hidden pb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="w-[180px] sm:w-[220px] flex-shrink-0">
                          <div className="aspect-[3/4] rounded-xl bg-[#1A1A1A] shimmer" />
                          <div className="mt-2.5 space-y-1.5">
                            <div className="h-2.5 w-16 bg-[#1A1A1A] rounded shimmer" />
                            <div className="h-3 w-3/4 bg-[#1A1A1A] rounded shimmer" />
                            <div className="h-2.5 w-1/2 bg-[#1A1A1A] rounded shimmer" />
                          </div>
                        </div>
                      ))}
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
              <div className="text-center py-16">
                <p className="text-sm font-medium text-[#999999]">No local sessions yet.</p>
                <p className="text-xs text-[#666666] mt-1">Try another date, clear filters, or host the first session for people nearby.</p>
                <button
                  onClick={() => setShowCreateSheet(true)}
                  className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black uppercase tracking-wider"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Start a session
                </button>
              </div>
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
                        {bucket.sessions.length} session{bucket.sessions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Horizontal scroll on mobile, grid on desktop */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
                      {bucket.sessions.map((session, i) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          currentUserId={currentUserId}
                          onJoin={joinSession}
                          onLeave={leaveSession}
                          joiningId={joiningId}
                          index={i}
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
                    <p className="text-xs text-[#666666] mb-3">That&apos;s everything nearby for now. Follow a crew or start the next plan.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowCreateSheet(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-black uppercase tracking-wider"
                      >
                        <Zap className="w-3 h-3" />
                        Start a session
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
        </>
      ) : (
        <>
          {/* ── Map view ── */}
          <div className="relative w-full" style={{ height: 'calc(100dvh - 140px)' }}>
            <VanillaMap
              center={userLocation ?? cityConfig.center}
              sessions={sessions}
              selectedPin={selectedPin}
              onPinClick={setSelectedPin}
              onMapClick={() => setSelectedPin(null)}
            />

            {/* Selected pin card overlay */}
            {selectedPin && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <SessionCard
                  session={selectedPin}
                  currentUserId={currentUserId}
                  onJoin={joinSession}
                  onLeave={leaveSession}
                  joiningId={joiningId}
                  index={0}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Floating Map/List toggle — above bottom nav ── */}
      <button
        onClick={() => { setViewMode(viewMode === 'list' ? 'map' : 'list'); setSelectedPin(null) }}
        className="fixed z-30 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider shadow-xl shadow-black/20 hover:bg-neutral-200 active:scale-95 transition-all"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {viewMode === 'list' ? (
          <><Map className="w-4 h-4" /> Map</>
        ) : (
          <><List className="w-4 h-4" /> List</>
        )}
      </button>

    </div>
  )
}

function SessionCard({
  session,
  currentUserId,
  onJoin,
  onLeave,
  joiningId,
  isHosting = false,
  index = 0,
}: {
  session: Session
  currentUserId: string | null
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  joiningId: string | null
  isHosting?: boolean
  index?: number
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const isPaid = session.activityMode === 'P2P_PAID'
  const priceDisplay = isPaid ? `$${(session.price / 100).toFixed(0)}` : 'Free'

  const displayName = session.community?.name ?? session.host?.name ?? 'Someone'
  const communityLogo = session.community?.logoImage
  const hostAvatar = session.host?.imageUrl
  const hostIsReal = session.host?.name && session.host.name !== 'sweatbuddies' && session.host.name !== 'SweatBuddies'
  const avatarSrc = communityLogo || (hostIsReal ? hostAvatar : null)

  const emoji = pinEmoji(session.categorySlug ?? 'other')

  return (
    <motion.div
      id={`session-${session.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        href={`/activities/${session.id}`}
        className="group block w-[180px] sm:w-auto flex-shrink-0 sm:flex-shrink snap-start"
      >
        {/* Session image — contains full image without cropping */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#111111]">
          {session.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.imageUrl} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          ) : (
            /* Rich poster fallback — gradient bg + emoji + title + time */
            <div
              className="w-full h-full flex flex-col items-center justify-between p-4 text-center"
              style={{ background: `linear-gradient(145deg, ${(CATEGORY_GRADIENTS[session.categorySlug ?? 'other'] ?? CATEGORY_GRADIENTS.other)[0]}, ${(CATEGORY_GRADIENTS[session.categorySlug ?? 'other'] ?? CATEGORY_GRADIENTS.other)[1]})` }}
            >
              <div />
              <div>
                <span className="text-5xl drop-shadow-lg block mb-3">{emoji}</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider leading-snug line-clamp-3 drop-shadow-md">
                  {session.title}
                </h4>
              </div>
              <div className="w-full">
                <div className="border-t border-white/20 pt-2 mt-2">
                  <p className="text-[10px] text-white/70 uppercase tracking-widest font-medium">
                    {session.startTime ? format(new Date(session.startTime), 'EEE, MMM d · h:mm a') : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
          {isJoined && !isHosting && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-black uppercase tracking-wider">Going</span>
          )}
        </div>

        {/* Metadata below image — NOT overlaid */}
        <div className="mt-2.5 space-y-1">
          {/* Community badge */}
          {(session.community || avatarSrc) && (
            <div className="flex items-center gap-1.5">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : null}
              <span className="text-[11px] text-[#666666] truncate">{displayName}</span>
            </div>
          )}
          {/* Title */}
          <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-2">
            {session.title}
          </h3>
          {/* Price · Time · Rating */}
          <p className="text-[11px] text-[#666666] truncate">
            {priceDisplay} · {session.startTime ? getRelativeTime(session.startTime) : ''}
            {session.avgRating && session.reviewCount > 0 && (
              <span className="text-[11px] text-[#999999]">
                {' '}· ★ {session.avgRating.toFixed(1)} ({session.reviewCount})
              </span>
            )}
          </p>
        </div>
      </Link>
    </motion.div>
  )
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
