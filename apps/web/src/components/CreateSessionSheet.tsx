'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2, Zap, ChevronDown, Minus, Plus, X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { LocationAutocomplete } from '@/components/host/LocationAutocomplete'
import { ShareSessionSheet } from '@/components/ShareSessionSheet'

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
  const router = useRouter()

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

  // Expanded fields
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [spots, setSpots] = useState(0) // 0 = unlimited
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

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
      setExpanded(false)
      setShowTimePicker(false)
      setShowLocationPicker(false)
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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'ONBOARDING_REQUIRED') {
          onClose()
          router.push('/onboarding/p2p')
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
  }, [canPost, posting, categorySlug, selectedTime, city, address, latitude, longitude, spots, note, onClose, onSuccess, router])

  const catLabel = CATEGORIES.find((c) => c.slug === categorySlug)?.label ?? ''
  const previewText = catLabel && timeLabel
    ? `${catLabel} · ${timeLabel}${address ? ` · ${address.split(',')[0]}` : ''}`
    : 'Pick an activity to post'

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
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.y > 100) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
            style={{ maxHeight: '85dvh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 rounded-full bg-black/[0.08]" />
            </div>

            <div className="px-4 pb-[env(safe-area-inset-bottom,16px)] overflow-y-auto" style={{ maxHeight: 'calc(85dvh - 24px)' }}>
              {/* Category emoji row */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setCategorySlug(categorySlug === cat.slug ? '' : cat.slug)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all flex-shrink-0 min-w-[64px] ${
                      categorySlug === cat.slug
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md scale-105'
                        : 'bg-[#FFFBF8] text-[#4A4A5A] border-black/[0.04] hover:border-black/[0.1]'
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Time + Location row */}
              <div className="flex gap-2 mb-3">
                {/* Time chip */}
                <button
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFBF8] border border-black/[0.04] text-sm text-[#4A4A5A] hover:border-black/[0.1] transition-all flex-shrink-0"
                >
                  <Clock className="w-3.5 h-3.5 text-[#71717A]" />
                  <span className="font-medium text-xs">{timeLabel || 'When?'}</span>
                  <ChevronDown className="w-3 h-3 text-[#9A9AAA]" />
                </button>

                {/* Location chip */}
                <button
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFBF8] border border-black/[0.04] text-sm text-[#4A4A5A] hover:border-black/[0.1] transition-all min-w-0 flex-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
                  {locationLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[#9A9AAA]" />
                  ) : (
                    <span className="font-medium text-xs truncate">{address || city || 'Where?'}</span>
                  )}
                </button>
              </div>

              {/* Time picker dropdown */}
              <AnimatePresence>
                {showTimePicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="space-y-3 pb-1">
                      {/* Quick presets */}
                      <div className="flex flex-wrap gap-2">
                        {getTimeOptions().map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => {
                              setSelectedTime(opt.value)
                              setTimeLabel(opt.label)
                              setShowTimePicker(false)
                            }}
                            className={`px-3 py-2 rounded-full text-xs font-medium border transition-all ${
                              timeLabel === opt.label
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-white text-[#4A4A5A] border-black/[0.06] hover:border-black/[0.12]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom date + time picker */}
                      <div className="flex gap-2">
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
                          className="flex-1 px-3 py-2.5 bg-[#FFFBF8] rounded-xl border border-black/[0.04] text-xs text-[#1A1A1A] focus:outline-none focus:border-black/[0.12]"
                        />
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
                          className="w-28 px-3 py-2.5 bg-[#FFFBF8] rounded-xl border border-black/[0.04] text-xs text-[#1A1A1A] focus:outline-none focus:border-black/[0.12]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Location picker dropdown */}
              <AnimatePresence>
                {showLocationPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-3"
                  >
                    <LocationAutocomplete
                      variant="light"
                      value={address}
                      onChange={(data) => {
                        setAddress(data.location)
                        setLatitude(data.latitude)
                        setLongitude(data.longitude)
                        // Extract city from address
                        const parts = data.location.split(',')
                        setCity(parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim() || 'Singapore')
                        setShowLocationPicker(false)
                      }}
                      onManualChange={(val) => setAddress(val)}
                      placeholder="Search for a place..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded options */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-3">
                      {/* Note */}
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What should people know? (optional)"
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 bg-[#FFFBF8] rounded-xl border border-black/[0.04] text-sm text-[#1A1A1A] placeholder:text-[#9A9AAA] focus:outline-none focus:border-black/[0.12] transition-all"
                      />

                      {/* Spots stepper */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-[#71717A]">Spots</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSpots(Math.max(0, spots - 1))}
                            disabled={spots === 0}
                            className="w-8 h-8 rounded-full border border-black/[0.06] flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 transition-all"
                          >
                            <Minus className="w-3.5 h-3.5 text-[#4A4A5A]" />
                          </button>
                          <span className="text-sm font-semibold text-[#1A1A1A] w-12 text-center">
                            {spots === 0 ? 'Open' : spots}
                          </span>
                          <button
                            onClick={() => setSpots(spots + 1)}
                            className="w-8 h-8 rounded-full border border-black/[0.06] flex items-center justify-center hover:bg-neutral-50 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#4A4A5A]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add details toggle */}
              {!expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-xs text-[#71717A] hover:text-[#4A4A5A] mb-3 transition-colors"
                >
                  + Add details
                </button>
              )}

              {/* CTA */}
              <button
                onClick={handlePost}
                disabled={!canPost || posting}
                className="w-full py-3.5 rounded-full bg-[#1A1A1A] text-white text-sm font-bold hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mb-2"
              >
                {posting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                ) : (
                  <><Zap className="w-4 h-4" /> {canPost ? previewText : 'Pick an activity'}</>
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
