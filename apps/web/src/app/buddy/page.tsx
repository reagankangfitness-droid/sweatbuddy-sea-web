'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Users, Plus, Loader2, Calendar, ChevronRight, Lock, Map, List, Crosshair, X, Clock } from 'lucide-react'
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#9A9AAA]" /></div>}>
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
    [tab, typeFilter, fitnessFilter, pricingFilter, verifiedFilter, router]
  )

  // Fetch pending payments count for hosting tab notification
  useEffect(() => {
    fetch('/api/p2p/payments/pending')
      .then((res) => res.ok ? res.json() : { payments: [] })
      .then((data) => setPendingPaymentsCount(data.payments?.length ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Check onboarding status
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/user/p2p-onboarding')
        if (res.ok) {
          const data = await res.json()
          if (!data.completed) {
            const currentPath = window.location.pathname + window.location.search
            router.replace('/onboarding/p2p?redirect=' + encodeURIComponent(currentPath))
            return
          }
          setCurrentUserId(data.user?.id ?? null)
        }
      } catch {
        // ignore
      }
      fetchSessions()
    }
    checkOnboarding()
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

  // Get user location for map
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-[#1A1A1A]">Experiences</h1>
          <p className="text-xs text-[#9A9AAA]">Discover fitness &amp; wellness experiences</p>
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
                    : 'text-[#9A9AAA] hover:text-[#4A4A5A]'
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
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9A9AAA]">
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
                center={SINGAPORE_CENTER}
                zoom={12}
                onLoad={(map) => { mapRef.current = map }}
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
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A9AAA]" />
                    <span className="text-xs text-[#9A9AAA]">Loading…</span>
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
                            <X className="w-4 h-4 text-[#9A9AAA]" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5 text-sm text-[#9A9AAA] mb-4">
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
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* Filters (happening tab only) */}
        {tab === 'happening' && (
          <div className="py-4 flex gap-2 overflow-x-auto no-scrollbar">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by activity type"
              className="shrink-0 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-xs text-[#4A4A5A] focus:outline-none"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>

            <select
              value={fitnessFilter}
              onChange={(e) => setFitnessFilter(e.target.value)}
              aria-label="Filter by fitness level"
              className="shrink-0 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-xs text-[#4A4A5A] focus:outline-none"
            >
              {FITNESS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {[
              { value: '', label: 'All' },
              { value: 'free', label: '🆓 Free' },
              { value: 'paid', label: '💰 Paid' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setPricingFilter(f.value)}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-medium transition-colors ${
                  pricingFilter === f.value
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                    : 'border-black/[0.06] text-[#4A4A5A] hover:border-black/[0.12]'
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
            <Loader2 className="w-6 h-6 animate-spin text-[#9A9AAA]" />
          </div>
        ) : tab === 'happening' ? (
          <>
            {sessions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏋️</div>
                <p className="text-[#4A4A5A] font-medium">Nothing happening nearby — yet.</p>
                <p className="text-[#9A9AAA] text-sm mt-1">Check back soon, or start something.</p>
                <Link
                  href="/buddy/host/new"
                  className="inline-flex items-center gap-2 mt-6 rounded-full bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  <Plus className="w-4 h-4" />
                  Create a Session
                </Link>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    currentUserId={currentUserId}
                    onJoin={joinSession}
                    onLeave={leaveSession}
                    joiningId={joiningId}
                  />
                ))}
                {nextCursor && (
                  <button
                    onClick={() => fetchSessions(nextCursor)}
                    disabled={loadingMore}
                    className="w-full py-3 text-sm text-[#9A9AAA] hover:text-[#4A4A5A] flex items-center justify-center gap-2"
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
                <h2 className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">
                  Hosting
                </h2>
                <div className="space-y-3">
                  {hosting.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      currentUserId={currentUserId}
                      onJoin={joinSession}
                      onLeave={leaveSession}
                      joiningId={joiningId}
                      isHosting
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Attending */}
            {attending.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">
                  Attending
                </h2>
                <div className="space-y-3">
                  {attending.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      currentUserId={currentUserId}
                      onJoin={joinSession}
                      onLeave={leaveSession}
                      joiningId={joiningId}
                    />
                  ))}
                </div>
              </div>
            )}

            {hosting.length === 0 && attending.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">👀</div>
                <p className="text-[#4A4A5A] font-medium">No sessions yet.</p>
                <p className="text-[#9A9AAA] text-sm mt-1">Join a community and you&apos;ll never have an empty week.</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Link
                    href="/buddy/host/new"
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
}: {
  session: Session
  currentUserId: string | null
  onJoin: (id: string) => void
  onLeave: (id: string) => void
  joiningId: string | null
  isHosting?: boolean
}) {
  const isHost = session.host?.id === currentUserId
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const isPast = session.startTime ? new Date(session.startTime) < new Date() : false
  const isPaid = session.activityMode === 'P2P_PAID'
  const priceDisplay = isPaid ? `$${(session.price / 100).toFixed(0)}` : 'Free'

  return (
    <Link
      href={`/activities/${session.id}`}
      className="block rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-sm hover:border-black/[0.12] transition-colors"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar: community logo → host avatar (if host name matches community) → community initial → fallback */}
          <div className="shrink-0">
            {(() => {
              const communityLogo = session.community?.logoImage
              const hostAvatar = session.host?.imageUrl
              const hostIsRealOrganizer = session.host?.name && session.host.name !== 'sweatbuddies' && session.host.name !== 'SweatBuddies'
              const displayName = session.community?.name ?? session.host?.name ?? '?'

              if (communityLogo) return (
                <Image src={communityLogo} alt={displayName} width={40} height={40} className="rounded-full object-cover" />
              )
              if (hostAvatar && hostIsRealOrganizer) return (
                <Image src={hostAvatar} alt={displayName} width={40} height={40} className="rounded-full object-cover" />
              )
              return (
                <div className="w-10 h-10 rounded-full bg-[#FFFBF8] flex items-center justify-center text-sm font-bold text-[#4A4A5A]">
                  {displayName[0]}
                </div>
              )
            })()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[#9A9AAA]">
                    {session.community?.name ? `by ${session.community.name}` : `${session.host?.name ?? 'Someone'}\u2019s session`}
                  </span>
                  {session.host?.isCoach && session.host?.coachVerificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-500">✓ PRO</span>
                  )}
                  {isHosting && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      Hosting
                    </span>
                  )}
                  {isJoined && !isHosting && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                      Going
                    </span>
                  )}
                  {isPast && (
                    <span className="text-xs bg-[#FFFBF8] text-[#9A9AAA] px-2 py-0.5 rounded-full">
                      Past
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mt-0.5 truncate">
                  {session.title}
                </h3>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-sm font-semibold ${
                    isPaid ? 'text-[#1A1A1A]' : 'text-green-600'
                  }`}
                >
                  {priceDisplay}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 text-xs text-[#9A9AAA] flex-wrap">
              {session.startTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(session.startTime), 'EEE, MMM d · h:mm a')}
                </span>
              )}
              {session.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {session.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {session.attendeeCount}
                {session.maxPeople ? `/${session.maxPeople}` : ''} going
              </span>
              {session.fitnessLevel && (
                <span className="capitalize text-[#9A9AAA]">
                  {session.fitnessLevel.toLowerCase()}
                </span>
              )}
              {session.requiresApproval && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Lock className="w-3 h-3" />
                  Approval required
                </span>
              )}
            </div>

            {/* Attendee avatars */}
            {session.attendees.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex -space-x-1.5">
                  {session.attendees.slice(0, 5).map((a) =>
                    a.imageUrl ? (
                      <Image
                        key={a.id}
                        src={a.imageUrl}
                        alt={a.name ?? ''}
                        width={20}
                        height={20}
                        className="rounded-full ring-1 ring-white object-cover"
                      />
                    ) : (
                      <div
                        key={a.id}
                        className="w-5 h-5 rounded-full ring-1 ring-white bg-[#FFFBF8] flex items-center justify-center text-[9px] font-medium text-[#9A9AAA]"
                      >
                        {(a.name ?? '?')[0]}
                      </div>
                    )
                  )}
                </div>
                {session.attendees.length > 5 && (
                  <span className="text-xs text-[#9A9AAA]">+{session.attendees.length - 5}</span>
                )}
              </div>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-[#9A9AAA] shrink-0 mt-1" />
        </div>

        {/* Action buttons */}
        {!isPast && !isHost && (
          <div className="mt-3 pt-3 border-t border-black/[0.06]">
            {isJoined ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onLeave(session.id)
                }}
                className="text-xs text-[#9A9AAA] hover:text-red-500 transition-colors"
              >
                Leave session
              </button>
            ) : session.isFull ? (
              <span className="text-xs text-[#9A9AAA]">Session full</span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onJoin(session.id)
                }}
                disabled={joiningId === session.id}
                className="flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
              >
                {joiningId === session.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isPaid ? (
                  'Buy Ticket'
                ) : (
                  'Join Free'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
