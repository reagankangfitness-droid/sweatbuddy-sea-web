'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2, Zap, Minus, Plus, X, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { LocationAutocomplete } from '@/components/host/LocationAutocomplete'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'
import { useUploadThing } from '@/lib/uploadthing'
import {
  DEFAULT_HOST_LOCATION,
  inferCityFromLocation,
  isPublishableManagedCommunity,
} from '@/lib/host-session-rules'

// ─── Smart defaults ──────────────────────────────────────────────────────────

function getSmartTime(): { label: string; value: Date } {
  const now = new Date()
  const hour = now.getHours()

  const make = (h: number, m: number, daysAhead: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + daysAhead)
    d.setHours(h, m, 0, 0)
    return d
  }

  if (hour < 7) return { label: 'Today · 8:00 AM', value: make(8, 0, 0) }
  if (hour < 11) return { label: 'Today · 12:00 PM', value: make(12, 0, 0) }
  if (hour < 16) return { label: 'Today · 7:00 PM', value: make(19, 0, 0) }
  if (hour < 20) return { label: 'Today · 9:00 PM', value: make(21, 0, 0) }
  return { label: 'Tomorrow · 8:00 AM', value: make(8, 0, 1) }
}

function getTimeOptions(): { label: string; value: Date }[] {
  const now = new Date()
  const hour = now.getHours()
  const options: { label: string; value: Date }[] = []

  const make = (h: number, m: number, daysAhead: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + daysAhead)
    d.setHours(h, m, 0, 0)
    return d
  }

  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
  inOneHour.setMinutes(Math.ceil(inOneHour.getMinutes() / 15) * 15, 0, 0)

  if (hour < 22) options.push({ label: 'In 1 hour', value: inOneHour })
  if (hour < 19) options.push({ label: 'Tonight 7pm', value: make(19, 0, 0) })
  options.push({ label: 'Tomorrow AM', value: make(8, 0, 1) })
  options.push({ label: 'Tomorrow PM', value: make(18, 0, 1) })

  const daysToSat = (6 - now.getDay() + 7) % 7 || 7
  if (daysToSat > 1) options.push({ label: 'Saturday 9am', value: make(9, 0, daysToSat) })

  return options
}

