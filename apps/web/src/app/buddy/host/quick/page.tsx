'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import Link from 'next/link'

// ─── Time presets ────────────────────────────────────────────────────────────

function getTimePresets() {
  const now = new Date()
  const hour = now.getHours()

  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
  // Round to next 15-min mark
  inOneHour.setMinutes(Math.ceil(inOneHour.getMinutes() / 15) * 15, 0, 0)

  const tonight = new Date(now)
  tonight.setHours(19, 0, 0, 0)
  if (tonight <= now) tonight.setDate(tonight.getDate() + 1)

  const tomorrowAm = new Date(now)
  tomorrowAm.setDate(tomorrowAm.getDate() + 1)
  tomorrowAm.setHours(8, 0, 0, 0)

  const tomorrowPm = new Date(now)
  tomorrowPm.setDate(tomorrowPm.getDate() + 1)
  tomorrowPm.setHours(18, 0, 0, 0)

  const saturday = new Date(now)
  const daysToSat = (6 - saturday.getDay() + 7) % 7 || 7
  saturday.setDate(saturday.getDate() + daysToSat)
  saturday.setHours(9, 0, 0, 0)

  const presets = []

  // "In 1 hour" only if before 10pm
  if (hour < 22) {
    presets.push({ label: 'In 1 hour', value: inOneHour })
  }

  // "Tonight" only if it's still before 7pm today
  if (hour < 19) {
    presets.push({ label: 'Tonight 7pm', value: tonight })
  }

  presets.push({ label: 'Tomorrow AM', value: tomorrowAm })
  presets.push({ label: 'Tomorrow PM', value: tomorrowPm })

  // Saturday only if > 1 day away
  if (daysToSat > 1) {
    presets.push({ label: 'Saturday 9am', value: saturday })
  }

  return presets
}

// ─── Title generator ─────────────────────────────────────────────────────────

function generateTitle(categorySlug: string, startTime: Date | null): string {
  const cat = ACTIVITY_TYPES.find((t) => t.key === categorySlug)
  const label = cat?.label ?? 'Session'

  if (!startTime) return label

  const now = new Date()
  const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffHours < 3) return `${label} — Let's go!`

  const hour = startTime.getHours()
  if (hour < 12) return `Morning ${label}`
  if (hour < 17) return `Afternoon ${label}`
  return `Evening ${label}`
}

// ─── Reverse geocode ─────────────────────────────────────────────────────────

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

// ─── Main Page ───────────────────────────────────────────────────────────────

const CATEGORIES = ACTIVITY_TYPES.filter((t) => t.tier <= 2).map((t) => ({
  slug: t.key,
  label: t.label,
  emoji: t.emoji,
}))

export default function QuickPostPage() {
  const router = useRouter()

  const [categorySlug, setCategorySlug] = useState('')
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [timeLabel, setTimeLabel] = useState('')
  const [note, setNote] = useState('')
  const [spots, setSpots] = useState('6')
  const [latitude, setLatitude] = useState(0)
  const [longitude, setLongitude] = useState(0)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [locationLoading, setLocationLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  const timePresets = getTimePresets()

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false)
      setCity('Singapore')
      return
    }
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
        // Default to Singapore center
        setLatitude(1.3521)
        setLongitude(103.8198)
        setCity('Singapore')
        setLocationLoading(false)
      }
    )
  }, [])

  const canPost = categorySlug && selectedTime && latitude !== 0

  async function handlePost() {
    if (!canPost || posting) return
    setPosting(true)

    const title = note.trim() || generateTitle(categorySlug, selectedTime)

    try {
      const res = await fetch('/api/buddy/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categorySlug,
          city,
          address,
          latitude,
          longitude,
          startTime: selectedTime!.toISOString(),
          maxPeople: spots ? Number(spots) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'ONBOARDING_REQUIRED') {
          toast.error('Join a session first to set up your profile, then you can host.')
          router.push('/buddy')
          return
        }
        toast.error(data.error || 'Failed to post')
        return
      }

      toast.success('Posted! Your session is live.')
      router.push(`/activities/${data.activity.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-lg border-b border-[#333333]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#2A2A2A] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#999999]" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h1 className="text-base font-bold text-white">Quick session</h1>
          </div>
          <Link href="/buddy/host/new" className="ml-auto text-xs text-[#666666] hover:text-[#999999]">
            Full editor →
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-3 block">What are you doing?</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategorySlug(categorySlug === cat.slug ? '' : cat.slug)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
                  categorySlug === cat.slug
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] '
                    : 'bg-[#1A1A1A] text-[#999999] border-[#333333] hover:border-[#666666]'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[11px] font-medium leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* When */}
        <div>
          <label className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-3 block">When?</label>
          <div className="flex flex-wrap gap-2">
            {timePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedTime(preset.value)
                  setTimeLabel(preset.label)
                }}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                  timeLabel === preset.label
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] '
                    : 'bg-[#1A1A1A] text-[#999999] border-[#333333] hover:border-[#666666]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Where */}
        <div>
          <label className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-3 block">Where?</label>
          <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] rounded-xl border border-[#333333]">
            <MapPin className="w-4 h-4 text-[#666666] flex-shrink-0" />
            {locationLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Detecting location...
              </div>
            ) : (
              <span className="text-sm text-[#999999] truncate">
                {address || city || 'Location detected'}
              </span>
            )}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-3 block">Say something <span className="text-[#666666] normal-case">(optional)</span></label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Easy pace, all welcome"
            maxLength={100}
            className="w-full px-4 py-3 bg-[#1A1A1A] rounded-xl border border-[#333333] text-sm text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#666666] transition-all"
          />
        </div>

        {/* Spots */}
        <div>
          <label className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-3 block">Spots</label>
          <div className="flex gap-2">
            {['4', '6', '8', '12', '20', ''].map((val) => (
              <button
                key={val}
                onClick={() => setSpots(val)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                  spots === val
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-[#1A1A1A] text-[#999999] border-[#333333] hover:border-[#666666]'
                }`}
              >
                {val || 'No limit'}
              </button>
            ))}
          </div>
        </div>

        {/* Post button */}
        <div className="pt-2 pb-8">
          <button
            onClick={handlePost}
            disabled={!canPost || posting}
            className="w-full py-4 rounded-full bg-[#1A1A1A] text-white text-sm font-bold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {posting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
            ) : (
              <><Zap className="w-4 h-4" /> Post session</>
            )}
          </button>
          {!canPost && !posting && (
            <p className="text-center text-xs text-[#666666] mt-2">
              Pick an activity and time to post
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
