'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Users, Plus, Loader2, Calendar, ChevronRight, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentModal } from '@/components/PaymentModal'

interface Host {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
  sessionsHostedCount: number
  fitnessLevel: string | null
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}>
      <BuddyPageInner />
    </Suspense>
  )
}

function BuddyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'happening' | 'mine'>(
    searchParams.get('tab') === 'mine' ? 'mine' : 'happening'
  )
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

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ tab })
        if (typeFilter) params.set('type', typeFilter)
        if (fitnessFilter) params.set('fitnessLevel', fitnessFilter)
        if (pricingFilter) params.set('pricing', pricingFilter)
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
    [tab, typeFilter, fitnessFilter, pricingFilter, router]
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
            router.replace('/onboarding/p2p')
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
  }, [router, fetchSessions])

  // Sync tab state when URL changes (e.g. nav link click while already on page)
  useEffect(() => {
    const urlTab = searchParams.get('tab') === 'mine' ? 'mine' : 'happening'
    setTab(urlTab)
  }, [searchParams])

  useEffect(() => {
    setSessions([])
    setHosting([])
    setAttending([])
    fetchSessions()
  }, [tab, typeFilter, fitnessFilter, pricingFilter, fetchSessions])

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
    <div className="min-h-screen bg-white dark:bg-neutral-950">
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
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Sessions</h1>
          <p className="text-xs text-neutral-500">Find your next workout crew</p>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-3">
          {[
            { key: 'happening', label: 'Happening Soon' },
            { key: 'mine', label: 'My Sessions' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => router.push(t.key === 'mine' ? '/buddy?tab=mine' : '/buddy', { scroll: false })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* Filters (happening tab only) */}
        {tab === 'happening' && (
          <div className="py-4 flex gap-2 overflow-x-auto no-scrollbar">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none"
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
              className="shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none"
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
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  pricingFilter === f.value
                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : tab === 'happening' ? (
          <>
            {sessions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏋️</div>
                <p className="text-neutral-500 font-medium">No sessions yet</p>
                <p className="text-neutral-400 text-sm mt-1">Start the community — host the first one.</p>
                <Link
                  href="/buddy/host/new"
                  className="inline-flex items-center gap-2 mt-6 rounded-xl bg-black dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-black"
                >
                  <Plus className="w-4 h-4" />
                  Host a Session
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
                    className="w-full py-3 text-sm text-neutral-500 hover:text-neutral-700 flex items-center justify-center gap-2"
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
                className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
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
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
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
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
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
                <p className="text-neutral-500 font-medium">No sessions yet</p>
                <p className="text-neutral-400 text-sm mt-1">Host or join one to get started</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Link
                    href="/buddy/host/new"
                    className="rounded-xl bg-black dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-black"
                  >
                    Host a Session
                  </Link>
                  <button
                    onClick={() => setTab('happening')}
                    className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-5 py-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
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
      className="block rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Host avatar */}
          <div className="shrink-0">
            {session.host?.imageUrl ? (
              <Image
                src={session.host.imageUrl}
                alt={session.host.name ?? ''}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-500">
                {(session.host?.name ?? '?')[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-neutral-400">
                    {session.host?.name ?? 'Someone'}&apos;s session
                  </span>
                  {isHosting && (
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                      Hosting
                    </span>
                  )}
                  {isJoined && !isHosting && (
                    <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                      Going
                    </span>
                  )}
                  {isPast && (
                    <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
                      Past
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 truncate">
                  {session.title}
                </h3>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-sm font-semibold ${
                    isPaid ? 'text-neutral-900 dark:text-white' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {priceDisplay}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400 flex-wrap">
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
                <span className="capitalize text-neutral-300 dark:text-neutral-600">
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
                        className="rounded-full ring-1 ring-white dark:ring-neutral-900 object-cover"
                      />
                    ) : (
                      <div
                        key={a.id}
                        className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-neutral-900 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-medium text-neutral-500"
                      >
                        {(a.name ?? '?')[0]}
                      </div>
                    )
                  )}
                </div>
                {session.attendees.length > 5 && (
                  <span className="text-xs text-neutral-400">+{session.attendees.length - 5}</span>
                )}
              </div>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0 mt-1" />
        </div>

        {/* Action buttons */}
        {!isPast && !isHost && (
          <div className="mt-3 pt-3 border-t border-neutral-50 dark:border-neutral-800">
            {isJoined ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onLeave(session.id)
                }}
                className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
              >
                Leave session
              </button>
            ) : session.isFull ? (
              <span className="text-xs text-neutral-400">Session full</span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onJoin(session.id)
                }}
                disabled={joiningId === session.id}
                className="flex items-center gap-1.5 rounded-lg bg-black dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors"
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
