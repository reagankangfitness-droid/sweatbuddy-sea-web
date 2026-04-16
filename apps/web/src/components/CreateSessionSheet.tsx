'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2, Zap, Minus, Plus, X, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { LocationAutocomplete } from '@/components/host/LocationAutocomplete'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'
import { useUploadThing } from '@/lib/uploadthing'

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

// ─── Component ───────────────────────────────────────────────────────────────

interface CreateSessionSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateSessionSheet({ open, onClose, onSuccess }: CreateSessionSheetProps) {
  const { startUpload } = useUploadThing('activityImage')
  const { startUpload: startQrUpload } = useUploadThing('paynowQrImage')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Community selector
  const [communities, setCommunities] = useState<{ id: string; name: string; slug: string }[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)

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
      setCategorySlug('')
      setNote('')
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

      // Fetch user's communities (filter for OWNER/ADMIN roles)
      fetch('/api/user/communities')
        .then((r) => r.ok ? r.json() : { communities: [] })
        .then((d) => {
          const owned = (d.communities ?? [])
            .filter((c: { role: string }) => c.role === 'OWNER' || c.role === 'ADMIN')
          setCommunities(owned)
        })
        .catch(() => {})
    }
  }, [open])

  // Auto-detect location on open
  useEffect(() => {
    if (!open) return
    if (!navigator.geolocation) { setLocationLoading(false); setCity('Singapore'); return }

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
        setLatitude(1.3521)
        setLongitude(103.8198)
        setCity('Singapore')
        setLocationLoading(false)
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const canPost = categorySlug && selectedTime && latitude !== 0

  const handlePost = useCallback(async () => {
    if (!canPost || posting) return
    setPosting(true)

    const title = note.trim() || generateTitle(categorySlug, selectedTime!)

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
          price: isPaid && price ? parseFloat(price) : 0,
          currency: 'SGD',
          acceptPayNow: isPaid && acceptPayNow,
          paynowPhoneNumber: isPaid && acceptPayNow && paynowPhone ? paynowPhone : undefined,
          paynowName: isPaid && acceptPayNow && paynowName ? paynowName : undefined,
          paynowQrImageUrl: isPaid && acceptPayNow && paynowQrUrl ? paynowQrUrl : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'ONBOARDING_REQUIRED') {
          onClose()
          toast.error('Join a session first to set up your profile, then you can host.')
          return
        }
        toast.error(data.error || 'Failed to post')
        return
      }

      toast.success('Posted! Your session is live.')
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
  }, [canPost, posting, categorySlug, selectedTime, city, address, latitude, longitude, spots, note, imageUrl, isPaid, price, acceptPayNow, paynowPhone, paynowName, paynowQrUrl, selectedCommunity, onClose, onSuccess])

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
            className="fixed inset-x-0 bottom-0 top-[env(safe-area-inset-top,40px)] z-50 bg-[#18181B] rounded-t-2xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-[#FAFAFA]">Create Session</h2>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center hover:bg-[#3f3f46] transition-colors">
                <X className="w-4 h-4 text-[#A1A1AA]" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

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
                    className="w-full h-36 rounded-xl border-2 border-dashed border-white/[0.1] bg-[#27272A] flex flex-col items-center justify-center gap-2 hover:border-[#10B981]/30 transition-all"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                        <span className="text-xs text-[#71717A]">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-[#71717A]" />
                        <span className="text-xs font-medium text-[#71717A]">Add cover image</span>
                        <span className="text-[10px] text-[#52525B]">Makes your session stand out</span>
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
                  className="w-full text-xl font-bold text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none border-none bg-transparent"
                />
                <p className="text-[11px] text-[#71717A] mt-1">
                  {catLabel ? `Auto: ${generateTitle(categorySlug, selectedTime ?? new Date())}` : 'Give it a name or we\u2019ll generate one'}
                </p>
              </div>

              {/* Activity type */}
              <div>
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2 block">Activity</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setCategorySlug(categorySlug === cat.slug ? '' : cat.slug)}
                      className={`flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-all flex-shrink-0 min-w-[68px] ${
                        categorySlug === cat.slug
                          ? 'bg-[#10B981] text-white border-[#10B981] shadow-md'
                          : 'bg-[#27272A] text-[#A1A1AA] border-white/[0.06] hover:border-white/[0.12]'
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
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2 block">Date & Time</label>
                {/* Date and time inputs */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-[#71717A] mb-1 block">Date</label>
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
                      className="w-full px-3.5 py-3 bg-[#27272A] rounded-xl border border-white/[0.06] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#10B981]/40"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-[11px] text-[#71717A] mb-1 block">Time</label>
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
                      className="w-full px-3.5 py-3 bg-[#27272A] rounded-xl border border-white/[0.06] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#10B981]/40"
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
                          ? 'bg-[#10B981] text-white border-[#10B981]'
                          : 'bg-[#18181B] text-[#71717A] border-white/[0.08] hover:border-white/[0.16]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2 block">Location</label>
                {showLocationPicker ? (
                  <LocationAutocomplete
                    variant="light"
                    value={address}
                    onChange={(data) => {
                      setAddress(data.location)
                      setLatitude(data.latitude)
                      setLongitude(data.longitude)
                      const parts = data.location.split(',')
                      setCity(parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim() || 'Singapore')
                      setShowLocationPicker(false)
                    }}
                    onManualChange={(val) => setAddress(val)}
                    placeholder="Search for a place..."
                  />
                ) : (
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#27272A] border border-white/[0.06] hover:border-white/[0.12] transition-all text-left"
                  >
                    <MapPin className="w-4 h-4 text-[#71717A] flex-shrink-0" />
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#71717A]" />
                    ) : (
                      <span className="text-sm text-[#A1A1AA] truncate">{address || city || 'Add location'}</span>
                    )}
                  </button>
                )}
              </div>

              {/* Spots */}
              <div>
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2 block">Spots</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSpots(Math.max(0, spots - 1))}
                    disabled={spots === 0}
                    className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-[#27272A] disabled:opacity-30 transition-all"
                  >
                    <Minus className="w-4 h-4 text-[#A1A1AA]" />
                  </button>
                  <span className="text-base font-bold text-[#FAFAFA] w-16 text-center">
                    {spots === 0 ? 'Open' : spots}
                  </span>
                  <button
                    onClick={() => setSpots(spots + 1)}
                    className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-[#27272A] transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#A1A1AA]" />
                  </button>
                  <span className="text-xs text-[#71717A]">{spots === 0 ? 'Unlimited' : `${spots} spots max`}</span>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2 block">Pricing</label>
                {/* Free / Paid toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => { setIsPaid(false); setPrice('') }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      !isPaid
                        ? 'bg-[#10B981] text-white shadow-md'
                        : 'bg-[#27272A] text-[#71717A] border border-white/[0.06]'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setIsPaid(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isPaid
                        ? 'bg-[#10B981] text-white shadow-md'
                        : 'bg-[#27272A] text-[#71717A] border border-white/[0.06]'
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
                      <label className="text-[11px] text-[#71717A] mb-1 block">Price (SGD)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#A1A1AA]">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-3 bg-[#27272A] rounded-xl border border-white/[0.06] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#10B981]/40"
                        />
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="text-[11px] text-[#71717A] mb-1.5 block">Payment method</label>
                      <button
                        onClick={() => setAcceptPayNow(!acceptPayNow)}
                        className={`flex items-center gap-3 w-full px-3.5 py-3 rounded-xl border transition-all ${
                          acceptPayNow
                            ? 'bg-[#27272A] border-[#10B981]/30'
                            : 'bg-[#27272A] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          acceptPayNow ? 'bg-[#10B981] border-[#10B981]' : 'border-white/[0.12]'
                        }`}>
                          {acceptPayNow && <span className="text-white text-[10px] font-bold">&#10003;</span>}
                        </div>
                        <span className="text-sm font-medium text-[#FAFAFA]">PayNow</span>
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
                          className="w-full px-3.5 py-2.5 bg-[#27272A] rounded-xl border border-white/[0.06] text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#10B981]/40"
                        />
                        <input
                          type="tel"
                          value={paynowPhone}
                          onChange={(e) => setPaynowPhone(e.target.value)}
                          placeholder="PayNow phone number"
                          className="w-full px-3.5 py-2.5 bg-[#27272A] rounded-xl border border-white/[0.06] text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#10B981]/40"
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
                          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#27272A] border border-white/[0.06]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={paynowQrUrl} alt="QR" className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-[#FAFAFA]">PayNow QR uploaded</p>
                              <button
                                type="button"
                                onClick={() => qrInputRef.current?.click()}
                                className="text-[11px] text-[#10B981] font-medium mt-0.5"
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
                            className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] bg-[#27272A] text-xs font-medium text-[#71717A] hover:border-[#10B981]/30 transition-all flex items-center justify-center gap-2"
                          >
                            {isUploadingQr ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                            ) : (
                              'Upload PayNow QR code (optional)'
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Community selector */}
              {communities.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2 block">Posting as</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedCommunity(null)}
                      className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                        !selectedCommunity
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#27272A] text-[#71717A] border border-white/[0.06]'
                      }`}
                    >
                      Myself
                    </button>
                    {communities.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCommunity(c.id)}
                        className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                          selectedCommunity === c.id
                            ? 'bg-[#10B981] text-white'
                            : 'bg-[#27272A] text-[#71717A] border border-white/[0.06]'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky bottom CTA */}
            <div className="px-5 py-4 border-t border-white/[0.06] pb-[env(safe-area-inset-bottom,16px)]">
              <button
                onClick={handlePost}
                disabled={!canPost || posting}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-bold hover:from-[#059669] hover:to-[#10B981] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
              >
                {posting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Publish Session</>
                )}
              </button>
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
