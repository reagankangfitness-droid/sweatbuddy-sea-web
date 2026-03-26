'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  GoogleMap,
  useLoadScript,
  OverlayView,
} from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  MapPin,
  Clock,
  Users,
  Crosshair,
  X,
  Loader2,
  Lock,
} from 'lucide-react'
import Link from 'next/link'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { DARK_MAP_STYLES } from '@/lib/wave/map-styles'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DiscoverSession {
  id: string
  title: string
  categorySlug: string
  activityMode: string
  imageUrl: string | null
  latitude: number
  longitude: number
  startTime: string | null
  address: string | null
  city: string
  price: number
  maxPeople: number | null
  requiresApproval: boolean
  fitnessLevel: string | null
  attendeeCount: number
  isFull: boolean
  host: {
    id: string
    name: string | null
    imageUrl: string | null
    slug: string | null
  }
}

interface DiscoverCommunity {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logoImage: string | null
  coverImage: string | null
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  memberCount: number
  instagramHandle: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }
const DEFAULT_ZOOM = 12
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
}

const CATEGORY_COLORS: Record<string, string> = {
  running:        'bg-orange-500',
  pickleball:     'bg-green-500',
  yoga:           'bg-purple-500',
  bootcamp:       'bg-red-500',
  gym:            'bg-blue-500',
  cycling:        'bg-yellow-500',
  badminton:      'bg-emerald-500',
  combat_fitness: 'bg-rose-600',
  pilates:        'bg-pink-500',
  hiking:         'bg-lime-600',
  swimming:       'bg-cyan-500',
  padel:          'bg-teal-500',
  dance_fitness:  'bg-fuchsia-500',
  volleyball:     'bg-amber-500',
  basketball:     'bg-orange-600',
  cold_plunge:    'bg-sky-500',
  other:          'bg-neutral-500',
}

const CATEGORY_EMOJI_MAP = Object.fromEntries(
  ACTIVITY_TYPES.map((t) => [t.key, t.emoji])
)

function getCategoryEmoji(slug: string) {
  return CATEGORY_EMOJI_MAP[slug] ?? '🏅'
}

function getCategoryColor(slug: string) {
  return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.other
}

// ─── Pin Component ────────────────────────────────────────────────────────────

interface PinProps {
  session: DiscoverSession
  isSelected: boolean
  onClick: () => void
}

function SessionPin({ session, isSelected, onClick }: PinProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="cursor-pointer select-none"
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div
        className={`
          flex items-center justify-center rounded-full
          shadow-lg border-2 transition-all duration-150
          ${isSelected
            ? 'w-12 h-12 text-2xl border-white scale-110 ring-2 ring-white/40'
            : 'w-9 h-9 text-lg border-white/80 hover:scale-110'
          }
          ${getCategoryColor(session.categorySlug)}
        `}
      >
        {getCategoryEmoji(session.categorySlug)}
      </div>
      {session.price > 0 && !isSelected && (
        <div className="absolute -bottom-1 -right-1 bg-[#1A1A1A] text-white text-[9px] font-bold px-1 rounded-full leading-tight border border-black/[0.06]">
          ${session.price}
        </div>
      )}
    </div>
  )
}

// ─── Community Pin Component ─────────────────────────────────────────────────

interface CommunityPinProps {
  community: DiscoverCommunity
  isSelected: boolean
  onClick: () => void
}

