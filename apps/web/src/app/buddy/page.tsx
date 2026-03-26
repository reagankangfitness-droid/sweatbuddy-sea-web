'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Users, Plus, Loader2, Calendar, ChevronRight, Map, Crosshair, X, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { PaymentModal } from '@/components/PaymentModal'
import { DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

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
  acceptPayNow?: boolean
  acceptStripe?: boolean
  paynowQrImageUrl?: string | null
  paynowName?: string | null
  paynowPhoneNumber?: string | null
}

// ─── Map constants ───────────────────────────────────────────────────────────

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface MapSession {
  id: string
  title: string
  categorySlug: string
  latitude: number
  longitude: number
  startTime: string | null
  address: string | null
  city: string
  price: number
  maxPeople: number | null
  requiresApproval: boolean
  attendeeCount: number
  isFull: boolean
  host: { id: string; name: string | null; imageUrl: string | null; slug: string | null }
}

interface MapCommunity {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logoImage: string | null
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  memberCount: number
  instagramHandle: string | null
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

interface TimeBucket {
  key: string
  label: string
  sessions: Session[]
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
  if (diffHrs < 24) {
    const hour = start.getHours()
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `Today ${h}${ampm}`
  }
  return format(start, 'EEE h:mm a')
}

function getUrgencyStyle(startTime: string): string {
  const diffMs = new Date(startTime).getTime() - Date.now()
  const diffHrs = diffMs / (1000 * 60 * 60)
  if (diffHrs < 0) return 'bg-red-500/90 text-white animate-pulse'
  if (diffHrs < 2) return 'bg-red-500/90 text-white'
  if (diffHrs < 6) return 'bg-amber-400/90 text-white'
  return 'bg-[#1A1A1A]/70 text-white'
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
  if (happeningNow.length) buckets.push({ key: 'now', label: '🔴  Happening now', sessions: happeningNow })
  if (nextFewHours.length) buckets.push({ key: 'soon', label: '🟠  Next few hours', sessions: nextFewHours })
  if (today.length) buckets.push({ key: 'today', label: '🟡  Later today', sessions: today })
  if (tomorrow.length) buckets.push({ key: 'tomorrow', label: '📅  Tomorrow', sessions: tomorrow })
  if (later.length) buckets.push({ key: 'later', label: 'This week & beyond', sessions: later })
  return buckets
}

const CATEGORY_COLORS: Record<string, string> = {
  running: 'bg-orange-500', pickleball: 'bg-green-500', yoga: 'bg-purple-500',
  bootcamp: 'bg-red-500', gym: 'bg-blue-500', cycling: 'bg-yellow-500',
  badminton: 'bg-emerald-500', combat_fitness: 'bg-rose-600', pilates: 'bg-pink-500',
  hiking: 'bg-lime-600', swimming: 'bg-cyan-500', padel: 'bg-teal-500',
  dance_fitness: 'bg-fuchsia-500', volleyball: 'bg-amber-500', basketball: 'bg-orange-600',
  cold_plunge: 'bg-sky-500', other: 'bg-neutral-500',
}

const EMOJI_MAP = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.key, t.emoji]))
function pinEmoji(slug: string) { return EMOJI_MAP[slug] ?? '🏅' }
function pinColor(slug: string) { return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.other }

// ─── Fitness / type filters ───────────────────────────────────────────────────

const FITNESS_FILTERS = [
  { value: '', label: 'All levels' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
]

const TYPE_FILTERS = [
  { value: '', label: 'All types', emoji: '🏃' },
  { value: 'running', label: 'Running', emoji: '🏃' },
  { value: 'cycling', label: 'Cycling', emoji: '🚴' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'strength', label: 'Strength', emoji: '🏋️' },
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'bootcamp', label: 'Bootcamp', emoji: '🎖️' },
  { value: 'hiit', label: 'HIIT', emoji: '⚡' },
  { value: 'pilates', label: 'Pilates', emoji: '🦢' },
]

export default function BuddyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#71717A]" /></div>}>
      <BuddyPageInner />
    </Suspense>
  )
}

function BuddyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'happening' | 'map' | 'mine'>(
    searchParams.get('tab') === 'mine' ? 'mine' : searchParams.get('tab') === 'map' ? 'map' : 'happening'
  )
  const mapRef = useRef<google.maps.Map | null>(null)
  const [mapSessions, setMapSessions] = useState<MapSession[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  const [mapSelected, setMapSelected] = useState<MapSession | null>(null)
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const { isLoaded: mapsLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY })
  const [sessions, setSessions] = useState<Session[]>([])
  const [hosting, setHosting] = useState<Session[]>([])
  const [attending, setAttending] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [paymentModalSession, setPaymentModalSession] = useState<Session | null>(null)

  const [typeFilter, setTypeFilter] = useState('')
  const [fitnessFilter, setFitnessFilter] = useState('')
  const [pricingFilter, setPricingFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState(false)

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ tab })
        if (typeFilter) params.set('type', typeFilter)
        if (fitnessFilter) params.set('fitnessLevel', fitnessFilter)
        if (pricingFilter) params.set('pricing', pricingFilter)
        if (verifiedFilter) params.set('verified', 'true')
        if (cursor) params.set('cursor', cursor)
        if (userLocation) {
          params.set('lat', String(userLocation.lat))
          params.set('lng', String(userLocation.lng))
        }

        const res = await fetch(`/api/buddy/sessions?${params}`)
        if (res.status === 401) {
          router.push('/sign-in')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()

        if (tab === 'mine') {
          setHosting(data.hosting ?? [])
          setAttending(data.attending ?? [])
        } else {
          if (cursor) {
            setSessions((prev) => [...prev, ...(data.sessions ?? [])])
          } else {
            setSessions(data.sessions ?? [])
          }
          setNextCursor(data.nextCursor ?? null)
          if (data.currentUserId) setCurrentUserId(data.currentUserId)
        }
      } catch {
        toast.error('Failed to load sessions')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [tab, typeFilter, fitnessFilter, pricingFilter, verifiedFilter, userLocation, router]
  )

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // GPS denied — will show all sessions
    )
  }, [])

  // Parallelize initial data fetches — don't block sessions on onboarding check
  useEffect(() => {
    const loadInitialData = async () => {
      const [onboardingRes] = await Promise.allSettled([
        fetch('/api/user/p2p-onboarding').then((r) => r.ok ? r.json() : null),
        fetch('/api/p2p/payments/pending')
          .then((r) => r.ok ? r.json() : { payments: [] })
          .then((data) => setPendingPaymentsCount(data.payments?.length ?? 0))
          .catch(() => {}),
        fetchSessions(),
      ])

      if (onboardingRes.status === 'fulfilled' && onboardingRes.value) {
        const data = onboardingRes.value
        if (!data.completed) {
          const currentPath = window.location.pathname + window.location.search
          router.replace('/onboarding/p2p?redirect=' + encodeURIComponent(currentPath))
          return
        }
        setCurrentUserId(data.user?.id ?? null)
      }
    }
    loadInitialData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Sync tab state when URL changes
  useEffect(() => {
    const t = searchParams.get('tab')
    setTab(t === 'mine' ? 'mine' : t === 'map' ? 'map' : 'happening')
  }, [searchParams])

  // Fetch map sessions when map tab is active
  useEffect(() => {
    if (tab !== 'map') return
    setMapLoading(true)
    fetch('/api/discover/sessions')
      .then((r) => r.ok ? r.json() : { sessions: [] })
      .then((d) => setMapSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setMapLoading(false))
  }, [tab])

  // Pan map to user location when it becomes available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation)
    }
  }, [userLocation])

  useEffect(() => {
    setSessions([])
    setHosting([])
    setAttending([])
    fetchSessions()
  }, [tab, typeFilter, fitnessFilter, pricingFilter, verifiedFilter, fetchSessions])

  async function joinSession(sessionId: string) {
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
          router.push(`/e/${sessionId}`)
          return
        }
        toast.error(data.error || 'Failed to join')
        return
      }
      toast.success("You're in!")
      setTimeout(() => {
        toast('Know someone who\'d enjoy this?', {
          action: {
            label: 'Share',
            onClick: () => {
              const url = `${window.location.origin}/activities/${sessionId}`
              if (navigator.share) {
                navigator.share({ title: 'Check this out on SweatBuddies', url })
              } else {
                navigator.clipboard.writeText(url)
                toast.success('Link copied!')
              }
            },
          },
          duration: 5000,
        })
      }, 1500)
      fetchSessions()
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
    <div className="min-h-screen bg-[#FFFBF8]">
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
          onSuccess={() => {
            setPaymentModalSession(null)
            fetchSessions()
          }}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-black/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#1A1A1A] tracking-tight">What&apos;s happening</h1>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-3" role="tablist" aria-label="Session views">
          {[
            { key: 'happening', label: 'Sessions' },
            { key: 'map', label: 'Map', icon: Map },
            { key: 'mine', label: 'My Sessions' },
          ].map((t) => {
            const href = t.key === 'mine' ? '/buddy?tab=mine' : t.key === 'map' ? '/buddy?tab=map' : '/buddy'
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`tabpanel-${t.key}`}
                onClick={() => router.push(href, { scroll: false })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#71717A] hover:text-[#4A4A5A]'
                }`}
              >
                {t.icon && <t.icon className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Map Tab ── */}
      {tab === 'map' && (
        <div id="tabpanel-map" role="tabpanel" aria-labelledby="tabpanel-map" className="relative" style={{ height: 'calc(100dvh - 128px)' }}>
          {!GOOGLE_MAPS_API_KEY || !mapsLoaded ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#71717A]">
              {!GOOGLE_MAPS_API_KEY ? (
                <p className="text-sm">Maps not configured.</p>
              ) : (
                <Loader2 className="w-6 h-6 animate-spin" />
              )}
            </div>
          ) : (
            <>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={userLocation ?? SINGAPORE_CENTER}
                zoom={12}
                onLoad={(map) => { mapRef.current = map; if (userLocation) map.panTo(userLocation) }}
                onClick={() => setMapSelected(null)}
                options={{
                  disableDefaultUI: true,
                  styles: DARK_MAP_STYLES,
                  clickableIcons: false,
                  gestureHandling: 'greedy',
                }}
              >
                {mapSessions.map((s) => (
                  <OverlayView
                    key={s.id}
                    position={{ lat: s.latitude, lng: s.longitude }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      onClick={(e) => { e.stopPropagation(); setMapSelected(s) }}
                      className="cursor-pointer select-none"
                      style={{ transform: 'translate(-50%, -50%)' }}
                    >
                      <div className={`flex items-center justify-center rounded-full shadow-lg border-2 border-white transition-all duration-150 ${
                        mapSelected?.id === s.id ? 'w-12 h-12 text-2xl scale-110 ring-2 ring-white/40' : 'w-9 h-9 text-lg hover:scale-110'
                      } ${pinColor(s.categorySlug)}`}>
                        {pinEmoji(s.categorySlug)}
                      </div>
                    </div>
                  </OverlayView>
                ))}

                {userLocation && (
                  <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_LAYER}>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" style={{ transform: 'translate(-50%, -50%)' }} />
                  </OverlayView>
                )}
              </GoogleMap>

              {/* Loading / count badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                {mapLoading ? (
                  <div className="bg-white/80 backdrop-blur border border-black/[0.06] px-3 py-1.5 rounded-full flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71717A]" />
                    <span className="text-xs text-[#71717A]">Loading…</span>
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur border border-black/[0.06] text-[#4A4A5A] text-xs font-medium px-3 py-1.5 rounded-full">
                    {mapSessions.length === 0 ? 'No sessions nearby' : `${mapSessions.length} session${mapSessions.length !== 1 ? 's' : ''} nearby`}
                  </div>
                )}
              </div>

              {/* Recenter */}
              <button
                onClick={() => {
                  if (!mapRef.current) return
                  mapRef.current.panTo(userLocation ?? SINGAPORE_CENTER)
                  mapRef.current.setZoom(12)
                }}
                className="absolute bottom-24 right-4 z-10 w-11 h-11 rounded-full bg-white/95 backdrop-blur border border-black/[0.06] flex items-center justify-center shadow-lg"
                aria-label="Recenter"
              >
                <Crosshair className="w-5 h-5 text-[#4A4A5A]" />
              </button>

              {/* Session detail sheet */}
              <AnimatePresence>
                {mapSelected && (
                  <motion.div
                    key="buddy-map-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    className="absolute bottom-0 left-0 right-0 z-20"
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => { if (info.offset.y > 80) setMapSelected(null) }}
                  >
                    <div className="bg-white border-t border-black/[0.06] rounded-t-2xl shadow-2xl">
                      <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-black/[0.06]" />
                      </div>
                      <div className="px-4 pb-6 pt-2">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{pinEmoji(mapSelected.categorySlug)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${mapSelected.price === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-[#FFFBF8] text-[#1A1A1A]'}`}>
                                {mapSelected.price === 0 ? 'FREE' : `$${mapSelected.price}`}
                              </span>
                            </div>
                            <Link href={`/activities/${mapSelected.id}`} className="text-base font-bold text-[#1A1A1A] leading-snug line-clamp-2 block">
                              {mapSelected.title}
                            </Link>
                          </div>
                          <button onClick={() => setMapSelected(null)} aria-label="Close session details" className="w-8 h-8 rounded-full bg-[#FFFBF8] flex items-center justify-center flex-shrink-0">
                            <X className="w-4 h-4 text-[#71717A]" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5 text-sm text-[#71717A] mb-4">
                          {mapSelected.startTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(mapSelected.startTime), 'EEE, MMM d · h:mm a')}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            {mapSelected.address ?? mapSelected.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {mapSelected.attendeeCount} going{mapSelected.maxPeople ? ` · ${mapSelected.maxPeople - mapSelected.attendeeCount} spots left` : ''}
                          </div>
                        </div>
                        <Link href={`/activities/${mapSelected.id}`} className="block w-full py-3.5 rounded-full bg-[#1A1A1A] text-white text-sm font-bold text-center hover:bg-black transition-colors">
                          {mapSelected.requiresApproval ? 'Request to join →' : "I'm going →"}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </>
          )}
        </div>
      )}

      <div id={`tabpanel-${tab === 'mine' ? 'mine' : 'happening'}`} role="tabpanel" aria-labelledby={`tabpanel-${tab === 'mine' ? 'mine' : 'happening'}`} className={tab === 'map' ? 'hidden' : ''}>
      <div className="max-w-2xl mx-auto px-4 pb-32">
        {/* Filters (happening tab only) */}
        {tab === 'happening' && (
          <div className="py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(typeFilter === f.value ? '' : f.value)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                  typeFilter === f.value
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md'
                    : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}

            <div className="shrink-0 w-px h-5 self-center bg-black/[0.06] mx-0.5" />

            {[
              { value: '', label: 'All prices' },
              { value: 'free', label: 'Free' },
              { value: 'paid', label: 'Paid' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setPricingFilter(f.value)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                  pricingFilter === f.value
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md'
                    : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Verified hosts filter — hidden for now
            <button
              onClick={() => setVerifiedFilter((v) => !v)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-medium transition-colors ${
                verifiedFilter
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : 'border-black/[0.06] text-[#4A4A5A] hover:border-black/[0.12]'
              }`}
            >
              ✓ Verified hosts
            </button>
            */}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
          </div>
        ) : tab === 'happening' ? (
          <>
            {sessions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏋️</div>
                <p className="text-[#4A4A5A] font-medium">Nothing happening nearby — yet.</p>
                <p className="text-[#71717A] text-sm mt-1">Check back soon, or start something.</p>
                <Link
                  href="/buddy/host/quick"
                  className="inline-flex items-center gap-2 mt-6 rounded-full bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  <Plus className="w-4 h-4" />
                  Create a Session
                </Link>
              </div>
            ) : (
              <div className="space-y-8 pt-4">
                {bucketSessions(sessions).map((bucket) => (
                  <div key={bucket.key}>
                    <div className="flex items-center gap-2 mb-4 px-1">
                      {bucket.key === 'now' && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                      )}
                      <h2 className="text-sm font-bold text-[#1A1A1A] tracking-tight">
                        {bucket.label}
                      </h2>
                    </div>
                    <div className="space-y-3">
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
                    className="w-full py-3 text-sm text-[#71717A] hover:text-[#4A4A5A] flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Load more'
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          /* My Sessions tab */
          <div className="space-y-6 pt-4">
            {/* Pending payments alert */}
            {pendingPaymentsCount > 0 && (
              <Link
                href="/buddy/payments"
                className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <span>
                  ⏳ {pendingPaymentsCount} payment{pendingPaymentsCount !== 1 ? 's' : ''} waiting for verification
                </span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Hosting */}
            {hosting.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#1A1A1A] tracking-tight mb-4">
                  Hosting
                </h2>
                <div className="space-y-3">
                  {hosting.map((session, i) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      currentUserId={currentUserId}
                      onJoin={joinSession}
                      onLeave={leaveSession}
                      joiningId={joiningId}
                      isHosting
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Attending */}
            {attending.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#1A1A1A] tracking-tight mb-4">
                  Attending
                </h2>
                <div className="space-y-3">
                  {attending.map((session, i) => (
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
            )}

            {hosting.length === 0 && attending.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">👀</div>
                <p className="text-[#4A4A5A] font-medium">No sessions yet.</p>
                <p className="text-[#71717A] text-sm mt-1">Join a community and you&apos;ll never have an empty week.</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Link
                    href="/buddy/host/quick"
                    className="rounded-full bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                  >
                    Create a Session
                  </Link>
                  <button
                    onClick={() => setTab('happening')}
                    className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[#1A1A1A]"
                  >
                    Browse Sessions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
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
  const isHost = currentUserId === session.host?.id

  const displayName = session.community?.name ?? session.host?.name ?? 'Someone'
  const communityLogo = session.community?.logoImage
  const hostAvatar = session.host?.imageUrl
  const hostIsReal = session.host?.name && session.host.name !== 'sweatbuddies' && session.host.name !== 'SweatBuddies'
  const avatarSrc = communityLogo || (hostIsReal ? hostAvatar : null)

  const emoji = pinEmoji(session.categorySlug ?? 'other')

  const spotsLeft = session.maxPeople ? session.maxPeople - session.attendeeCount : null
  const almostFull = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= Math.ceil((session.maxPeople ?? 0) * 0.3)
  const isFull = spotsLeft !== null && spotsLeft <= 0
  const isJoining = joiningId === session.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="group bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
        <Link href={`/activities/${session.id}`} className="block p-4">
          {/* Row 1: Emoji + Title + Time badge */}
          <div className="flex items-start gap-3">
            {/* Large emoji */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${pinColor(session.categorySlug ?? 'other')}`}>
              <span className="text-2xl">{emoji}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {/* Host/Community name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {avatarSrc ? (
                    <Image src={avatarSrc} alt={displayName} width={16} height={16} className="rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center text-[8px] font-bold text-[#71717A] flex-shrink-0">
                      {displayName[0]}
                    </div>
                  )}
                  <span className="text-xs text-[#71717A] truncate">{displayName}</span>
                </div>

                {/* Status pills */}
                {isJoined && !isHosting && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Going
                  </span>
                )}
                {isHosting && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    Hosting
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-[15px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2 tracking-tight">
                {session.title}
              </h3>
            </div>

            {/* Price badge */}
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
              isPaid
                ? 'bg-[#FFFBF8] text-[#1A1A1A] border border-black/[0.06]'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {priceDisplay}
            </span>
          </div>

          {/* Row 2: Time + Location */}
          <div className="flex items-center gap-3 mt-3 text-xs text-[#71717A]">
            {session.startTime && (
              <span className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getUrgencyStyle(session.startTime)}`}>
                  {getRelativeTime(session.startTime)}
                </span>
                <span>{format(new Date(session.startTime), 'EEE, MMM d')}</span>
              </span>
            )}
            {(session.address || session.city) && (
              <span className="flex items-center gap-1 truncate text-[#9A9AAA]">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{session.address ?? session.city}</span>
              </span>
            )}
          </div>

          {/* Row 3: Avatars + Social proof + Spots */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {/* Avatar stack */}
              {session.attendees.length > 0 && (
                <div className="flex -space-x-2">
                  {session.attendees.slice(0, 5).map((a) =>
                    a.imageUrl ? (
                      <Image
                        key={a.id}
                        src={a.imageUrl}
                        alt={a.name ?? ''}
                        width={28}
                        height={28}
                        className="rounded-full ring-2 ring-white object-cover"
                      />
                    ) : (
                      <div
                        key={a.id}
                        className="w-7 h-7 rounded-full ring-2 ring-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-[#71717A]"
                      >
                        {(a.name ?? '?')[0]}
                      </div>
                    )
                  )}
                </div>
              )}
              <span className="text-xs font-semibold text-[#4A4A5A]">
                {session.attendeeCount > 0 ? `${session.attendeeCount} going 🔥` : 'Be the first!'}
              </span>
            </div>

            {/* Spots left badge */}
            {almostFull && !isFull && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
              </span>
            )}
            {isFull && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
                Full
              </span>
            )}
          </div>
        </Link>

        {/* Row 4: Inline action button */}
        {!isHost && !isHosting && !isFull && (
          <div className="px-4 pb-4 pt-0">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isJoined) {
                  onLeave(session.id)
                } else {
                  onJoin(session.id)
                }
              }}
              disabled={isJoining}
              className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all ${
                isJoined
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                  : 'bg-[#1A1A1A] text-white hover:bg-black'
              }`}
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining...</span>
              ) : isJoined ? (
                "You're in ✓"
              ) : (
                "I'm in →"
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
