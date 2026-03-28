'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Plus, Loader2, Crosshair, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { PaymentModal } from '@/components/PaymentModal'
import { DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'

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
  acceptPayNow?: boolean
  acceptStripe?: boolean
  paynowQrImageUrl?: string | null
  paynowName?: string | null
  paynowPhoneNumber?: string | null
}

// ─── Map constants ───────────────────────────────────────────────────────────

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

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
  const mapRef = useRef<google.maps.Map | null>(null)
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const { isLoaded: mapsLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY })
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [paymentModalSession, setPaymentModalSession] = useState<Session | null>(null)

  const [typeFilter, setTypeFilter] = useState('')
  const [pricingFilter, setPricingFilter] = useState('')
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [shareSession, setShareSession] = useState<Session | null>(null)
  const [selectedPin, setSelectedPin] = useState<Session | null>(null)

  // Sheet position: 'peek' (shows 1 card), 'half' (50%), 'full' (85%)
  const [sheetMode, setSheetMode] = useState<'peek' | 'half' | 'full'>('half')

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ tab: 'happening' })
        if (typeFilter) params.set('type', typeFilter)
        if (pricingFilter) params.set('pricing', pricingFilter)
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
    [typeFilter, pricingFilter, userLocation, router]
  )

  const [locationReady, setLocationReady] = useState(false)

  // Get user location on mount — resolve quickly with timeout fallback
  useEffect(() => {
    if (!navigator.geolocation) { setLocationReady(true); return }

    let settled = false
    const settle = () => { if (!settled) { settled = true; setLocationReady(true) } }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        settle()
      },
      () => settle(), // GPS denied
      { timeout: 3000, maximumAge: 60000 }
    )

    // Fallback: don't wait longer than 3s for GPS
    const timer = setTimeout(settle, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Fetch sessions once location is resolved (or timed out)
  useEffect(() => {
    if (!locationReady) return

    const loadInitialData = async () => {
      const [onboardingRes] = await Promise.allSettled([
        fetch('/api/user/p2p-onboarding').then((r) => r.ok ? r.json() : null),
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
  }, [locationReady, router])

  // Pan map to user location when it becomes available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation)
    }
  }, [userLocation])

  // Refetch when filters change
  useEffect(() => {
    setSessions([])
    fetchSessions()
  }, [typeFilter, pricingFilter, fetchSessions])

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
      toast.success("You're in! 🎉")
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

  const sheetHeight = sheetMode === 'full' ? '75%' : sheetMode === 'half' ? '20%' : '80px'

  return (
    <div className="fixed inset-0 bg-[#FFFBF8]">
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

      {/* ── Full-screen map background ── */}
      {mapsLoaded && GOOGLE_MAPS_API_KEY ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={userLocation ?? SINGAPORE_CENTER}
          zoom={12}
          onLoad={(map) => { mapRef.current = map; if (userLocation) map.panTo(userLocation) }}
          onClick={() => setSelectedPin(null)}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            styles: DARK_MAP_STYLES,
            clickableIcons: false,
            gestureHandling: 'greedy',
          }}
        >
          {/* Session pins from main feed data */}
          {sessions.filter((s) => s.latitude && s.longitude).map((s) => {
            return (
              <OverlayView
                key={s.id}
                position={{ lat: s.latitude!, lng: s.longitude! }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  onClick={(e) => { e.stopPropagation(); setSelectedPin(selectedPin?.id === s.id ? null : s); setSheetMode('peek') }}
                  className="cursor-pointer select-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`flex items-center justify-center rounded-full shadow-lg border-2 transition-all duration-150 ${
                    selectedPin?.id === s.id
                      ? 'w-12 h-12 text-2xl border-white scale-110 ring-2 ring-white/40'
                      : 'w-9 h-9 text-lg border-white/80 hover:scale-110'
                  } ${pinColor(s.categorySlug ?? 'other')}`}>
                    {pinEmoji(s.categorySlug ?? 'other')}
                  </div>
                </div>
              </OverlayView>
            )
          }).filter(Boolean)}

          {/* User location dot */}
          {userLocation && (
            <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_LAYER}>
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" style={{ transform: 'translate(-50%, -50%)' }} />
            </OverlayView>
          )}
        </GoogleMap>
      ) : (
        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
        </div>
      )}

      {/* ── Filter pills — top overlay ── */}
      <div className="absolute left-0 right-0 z-20 pt-[env(safe-area-inset-top,8px)]" style={{ top: 0 }}>
        <div className="pt-2 pb-2 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-[2px]">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(typeFilter === f.value ? '' : f.value)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                  typeFilter === f.value
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md'
                    : 'border-black/[0.06] bg-white/90 text-[#4A4A5A] hover:border-black/[0.12] backdrop-blur'
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recenter button ── */}
      <button
        onClick={() => {
          if (!mapRef.current) return
          mapRef.current.panTo(userLocation ?? SINGAPORE_CENTER)
          mapRef.current.setZoom(12)
        }}
        className="absolute right-4 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur border border-black/[0.06] flex items-center justify-center shadow-lg"
        style={{ top: 'calc(env(safe-area-inset-top, 8px) + 56px)' }}
        aria-label="Recenter"
      >
        <Crosshair className="w-5 h-5 text-[#4A4A5A]" />
      </button>

      {/* ── FAB — create session ── */}
      <button
        onClick={() => setShowCreateSheet(true)}
        className="absolute right-4 z-20 w-14 h-14 rounded-full bg-[#1A1A1A] shadow-xl flex items-center justify-center hover:bg-black transition-colors active:scale-95"
        style={{ top: 'calc(env(safe-area-inset-top, 8px) + 112px)' }}
        aria-label="Create a session"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* ── Selected pin detail card ── */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            key="pin-detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 right-4 z-25"
            style={{ bottom: 'calc(72px + 20% + 12px)' }}
          >
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xl p-4">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${pinColor(selectedPin.categorySlug ?? 'other')}`}>
                  <span className="text-xl">{pinEmoji(selectedPin.categorySlug ?? 'other')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/activities/${selectedPin.id}`} className="text-sm font-semibold text-[#1A1A1A] leading-snug line-clamp-1 block tracking-tight">
                    {selectedPin.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#71717A]">
                    {selectedPin.startTime && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getUrgencyStyle(selectedPin.startTime)}`}>
                        {getRelativeTime(selectedPin.startTime)}
                      </span>
                    )}
                    {(selectedPin.address || selectedPin.city) && (
                      <span className="truncate text-[#9A9AAA]">
                        {formatAddress(selectedPin.address ?? selectedPin.city ?? '')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold text-[#4A4A5A]">
                      {selectedPin.attendeeCount > 0 ? `${selectedPin.attendeeCount} going 🔥` : 'Be the first! 👋'}
                    </span>
                    {selectedPin.maxPeople && selectedPin.attendeeCount < selectedPin.maxPeople && (
                      <span className="text-[10px] text-[#9A9AAA]">
                        {selectedPin.maxPeople - selectedPin.attendeeCount} spots left
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPin(null) }}
                  className="w-7 h-7 rounded-full bg-[#FFFBF8] flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-[#9A9AAA] text-xs">✕</span>
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { joinSession(selectedPin.id); setSelectedPin(null) }}
                  disabled={joiningId === selectedPin.id || selectedPin.isFull}
                  className="flex-1 py-2.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black disabled:opacity-40 transition-all"
                >
                  {joiningId === selectedPin.id ? 'Joining...' : selectedPin.isFull ? 'Full' : "I'm in →"}
                </button>
                <Link
                  href={`/activities/${selectedPin.id}`}
                  className="px-4 py-2.5 rounded-full border border-black/[0.06] bg-white text-xs font-semibold text-[#4A4A5A] hover:bg-[#FFFBF8] transition-all"
                >
                  Details
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draggable session list sheet ── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl border-t border-black/[0.06]"
        style={{ height: sheetHeight, marginBottom: '72px' }}
        animate={{ height: sheetHeight }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Drag handle + header */}
        <div
          className="cursor-grab active:cursor-grabbing"
          onClick={() => setSheetMode(sheetMode === 'peek' ? 'half' : sheetMode === 'half' ? 'full' : 'peek')}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-black/[0.08]" />
          </div>
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1A1A1A] tracking-tight">What&apos;s happening</h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            {!loading && (
              <span className="text-xs text-[#71717A] font-medium">
                {sessions.length === 0 ? 'No sessions' : `${sessions.length} nearby`}
              </span>
            )}
          </div>
        </div>

        {/* Session list — scrollable content */}
        <div className="overflow-y-auto px-4 pb-8" style={{ height: 'calc(100% - 52px)' }}>
          {loading ? (
            <div className="space-y-3 pt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-[#FFFBF8] rounded-2xl border border-black/[0.04] p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 bg-neutral-100 rounded" />
                      <div className="h-4 w-3/4 bg-neutral-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏋️</div>
              <p className="text-sm font-medium text-[#4A4A5A]">Nothing happening nearby — yet.</p>
              <p className="text-xs text-[#9A9AAA] mt-1">Be the first — start something.</p>
              <button
                onClick={() => setShowCreateSheet(true)}
                className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-[#1A1A1A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black"
              >
                <Zap className="w-3.5 h-3.5" />
                Post a session
              </button>
            </div>
          ) : (
            <div className="space-y-6 pt-1">
              {bucketSessions(sessions).map((bucket) => (
                <div key={bucket.key}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    {bucket.key === 'now' && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
                      {bucket.label}
                    </h3>
                  </div>
                  <div className="space-y-2.5">
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
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                </button>
              )}

              {sessions.length > 0 && sessions.length < 6 && !nextCursor && (
                <div className="text-center py-6 border-t border-black/[0.04]">
                  <p className="text-xs text-[#9A9AAA] mb-3">That&apos;s everything nearby.</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setShowCreateSheet(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      <Zap className="w-3 h-3" />
                      Post a session
                    </button>
                    <Link
                      href="/communities"
                      className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-white px-3.5 py-2 text-xs font-semibold text-[#4A4A5A]"
                    >
                      Browse crews
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

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
          <div className="flex items-center gap-2 mt-3 text-xs">
            {session.startTime && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${getUrgencyStyle(session.startTime)}`}>
                {getRelativeTime(session.startTime)}
              </span>
            )}
            {(session.address || session.city) && (
              <span className="flex items-center gap-1 min-w-0 text-[#9A9AAA]">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{formatAddress(session.address ?? session.city ?? '')}</span>
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
                {session.attendeeCount > 0
                  ? `${session.attendeeCount} going 🔥`
                  : session.community
                    ? `${session.community.name} crew`
                    : 'Be the first! 👋'}
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
