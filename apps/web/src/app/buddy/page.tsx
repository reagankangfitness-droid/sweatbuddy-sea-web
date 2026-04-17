'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Loader2, Zap, Map, List } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api'
import { PaymentModal } from '@/components/PaymentModal'
import { DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'
import { SessionFeedbackSheet } from '@/components/SessionFeedbackSheet'
import { BioPromptSheet } from '@/components/BioPromptSheet'
import { JoinGateSheet } from '@/components/JoinGateSheet'

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#666666]" /></div>}>
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
  const [dateFilter, setDateFilter] = useState('')
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [shareSession, setShareSession] = useState<Session | null>(null)
  const [selectedPin, setSelectedPin] = useState<Session | null>(null)
  const [feedbackSession, setFeedbackSession] = useState<{ id: string; title: string; hostId: string; hostName: string | null } | null>(null)
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  const [showJoinGate, setShowJoinGate] = useState(false)
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(true) // assume true until checked

  // View mode: list-first (default) or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')


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
        if (userLocation) {
          params.set('lat', String(userLocation.lat))
          params.set('lng', String(userLocation.lng))
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
    [typeFilter, pricingFilter, dateFilter, userLocation, router]
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
        // No redirect — let users see the feed first
        // Onboarding happens via join gate when they try to join a session
        if (data.user?.id) setCurrentUserId(data.user.id)
        setIsOnboarded(!!data.completed)
      }
    }
    loadInitialData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [typeFilter, pricingFilter, dateFilter, fetchSessions])

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
          router.push(`/e/${sessionId}`)
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
          {/* Row 1: Date strip */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
              {(() => {
                const days = []
                const now = new Date()
                for (let i = 0; i < 7; i++) {
                  const d = new Date(now)
                  d.setDate(d.getDate() + i)
                  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
                  const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmr' : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Singapore' })
                  const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Singapore' })
                  days.push(
                    <button
                      key={dateStr}
                      onClick={() => setDateFilter(dateFilter === dateStr ? '' : dateStr)}
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

          {/* Row 2: Category emojis */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(typeFilter === f.value ? '' : f.value)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all flex-shrink-0 ${
                  typeFilter === f.value
                    ? 'bg-white shadow-md scale-110'
                    : 'bg-[#1A1A1A]/80 shadow-none'
                }`}
                title={f.label}
              >
                {f.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* ── List view — full-screen session cards ── */}
          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {/* Session count header */}
            {!loading && sessions.length > 0 && (
              <p className="text-xs font-medium text-[#666666] py-3 uppercase tracking-wider">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} happening
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
                <div className="text-4xl mb-3">🏋️</div>
                <p className="text-sm font-medium text-[#999999]">Nothing nearby yet.</p>
                <p className="text-xs text-[#666666] mt-1">Be the reason someone shows up.</p>
                <button
                  onClick={() => setShowCreateSheet(true)}
                  className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black uppercase tracking-wider"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Start something
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
                    <p className="text-xs text-[#666666] mb-3">That&apos;s everything nearby.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowCreateSheet(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-black uppercase tracking-wider"
                      >
                        <Zap className="w-3 h-3" />
                        Start something
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
          </div>
        </>
      ) : (
        <>
          {/* ── Map view ── */}
          <div className="flex-1 relative min-h-0" style={{ height: 'calc(100dvh - 120px)' }}>
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
                {sessions.filter((s) => s.latitude && s.longitude).map((s) => (
                  <OverlayView
                    key={s.id}
                    position={{ lat: s.latitude!, lng: s.longitude! }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPin(selectedPin?.id === s.id ? null : s)
                      }}
                      className="cursor-pointer select-none relative"
                      style={{ transform: 'translate(-50%, -50%)' }}
                    >
                      <div className={`flex items-center justify-center rounded-full shadow-lg border-2 transition-all duration-150 ${
                        selectedPin?.id === s.id
                          ? 'w-12 h-12 text-2xl border-white scale-110 ring-2 ring-white/40'
                          : 'w-9 h-9 text-lg border-white/80 hover:scale-110'
                      } ${pinColor(s.categorySlug ?? 'other')}`}>
                        {pinEmoji(s.categorySlug ?? 'other')}
                      </div>
                      {s.host?.imageUrl ? (
                        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full overflow-hidden border-2 border-white shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.host.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : s.community?.logoImage ? (
                        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full overflow-hidden border-2 border-white shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.community.logoImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                      {s.attendeeCount > 0 && (
                        <div className="absolute -top-1 -left-1 min-w-[16px] h-[16px] rounded-full bg-white shadow-md flex items-center justify-center px-0.5">
                          <span className="text-[9px] font-bold text-black leading-none">{s.attendeeCount}</span>
                        </div>
                      )}
                    </div>
                  </OverlayView>
                ))}

                {userLocation && (
                  <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_LAYER}>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" style={{ transform: 'translate(-50%, -50%)' }} />
                  </OverlayView>
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#666666]" />
              </div>
            )}

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
          {/* Price · Time */}
          <p className="text-[11px] text-[#666666] truncate">
            {priceDisplay} · {session.startTime ? getRelativeTime(session.startTime) : ''}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