function generateTitle(slug: string, time: Date): string {
  const cat = ACTIVITY_TYPES.find((t) => t.key === slug)
  const label = cat?.label ?? 'Session'
  const hour = time.getHours()
  if (hour < 12) return `Morning ${label}`
  if (hour < 17) return `Afternoon ${label}`
  return `Evening ${label}`
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; address: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const addr = data.address ?? {}
    const city = addr.city || addr.town || addr.village || addr.state || 'Singapore'
    const road = addr.road || addr.suburb || ''
    const name = data.name || ''
    const address = name && name !== road ? `${name}, ${road}`.replace(/, $/, '') : road
    return { city, address: address || data.display_name?.split(',').slice(0, 2).join(',') || city }
  } catch {
    return { city: 'Singapore', address: '' }
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = ACTIVITY_TYPES.filter((t) => t.tier <= 2).map((t) => ({
  slug: t.key,
  emoji: t.emoji,
  label: t.label,
}))

function showSessionCapToast(data: {
  error?: string
  activeSessionCount?: number
  sessionCap?: number
  guidance?: string
  manageUrl?: string
}) {
  const active = data.activeSessionCount ?? data.sessionCap ?? 3
  const cap = data.sessionCap ?? 3

  toast.error(data.error || `You have ${active} upcoming sessions live.`, {
    description: data.guidance || `New hosts can list ${cap} upcoming sessions at once. Finish or cancel one to add another.`,
    action: {
      label: 'Manage',
      onClick: () => {
        window.location.href = data.manageUrl || '/my-sessions'
      },
    },
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CreateSessionSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialCategorySlug?: string
  initialTitle?: string
}

interface ManagedCommunity {
  id: string
  name: string
  slug: string
  role: string
  isActive?: boolean
  moderationStatus?: string
  managerTrustLevel?: string
  upcomingSessionCount?: number
}

export function CreateSessionSheet({
  open,
  onClose,
  onSuccess,
  initialCategorySlug,
  initialTitle,
}: CreateSessionSheetProps) {
  const { isLoaded, isSignedIn } = useUser()
  const { startUpload } = useUploadThing('activityImage')
  const { startUpload: startQrUpload } = useUploadThing('paynowQrImage')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Community selector
  const [communities, setCommunities] = useState<ManagedCommunity[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)
  const [communityLoading, setCommunityLoading] = useState(false)

  // Core fields
  const [categorySlug, setCategorySlug] = useState('')
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [timeLabel, setTimeLabel] = useState('')
  const [latitude, setLatitude] = useState(0)
  const [longitude, setLongitude] = useState(0)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [locationLoading, setLocationLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  const [note, setNote] = useState('')
  const [spots, setSpots] = useState(0) // 0 = unlimited
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Pricing
  const [isPaid, setIsPaid] = useState(false)
  const [price, setPrice] = useState('') // dollars as string for input
  const [acceptPayNow, setAcceptPayNow] = useState(false)
  const [paynowPhone, setPaynowPhone] = useState('')
  const [paynowName, setPaynowName] = useState('')
  const [paynowQrUrl, setPaynowQrUrl] = useState('')
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const qrInputRef = useRef<HTMLInputElement>(null)

  // Share sheet after creation
  const [shareOpen, setShareOpen] = useState(false)
  const [createdSession, setCreatedSession] = useState<{ id: string; title: string } | null>(null)

  // Reset and set smart defaults when sheet opens/closes
  useEffect(() => {
    if (open) {
      const smart = getSmartTime()
      setSelectedTime(smart.value)
      setTimeLabel(smart.label)
      setCategorySlug(
        initialCategorySlug && CATEGORIES.some((category) => category.slug === initialCategorySlug)
          ? initialCategorySlug
          : '',
      )
      setNote(initialTitle?.slice(0, 100) ?? '')
      setSpots(0)
      setShowLocationPicker(false)
      setSelectedCommunity(null)
      setImageUrl('')
      setIsUploading(false)
      setIsPaid(false)
      setPrice('')
      setAcceptPayNow(false)
      setPaynowPhone('')
      setPaynowName('')
      setPaynowQrUrl('')

      if (!isSignedIn) {
        setCommunities([])
        return
      }

      setCommunityLoading(true)
      fetch('/api/user/communities')
        .then((r) => r.ok ? r.json() : { communities: [] })
        .then((d) => {
          const owned = (d.communities ?? []).filter((c: ManagedCommunity) => (
            c.role === 'OWNER' || c.role === 'ADMIN'
          ))
          setCommunities(owned)
        })
        .catch(() => {})
        .finally(() => setCommunityLoading(false))
    }
  }, [open, isSignedIn, initialCategorySlug, initialTitle])

  const publishableCommunities = useMemo(
    () => communities.filter(isPublishableManagedCommunity),
    [communities],
  )

  useEffect(() => {
    if (!open) return
    if (selectedCommunity && !publishableCommunities.some((c) => c.id === selectedCommunity)) {
      setSelectedCommunity(null)
    }
  }, [open, publishableCommunities, selectedCommunity])

  // Auto-detect location on open
  useEffect(() => {
    if (!open) return
    if (!navigator.geolocation) {
      setLatitude(DEFAULT_HOST_LOCATION.latitude)
      setLongitude(DEFAULT_HOST_LOCATION.longitude)
      setCity(DEFAULT_HOST_LOCATION.city)
      setAddress(DEFAULT_HOST_LOCATION.address)
      setLocationLoading(false)
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLatitude(lat)
        setLongitude(lng)
        const geo = await reverseGeocode(lat, lng)
        setCity(geo.city)
        setAddress(geo.address)
        setLocationLoading(false)
      },
      () => {
        setLatitude(DEFAULT_HOST_LOCATION.latitude)
        setLongitude(DEFAULT_HOST_LOCATION.longitude)
        setCity(DEFAULT_HOST_LOCATION.city)
        setAddress(DEFAULT_HOST_LOCATION.address)
        setLocationLoading(false)
      }
    )
  }, [open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const result = await startUpload([file])
      if (result && result[0]) {
        setImageUrl(`https://utfs.io/f/${result[0].key}`)
        toast.success('Image uploaded!')
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingQr(true)
    try {
      const result = await startQrUpload([file])
      if (result && result[0]) {
        setPaynowQrUrl(`https://utfs.io/f/${result[0].key}`)
        toast.success('QR code uploaded!')
      }
    } catch {
      toast.error('Failed to upload QR code')
    } finally {
      setIsUploadingQr(false)
    }
  }

  const selectedCommunityRecord = publishableCommunities.find((c) => c.id === selectedCommunity)
  const isSelfHosted = !selectedCommunityRecord
  const paidPrice = isPaid ? Number(price) : 0
  const paidValidationError = isPaid
    ? !selectedCommunity
      ? 'Paid sessions need a verified crew.'
      : Number.isNaN(paidPrice) || paidPrice <= 0
      ? 'Enter a paid price.'
      : !acceptPayNow
      ? 'Select PayNow for paid sessions.'
      : !paynowQrUrl
      ? 'Upload your PayNow QR code.'
      : null
    : null
  const canShowForm = isLoaded && isSignedIn
  const canPost = Boolean(
    canShowForm &&
    categorySlug &&
    selectedTime &&
    latitude !== 0 &&
    !paidValidationError,
  )
  const disabledReason = !isLoaded
    ? 'Checking host access...'
    : !isSignedIn
    ? 'Sign in to post a session.'
    : !categorySlug
    ? 'Pick an activity.'
    : !selectedTime
    ? 'Pick a time.'
    : latitude === 0
    ? 'Add a meeting point.'
    : paidValidationError
    ? paidValidationError
    : null

  function selectCommunityForPost(communityId: string | null) {
    setSelectedCommunity(communityId)
    if (!communityId) {
      setIsPaid(false)
      setPrice('')
      setAcceptPayNow(false)
      setPaynowQrUrl('')
    }
  }

  const handlePost = useCallback(async () => {
    if (!canPost || posting) return
    setPosting(true)

    const title = note.trim() || generateTitle(categorySlug, selectedTime!)
    const priceToPost = isPaid && selectedCommunity ? paidPrice : 0

    try {
      const res = await fetch('/api/buddy/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: note.trim() || null,
          categorySlug,
          city,
          address,
          latitude,
          longitude,
          startTime: selectedTime!.toISOString(),
          maxPeople: spots > 0 ? spots : null,
          communityId: selectedCommunity || undefined,
          imageUrl: imageUrl || undefined,
          price: priceToPost,
          currency: 'SGD',
          acceptPayNow: priceToPost > 0 && acceptPayNow,
          paynowPhoneNumber: priceToPost > 0 && acceptPayNow && paynowPhone ? paynowPhone : undefined,
          paynowName: priceToPost > 0 && acceptPayNow && paynowName ? paynowName : undefined,
          paynowQrImageUrl: priceToPost > 0 && acceptPayNow && paynowQrUrl ? paynowQrUrl : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'ONBOARDING_REQUIRED') {
          onClose()
          toast.error('Complete quick setup in discovery before posting a session.')
          return
        }
        if (data.code === 'SESSION_CAP') {
          onClose()
          showSessionCapToast(data)
          return
        }
        if (data.code === 'COMMUNITY_REQUIRED' || data.code === 'COMMUNITY_FORBIDDEN') {
          toast.error('Choose a verified crew before posting a session.')
          return
        }
        if (data.code === 'MANAGER_VERIFICATION_REQUIRED') {
          toast.error('Verify your crew manager access before posting sessions.')
          return
        }
        if (data.code === 'PAYMENT_METHOD_REQUIRED') {
          toast.error('Select a payment method for paid sessions.')
          return
        }
        if (data.code === 'PAYNOW_QR_REQUIRED') {
          toast.error('Upload your PayNow QR code before posting a paid session.')
          return
        }
        if (data.code === 'SELF_HOSTED_PAID_REQUIRES_COMMUNITY') {
          toast.error('Paid sessions need a verified crew.')
          return
        }
        toast.error(data.error || 'Failed to post')
        return
      }

      if (data.requiresReview) {
        toast.success('Session saved for a quick trust check.')
        onClose()
        onSuccess?.()
        return
      }

      toast.success(data.limited ? 'Posted with limited distribution until verified.' : 'Posted! Your session is live.')
      const postedTitle = note.trim() || generateTitle(categorySlug, selectedTime!)
      setCreatedSession({ id: data.activity.id, title: postedTitle })
      onClose()
      onSuccess?.()
      // Show share sheet after a brief delay for the creation sheet to animate out
      setTimeout(() => setShareOpen(true), 300)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setPosting(false)
    }
  }, [canPost, posting, categorySlug, selectedTime, city, address, latitude, longitude, spots, note, imageUrl, isPaid, selectedCommunity, paidPrice, acceptPayNow, paynowPhone, paynowName, paynowQrUrl, onClose, onSuccess])

  const catLabel = CATEGORIES.find((c) => c.slug === categorySlug)?.label ?? ''

  return (
    <>
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Full-screen sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed inset-x-0 bottom-0 top-[env(safe-area-inset-top,40px)] z-50 bg-[#1A1A1A] rounded-t-2xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#333333]">
              <h2 className="text-lg font-bold text-white">New Session</h2>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#333333] transition-colors">
                <X className="w-4 h-4 text-[#999999]" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {!canShowForm ? (
                <div className="flex min-h-[360px] flex-col justify-center">
                  <div className="rounded-2xl border border-white/10 bg-[#202020] p-5 text-center">
                    {!isLoaded || communityLoading ? (
                      <>
                        <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-white" />
                        <h3 className="text-lg font-bold text-white">Checking host access...</h3>
                      </>
                    ) : !isSignedIn ? (
                      <>
                        <h3 className="text-lg font-bold text-white">Sign in to host sessions.</h3>
                        <p className="mt-2 text-sm leading-6 text-[#888888]">
                          Hosts need an account so attendees know who is behind the plan.
                        </p>
                        <Link
                          href="/sign-in?redirect_url=%2Fbuddy%3Fcreate%3Dsession"
                          onClick={onClose}
                          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-black"
                        >
                          Sign in
                        </Link>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-white">Getting your host tools ready.</h3>
                        <p className="mt-2 text-sm leading-6 text-[#888888]">
                          You can post a free session as yourself, or use a verified crew for paid and recurring sessions.
                        </p>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          <Link
                            href="/communities/nominate"
                            onClick={onClose}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-black"
                          >
                            List or claim community
                          </Link>
                          <Link
                            href="/communities"
                            onClick={onClose}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-bold text-white"
                          >
                            Explore communities
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>

              {/* Posting identity */}
              <div>
                <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2 block">Posting as</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => selectCommunityForPost(null)}
                    className={`flex-shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all ${
                      isSelfHosted
                        ? 'bg-white text-black border-white'
                        : 'bg-[#2A2A2A] text-[#999999] border-[#333333]'
                    }`}
                  >
                    Myself
                  </button>
                  {publishableCommunities.map((community) => (
                    <button
                      key={community.id}
                      type="button"
                      onClick={() => selectCommunityForPost(community.id)}
                      className={`flex-shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all ${
                        selectedCommunity === community.id
                          ? 'bg-white text-black border-white'
                          : 'bg-[#2A2A2A] text-[#999999] border-[#333333]'
                      }`}
                    >
                      {community.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[#666666]">
                  {isSelfHosted
                    ? 'Free self-hosted sessions go through review before appearing publicly. Paid or recurring sessions need a verified crew.'
                    : 'Verified crew sessions can publish with stronger trust signals and paid options.'}
                </p>
              </div>

              {/* Cover image upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Cover" className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-[#1A1A1A] hover:bg-white transition-colors"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-[11px] font-semibold text-white hover:bg-black/70 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-36 rounded-xl border-2 border-dashed border-white/10 bg-[#2A2A2A] flex flex-col items-center justify-center gap-2 hover:border-white/20 transition-all"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                        <span className="text-xs text-[#666666]">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-[#666666]" />
                        <span className="text-xs font-medium text-[#666666]">Add cover image</span>
                        <span className="text-[10px] text-[#555555]">Helps your session stand out</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Session name */}
              <div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Session name"
                  maxLength={100}
                  className="w-full text-xl font-bold text-white placeholder:text-[#555555] focus:outline-none border-none bg-transparent"
                />
                <p className="text-[11px] text-[#666666] mt-1">
                  {catLabel ? `Auto: ${generateTitle(categorySlug, selectedTime ?? new Date())}` : 'Or we\u2019ll name it for you'}
                </p>
              </div>

              {/* Activity type */}
              <div>
                <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2 block">Activity</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setCategorySlug(categorySlug === cat.slug ? '' : cat.slug)}
                      className={`flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-all flex-shrink-0 min-w-[68px] ${
                        categorySlug === cat.slug
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-[#2A2A2A] text-[#999999] border-[#333333] hover:border-white/[0.12]'
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2 block">Date & Time</label>
                {/* Date and time inputs */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-[#666666] mb-1 block">Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedTime ? selectedTime.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (!e.target.value) return
                        const current = selectedTime ?? new Date()
                        const [y, m, d] = e.target.value.split('-').map(Number)
                        const next = new Date(current)
                        next.setFullYear(y, m - 1, d)
                        setSelectedTime(next)
                        setTimeLabel(next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
                      }}
                      className="w-full px-3.5 py-3 bg-[#2A2A2A] rounded-xl border border-[#333333] text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-[11px] text-[#666666] mb-1 block">Time</label>
                    <input
                      type="time"
                      value={selectedTime ? `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}` : ''}
                      onChange={(e) => {
                        if (!e.target.value) return
                        const [h, m] = e.target.value.split(':').map(Number)
                        const current = selectedTime ?? new Date()
                        const next = new Date(current)
                        next.setHours(h, m, 0, 0)
                        setSelectedTime(next)
                        setTimeLabel(next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
                      }}
                      className="w-full px-3.5 py-3 bg-[#2A2A2A] rounded-xl border border-[#333333] text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5">
                  {getTimeOptions().map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => { setSelectedTime(opt.value); setTimeLabel(opt.label) }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                        timeLabel === opt.label
                          ? 'bg-white text-black border-white'
                          : 'bg-[#1A1A1A] text-[#666666] border-white/10 hover:border-white/[0.16]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2 block">Location</label>
                {showLocationPicker ? (
                  <LocationAutocomplete
                    variant="light"
                    value={address}
                    onChange={(data) => {
                      setAddress(data.location)
                      setLatitude(data.latitude)
                      setLongitude(data.longitude)
                      setCity(inferCityFromLocation(data.location))
                      setShowLocationPicker(false)
                    }}
                    onManualChange={(val) => {
                      setAddress(val)
                      setLatitude((current) => current || DEFAULT_HOST_LOCATION.latitude)
                      setLongitude((current) => current || DEFAULT_HOST_LOCATION.longitude)
                      setCity((current) => current || DEFAULT_HOST_LOCATION.city)
                    }}
                    placeholder="Search for a place..."
                  />
                ) : (
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#2A2A2A] border border-[#333333] hover:border-white/[0.12] transition-all text-left"
                  >
                    <MapPin className="w-4 h-4 text-[#666666] flex-shrink-0" />
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
                    ) : (
                      <span className="text-sm text-[#999999] truncate">{address || city || 'Add location'}</span>
                    )}
                  </button>
                )}
              </div>

              {/* Spots */}
              <div>
                <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2 block">Spots</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSpots(Math.max(0, spots - 1))}
                    disabled={spots === 0}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#2A2A2A] disabled:opacity-30 transition-all"
                  >
                    <Minus className="w-4 h-4 text-[#999999]" />
                  </button>
                  <span className="text-base font-bold text-white w-16 text-center">
                    {spots === 0 ? 'Open' : spots}
                  </span>
                  <button
                    onClick={() => setSpots(spots + 1)}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#2A2A2A] transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#999999]" />
                  </button>
                  <span className="text-xs text-[#666666]">{spots === 0 ? 'Unlimited' : `${spots} spots max`}</span>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2 block">Pricing</label>
                {/* Free / Paid toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => { setIsPaid(false); setPrice('') }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      !isPaid
                        ? 'bg-white text-black shadow-md'
                        : 'bg-[#2A2A2A] text-[#666666] border border-[#333333]'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedCommunity) {
                        toast.error('Choose a verified crew to charge for a session.')
                        return
                      }
                      setIsPaid(true)
                    }}
                    disabled={!selectedCommunity}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      isPaid
                        ? 'bg-white text-black shadow-md'
                        : 'bg-[#2A2A2A] text-[#666666] border border-[#333333]'
                    }`}
                  >
                    Paid
                  </button>
                </div>

                {/* Paid options */}
                {isPaid && (
                  <div className="space-y-3">
                    {/* Price input */}
                    <div>
                      <label className="text-[11px] text-[#666666] mb-1 block">Price (SGD)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#999999]">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-3 bg-[#2A2A2A] rounded-xl border border-[#333333] text-sm text-white focus:outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="text-[11px] text-[#666666] mb-1.5 block">Payment method</label>
                      <button
                        onClick={() => setAcceptPayNow(!acceptPayNow)}
                        className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl border transition-all ${
                          acceptPayNow
                            ? 'bg-[#2A2A2A] border-white/20'
                            : 'bg-[#2A2A2A] border-[#333333] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          acceptPayNow ? 'bg-white border-white' : 'border-white/[0.12]'
                        }`}>
                          {acceptPayNow && <span className="text-white text-[10px] font-bold">&#10003;</span>}
                        </div>
                        <span className="text-sm font-medium text-white">PayNow</span>
                      </button>
                    </div>

                    {/* PayNow details */}
                    {acceptPayNow && (
                      <div className="space-y-2 pl-1">
                        <input
                          type="text"
                          value={paynowName}
                          onChange={(e) => setPaynowName(e.target.value)}
                          placeholder="PayNow name"
                          className="w-full px-3.5 py-2.5 bg-[#2A2A2A] rounded-xl border border-[#333333] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-white/30"
                        />
                        <input
                          type="tel"
                          value={paynowPhone}
                          onChange={(e) => setPaynowPhone(e.target.value)}
                          placeholder="PayNow phone number"
                          className="w-full px-3.5 py-2.5 bg-[#2A2A2A] rounded-xl border border-[#333333] text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-white/30"
                        />
                        {/* QR code upload */}
                        <input
                          ref={qrInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQrUpload}
                        />
                        {paynowQrUrl ? (
                          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#2A2A2A] border border-[#333333]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={paynowQrUrl} alt="QR" className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-white">PayNow QR uploaded</p>
                              <button
                                type="button"
                                onClick={() => qrInputRef.current?.click()}
                                className="text-[11px] text-white font-medium mt-0.5"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => qrInputRef.current?.click()}
                            disabled={isUploadingQr}
                            className="w-full py-2.5 rounded-xl border border-dashed border-white/10 bg-[#2A2A2A] text-xs font-medium text-[#666666] hover:border-white/20 transition-all flex items-center justify-center gap-2"
                          >
                            {isUploadingQr ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                            ) : (
                              'Upload PayNow QR code (required)'
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

                </>
              )}
            </div>

            {/* Sticky bottom CTA */}
            <div className="px-5 py-4 border-t border-[#333333] pb-[env(safe-area-inset-bottom,16px)]">
              <button
                onClick={handlePost}
                disabled={!canPost || posting}
                className="w-full py-4 rounded-full bg-white text-black text-sm font-bold uppercase tracking-wider hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {posting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Post Session</>
                )}
              </button>
              {disabledReason && !posting && (
                <p className="mt-2 text-center text-xs text-[#666666]">{disabledReason}</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Share sheet after creation */}
    <ShareSessionSheet
      open={shareOpen}
      onClose={() => { setShareOpen(false); setCreatedSession(null) }}
      sessionId={createdSession?.id ?? ''}
      sessionTitle={createdSession?.title ?? ''}
      sessionTime={selectedTime?.toISOString()}
      sessionLocation={address || city}
      spotsLeft={spots > 0 ? spots : null}
      goingCount={1}
      context="created"
    />
    </>
  )
}