function CommunityPin({ community, isSelected, onClick }: CommunityPinProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="cursor-pointer select-none"
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div
        className={`
          flex items-center justify-center rounded-xl
          shadow-lg border-2 transition-all duration-150
          ${isSelected
            ? 'w-12 h-12 border-white scale-110 ring-2 ring-white/40'
            : 'w-9 h-9 border-white/80 hover:scale-110'
          }
          bg-[#1A1A1A]
        `}
      >
        {community.logoImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={community.logoImage} alt="" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <span className={isSelected ? 'text-lg' : 'text-sm'}>
            {getCategoryEmoji(community.category)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────

const FILTER_CATEGORIES = [
  { value: '', label: 'All', emoji: '✨' },
  ...ACTIVITY_TYPES.slice(0, 10).map((t) => ({ value: t.key, label: t.label, emoji: t.emoji })),
]

interface FilterPillsProps {
  active: string
  onChange: (v: string) => void
}

function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 pb-1">
      {FILTER_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold
            whitespace-nowrap border transition-all flex-shrink-0
            ${active === cat.value
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md'
              : 'bg-white/80 text-[#4A4A5A] border-black/[0.06] hover:border-black/[0.12] backdrop-blur'
            }
          `}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </button>
      ))}
    </div>
  )
}

// ─── Session Detail Sheet ─────────────────────────────────────────────────────

interface SheetProps {
  session: DiscoverSession | null
  onClose: () => void
  onJoin: (id: string) => void
  joining: boolean
  currentUserId: string | null
}

function SessionDetailSheet({ session, onClose, onJoin, joining, currentUserId }: SheetProps) {
  if (!session) return null

  const isHost = currentUserId === session.host.id
  const isFree = session.price === 0
  const spotsLeft = session.maxPeople ? session.maxPeople - session.attendeeCount : null
  const isAlmostFull = spotsLeft !== null && spotsLeft <= 3 && !session.isFull

  return (
    <AnimatePresence>
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="absolute bottom-0 left-0 right-0 z-40"
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80) onClose()
        }}
      >
        {/* Bottom nav clearance on mobile */}
        <div className="mb-[80px] md:mb-0">
          <div className="bg-white border-t border-black/[0.06] rounded-t-2xl shadow-2xl">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/[0.1]" />
            </div>

            <div className="px-4 pb-6 pt-2">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getCategoryEmoji(session.categorySlug)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isFree
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-[#FFFBF8] text-[#1A1A1A]'
                      }`}
                    >
                      {isFree ? 'FREE' : `$${session.price}`}
                    </span>
                    {session.requiresApproval && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#71717A]">
                        <Lock className="w-3 h-3" /> Approval
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/activities/${session.id}`}
                    className="text-base font-bold text-[#1A1A1A] leading-snug hover:text-[#1A1A1A] line-clamp-2 block"
                  >
                    {session.title}
                  </Link>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFFBF8] flex items-center justify-center hover:bg-neutral-100"
                >
                  <X className="w-4 h-4 text-[#71717A]" />
                </button>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-1.5 text-sm text-[#71717A] mb-3">
                {session.startTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {format(new Date(session.startTime), 'EEE, MMM d · h:mm a')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {session.address ?? session.city}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {session.attendeeCount} going
                    {session.maxPeople ? ` · ${session.maxPeople - session.attendeeCount} spots left` : ''}
                  </span>
                </div>
              </div>

              {/* Almost full warning */}
              {isAlmostFull && (
                <p className="text-xs text-amber-600 font-medium mb-3">
                  Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left!
                </p>
              )}

              {/* Host */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#FFFBF8] flex-shrink-0">
                  {session.host.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.host.imageUrl} alt={session.host.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-100" />
                  )}
                </div>
                <span className="text-xs text-[#71717A]">
                  Hosted by <span className="text-[#1A1A1A] font-medium">{session.host.name ?? 'Someone'}</span>
                </span>
              </div>

              {/* CTA */}
              {!isHost && !session.isFull && (
                <button
                  onClick={() => onJoin(session.id)}
                  disabled={joining}
                  className="w-full py-3.5 rounded-full bg-[#1A1A1A] text-white text-sm font-bold hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                  ) : session.requiresApproval ? (
                    'Request to join →'
                  ) : (
                    "Book →"
                  )}
                </button>
              )}
              {session.isFull && (
                <p className="text-center text-sm text-[#71717A] py-3">Session full</p>
              )}
              {isHost && (
                <Link href={`/activities/${session.id}`} className="block">
                  <button className="w-full py-3.5 rounded-full border border-black/[0.06] text-[#4A4A5A] text-sm font-semibold hover:bg-neutral-50 transition-colors">
                    Manage session →
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Community Detail Sheet ───────────────────────────────────────────────────

interface CommunitySheetProps {
  community: DiscoverCommunity | null
  onClose: () => void
}

function CommunityDetailSheet({ community, onClose }: CommunitySheetProps) {
  if (!community) return null

  return (
    <AnimatePresence>
      <motion.div
        key="community-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="absolute bottom-0 left-0 right-0 z-40"
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80) onClose()
        }}
      >
        <div className="mb-[80px] md:mb-0">
          <div className="bg-white border-t border-black/[0.06] rounded-t-2xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/[0.1]" />
            </div>

            <div className="px-4 pb-6 pt-2">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getCategoryEmoji(community.category)}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1A1A1A]/10 text-[#1A1A1A]">
                      Community
                    </span>
                  </div>
                  <Link
                    href={`/communities/${community.slug}`}
                    className="text-base font-bold text-[#1A1A1A] leading-snug hover:text-[#1A1A1A] line-clamp-2 block"
                  >
                    {community.name}
                  </Link>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFFBF8] flex items-center justify-center hover:bg-neutral-100"
                >
                  <X className="w-4 h-4 text-[#71717A]" />
                </button>
              </div>

              {community.description && (
                <p className="text-sm text-[#71717A] mb-3 line-clamp-2">
                  {community.description.split('\n')[0]}
                </p>
              )}

              <div className="flex flex-col gap-1.5 text-sm text-[#71717A] mb-3">
                {(community.address || community.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{community.address ?? community.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{community.memberCount} member{community.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <Link href={`/communities/${community.slug}`} className="block">
                <button className="w-full py-3.5 rounded-full bg-[#1A1A1A] text-white text-sm font-bold hover:bg-neutral-800 transition-colors">
                  View community →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const mapRef = useRef<google.maps.Map | null>(null)

  const [sessions, setSessions] = useState<DiscoverSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('')
  const [selected, setSelected] = useState<DiscoverSession | null>(null)
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [joining, setJoining] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  // Fetch current user ID
  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/user/p2p-onboarding')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.user?.id && setCurrentUserId(d.user.id))
      .catch(() => {})
  }, [isSignedIn])

  // Fetch sessions
  const fetchSessions = useCallback(async (category: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (userLocation) {
        params.set('lat', String(userLocation.lat))
        params.set('lng', String(userLocation.lng))
      }
      const res = await fetch(`/api/discover/sessions?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      toast.error('Could not load sessions')
    } finally {
      setLoading(false)
    }
  }, [userLocation])

  useEffect(() => {
    fetchSessions(activeFilter)
  }, [activeFilter, fetchSessions])

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently ignore denial
    )
  }, [])

  function recenter() {
    if (!mapRef.current) return
    const target = userLocation ?? SINGAPORE_CENTER
    mapRef.current.panTo(target)
    mapRef.current.setZoom(DEFAULT_ZOOM)
  }

  function handleFilterChange(value: string) {
    setActiveFilter(value)
    setSelected(null)
  }

  async function handleJoin(sessionId: string) {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    setJoining(true)
    try {
      const res = await fetch(`/api/buddy/sessions/${sessionId}/join`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'PAYMENT_REQUIRED' || data.code === 'USE_CHECKOUT') {
          router.push(`/activities/${sessionId}`)
          return
        }
        toast.error(data.error || 'Failed to join')
        return
      }
      toast.success("You're in! 🎉")
      setSelected(null)
      fetchSessions(activeFilter)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadError || !GOOGLE_MAPS_API_KEY) {
    return (
      <div className="fixed inset-0 bg-[#FFFBF8] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <MapPin className="w-10 h-10 text-[#71717A]" />
        <p className="text-[#71717A] text-sm">
          {!GOOGLE_MAPS_API_KEY
            ? 'Maps API key not configured.'
            : 'Failed to load Google Maps.'}
        </p>
        <Link href="/buddy" className="text-[#1A1A1A] underline text-sm">
          Browse sessions instead →
        </Link>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-[#FFFBF8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#FFFBF8]">
      {/* ── Full-screen map ── */}
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={SINGAPORE_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={(map) => { mapRef.current = map }}
        onClick={() => setSelected(null)}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          styles: DARK_MAP_STYLES,
          clickableIcons: false,
          gestureHandling: 'greedy',
        }}
      >
        {/* Session pins */}
        {sessions.map((session) => (
          <OverlayView
            key={session.id}
            position={{ lat: session.latitude, lng: session.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <SessionPin
              session={session}
              isSelected={selected?.id === session.id}
              onClick={() => setSelected(session)}
            />
          </OverlayView>
        ))}

        {/* User location blue dot */}
        {userLocation && (
          <OverlayView
            position={userLocation}
            mapPaneName={OverlayView.OVERLAY_LAYER}
          >
            <div
              className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"
              style={{ transform: 'translate(-50%, -50%)' }}
            />
          </OverlayView>
        )}
      </GoogleMap>

      {/* ── Filter pills — top overlay ── */}
      <div
        className="absolute left-0 right-0 z-30 pt-[env(safe-area-inset-top,12px)]"
        style={{ top: 0 }}
      >
        <div className="pt-3 pb-2 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-[2px]">
          <FilterPills active={activeFilter} onChange={handleFilterChange} />
        </div>
      </div>

      {/* ── Session count badge ── */}
      {!loading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-white/80 backdrop-blur border border-black/[0.06] text-[#4A4A5A] text-xs font-medium px-3 py-1.5 rounded-full">
            {sessions.length === 0
              ? 'No sessions nearby yet'
              : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} nearby`}
          </div>
        </div>
      )}

      {/* ── Loading spinner ── */}
      {loading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white/80 backdrop-blur border border-black/[0.06] px-3 py-1.5 rounded-full flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71717A]" />
            <span className="text-xs text-[#71717A]">Loading…</span>
          </div>
        </div>
      )}

      {/* ── Right-side controls ── */}
      <div className="absolute right-4 z-30 flex flex-col gap-3"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 80px)' }}
      >
        {/* Recenter */}
        <button
          onClick={recenter}
          className="w-11 h-11 rounded-full bg-white/95 backdrop-blur border border-black/[0.06] flex items-center justify-center shadow-lg hover:bg-neutral-50 transition-colors"
          aria-label="Recenter map"
        >
          <Crosshair className="w-5 h-5 text-[#4A4A5A]" />
        </button>
      </div>

      {/* ── FAB — host a session ── */}
      <div
        className="absolute right-4 z-30"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <Link href="/buddy/host/new" aria-label="Create a session">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] shadow-xl flex items-center justify-center hover:bg-neutral-800 transition-colors active:scale-95">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </Link>
      </div>

      {/* ── Session detail bottom sheet ── */}
      <SessionDetailSheet
        session={selected}
        onClose={() => setSelected(null)}
        onJoin={handleJoin}
        joining={joining}
        currentUserId={currentUserId}
      />

    </div>
  )
}
