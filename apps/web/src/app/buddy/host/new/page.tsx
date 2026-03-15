'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MapPin, ChevronDown, CheckCircle2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES as ACTIVITY_TYPES_CONFIG } from '@/lib/activity-types'
import { LocationAutocomplete } from '@/components/host/LocationAutocomplete'

const ACTIVITY_TYPES = [
  ...ACTIVITY_TYPES_CONFIG.map((t) => ({ slug: t.key, label: t.label, emoji: t.emoji })),
  { slug: 'other', label: 'Other', emoji: '🏅' },
]

const FITNESS_LEVELS = [
  { value: 'ALL', label: 'All levels welcome' },
  { value: 'INTERMEDIATE_PLUS', label: 'Intermediate & above' },
  { value: 'ADVANCED', label: 'Advanced only' },
]

type Step = 'basic' | 'details' | 'pricing' | 'preview'

interface FormData {
  title: string
  description: string
  categorySlug: string
  imageUrl: string
  city: string
  address: string
  latitude: string
  longitude: string
  startDate: string
  startTime: string
  endTime: string
  maxPeople: string
  fitnessLevel: string
  whatToBring: string
  price: string
  currency: string
  acceptPayNow: boolean
  acceptStripe: boolean
  paynowQrImageUrl: string
  paynowPhoneNumber: string
  paynowName: string
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  categorySlug: '',
  imageUrl: '',
  city: '',
  address: '',
  latitude: '',
  longitude: '',
  startDate: '',
  startTime: '',
  endTime: '',
  maxPeople: '',
  fitnessLevel: 'ALL',
  whatToBring: '',
  price: '0',
  currency: 'SGD',
  acceptPayNow: false,
  acceptStripe: false,
  paynowQrImageUrl: '',
  paynowPhoneNumber: '',
  paynowName: '',
}

const WIZARD_DRAFT_KEY = 'sb_session_draft'

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basic')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(WIZARD_DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setForm((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      // Auto-suggest a specific title when category + city first set
      if ((field === 'categorySlug' || field === 'city') && updated.categorySlug && updated.city && !prev.title) {
        const cat = ACTIVITY_TYPES.find((t) => t.slug === updated.categorySlug)
        const timeHints: Record<string, string> = {
          running: 'Morning run',
          cycling: 'Weekend ride',
          yoga: 'Morning yoga',
          strength: 'Gym session',
          gym: 'Gym session',
          hiking: 'Trail hike',
          bootcamp: 'Outdoor bootcamp',
          hiit: 'HIIT session',
          pilates: 'Pilates class',
          swimming: 'Swim session',
          volleyball: 'Beach volleyball',
          basketball: 'Pick-up basketball',
          cold_plunge: 'Cold plunge',
          pickleball: 'Pickleball session',
          badminton: 'Badminton session',
          combat_fitness: 'Muay Thai / Boxing session',
          padel: 'Padel session',
          dance_fitness: 'Dance fitness class',
          other: 'Workout session',
        }
        const hint = timeHints[updated.categorySlug] ?? (cat ? cat.label : 'Workout session')
        updated.title = `${hint} in ${updated.city}`
      }
      return updated
    })
  }

  function validateStep(s: Step): string | null {
    if (s === 'basic') {
      if (!form.title.trim()) return 'Title is required'
      if (form.title.length > 100) return 'Title must be 100 chars or less'
      if (!form.categorySlug) return 'Activity type is required'
    }
    if (s === 'details') {
      if (!form.city.trim()) return 'City is required'
      if (!form.startDate) return 'Date is required'
      if (!form.startTime) return 'Start time is required'
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
      if (startDateTime <= new Date()) return 'Start time must be in the future'
    }
    if (s === 'pricing') {
      const price = Number(form.price)
      if (isNaN(price) || price < 0) return 'Invalid price'
      if (price > 0) {
        if (!form.acceptPayNow && !form.acceptStripe) {
          return 'Select at least one payment method for paid sessions'
        }
        if (form.acceptPayNow && !form.paynowQrImageUrl && !qrFile) {
          return 'Upload your PayNow QR code'
        }
        if (form.acceptStripe && stripeConnected === false) {
          return 'Connect Stripe to accept card payments'
        }
      }
    }
    return null
  }

  function nextStep() {
    const error = validateStep(step)
    if (error) {
      toast.error(error)
      return
    }
    const steps: Step[] = ['basic', 'details', 'pricing', 'preview']
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1])
    }
  }

  function prevStep() {
    const steps: Step[] = ['basic', 'details', 'pricing', 'preview']
    const idx = steps.indexOf(step)
    if (idx > 0) setStep(steps[idx - 1])
    else router.back()
  }

  async function checkStripeStatus() {
    try {
      const res = await fetch('/api/stripe/connect/p2p')
      if (res.ok) {
        const data = await res.json()
        setStripeConnected(data.chargesEnabled ?? false)
      }
    } catch {
      setStripeConnected(false)
    }
  }

  // Check Stripe when reaching pricing step
  async function goToPricing() {
    const error = validateStep('details')
    if (error) { toast.error(error); return }
    await checkStripeStatus()
    setStep('pricing')
  }

  async function handlePublish() {
    setSaving(true)
    try {
      // Upload QR if a new file was selected
      let finalQrUrl = form.paynowQrImageUrl
      if (qrFile) {
        const fd = new FormData()
        fd.append('file', qrFile)
        const uploadRes = await fetch('/api/upload/paynow-qr', { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          toast.error(err.error || 'Failed to upload QR code')
          return
        }
        const uploadData = await uploadRes.json()
        finalQrUrl = uploadData.url
      }

      const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
      const endDateTime = form.endTime ? new Date(`${form.startDate}T${form.endTime}`) : null

      const res = await fetch('/api/buddy/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          categorySlug: form.categorySlug,
          imageUrl: form.imageUrl.trim() || null,
          city: form.city.trim(),
          address: form.address.trim() || null,
          latitude: Number(form.latitude) || 1.3521,
          longitude: Number(form.longitude) || 103.8198,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime?.toISOString() ?? null,
          maxPeople: form.maxPeople ? Number(form.maxPeople) : null,
          fitnessLevel: form.fitnessLevel,
          whatToBring: form.whatToBring.trim() || null,
          price: Number(form.price),
          currency: form.currency,
          acceptPayNow: form.acceptPayNow,
          acceptStripe: form.acceptStripe,
          paynowQrImageUrl: finalQrUrl || null,
          paynowPhoneNumber: form.paynowPhoneNumber.trim() || null,
          paynowName: form.paynowName.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'ONBOARDING_REQUIRED') {
          router.push('/onboarding/p2p')
          return
        }
        if (data.code === 'STRIPE_REQUIRED') {
          toast.error('Connect Stripe first to charge for sessions')
          return
        }
        toast.error(data.error || 'Failed to create session')
        return
      }

      // Clear draft and show success screen
      try { localStorage.removeItem(WIZARD_DRAFT_KEY) } catch {}
      setPublishedId(data.activity.id)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const STEPS: Step[] = ['basic', 'details', 'pricing', 'preview']
  const stepIdx = STEPS.indexOf(step)

  const selectedType = ACTIVITY_TYPES.find((t) => t.slug === form.categorySlug)

  // Success screen
  if (publishedId) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Session published!</h1>
        <p className="text-neutral-500 mb-8 max-w-xs">
          Your session is live. Share it with friends to get people joining.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push(`/activities/${publishedId}`)}
            className="w-full rounded-xl bg-black dark:bg-white px-4 py-4 text-sm font-semibold text-white dark:text-black"
          >
            View my session →
          </button>
          <button
            onClick={() => router.push('/buddy')}
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-300"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={prevStep} aria-label="Go back" className="p-1 -ml-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-neutral-900 dark:text-white">Host a Session</h1>
            <div className="flex gap-1 mt-1" role="progressbar" aria-label={`Step ${stepIdx + 1} of ${STEPS.length}: ${step === 'basic' ? 'Basic Info' : step === 'details' ? 'Details' : step === 'pricing' ? 'Pricing' : 'Preview'}`} aria-valuenow={stepIdx + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= stepIdx ? 'bg-black dark:bg-white' : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 pb-48 md:pb-32 overflow-hidden">
        {/* Step 1: Basic Info */}
        {step === 'basic' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">What are you hosting?</h2>
              <p className="text-sm text-neutral-500 mt-1">The basics about your session</p>
            </div>

            {/* Activity type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Activity type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.slug}
                    type="button"
                    onClick={() => update('categorySlug', type.slug)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                      form.categorySlug === type.slug
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
                    }`}
                  >
                    <span className="text-xl">{type.emoji}</span>
                    <span className="text-center leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Session title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder={
                  selectedType
                    ? `e.g. ${selectedType.label} at East Coast Park`
                    : 'e.g. Morning Run at Marina Bay'
                }
                maxLength={100}
                aria-required="true"
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              <p className="mt-1 text-xs text-right text-neutral-400">{form.title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Description <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What's the vibe? What should people expect?"
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
              />
              <p className="mt-1 text-xs text-right text-neutral-400">{form.description.length}/500</p>
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Cover image URL <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => update('imageUrl', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">When &amp; where?</h2>
              <p className="text-sm text-neutral-500 mt-1">Help people show up on time</p>
            </div>

            {/* Date */}
            <div className="overflow-hidden">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                aria-required="true"
                className="w-full min-w-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white box-border"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Start time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  aria-required="true"
                  className="w-full min-w-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white box-border"
                />
              </div>
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  End time <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="w-full min-w-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white box-border"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Meeting point <span className="text-red-500">*</span>
              </label>
              <LocationAutocomplete
                value={form.address}
                onChange={(data) => {
                  update('address', data.location)
                  update('latitude', String(data.latitude))
                  update('longitude', String(data.longitude))
                  // Extract city from the place name
                  const cityMatch = data.location.match(/Singapore|Bangkok|Kuala Lumpur|Jakarta|Manila|Ho Chi Minh/i)
                  update('city', cityMatch ? cityMatch[0] : 'Singapore')
                }}
                onManualChange={(val) => update('address', val)}
                placeholder="Search for a gym, park, or address"
              />
            </div>

            {/* Max people */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Max attendees <span className="text-neutral-400 font-normal">(optional — leave blank for unlimited)</span>
              </label>
              <input
                type="number"
                value={form.maxPeople}
                onChange={(e) => update('maxPeople', e.target.value)}
                placeholder="e.g. 10"
                min={1}
                max={500}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Fitness level */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Who should join?
              </label>
              <div className="relative">
                <select
                  value={form.fitnessLevel}
                  onChange={(e) => update('fitnessLevel', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  {FITNESS_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* What to bring */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                What to bring <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.whatToBring}
                onChange={(e) => update('whatToBring', e.target.value)}
                placeholder="e.g. Running shoes, water bottle"
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Free or paid?</h2>
              <p className="text-sm text-neutral-500 mt-1">You can charge for your time and expertise</p>
            </div>

            {/* Free/Paid toggle */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '0', label: 'Free', emoji: '🆓', sub: 'No charge, max impact' },
                { value: '', label: 'Paid', emoji: '💰', sub: 'Charge for your session' },
              ].map((opt) => {
                const isFree = form.price === '0' || Number(form.price) === 0
                const selected = opt.value === '0' ? isFree : !isFree
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => update('price', opt.value === '0' ? '0' : '')}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                      selected
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className={`text-xs ${selected ? 'opacity-70' : 'text-neutral-400'}`}>{opt.sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Price input — shown only when Paid is selected */}
            {form.price !== '0' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Price per person
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.currency}
                      onChange={(e) => update('currency', e.target.value)}
                      aria-label="Currency"
                      className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-base text-neutral-900 dark:text-white focus:outline-none min-w-[80px]"
                    >
                      {['SGD', 'USD', 'MYR', 'AUD', 'GBP', 'EUR'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      placeholder="15"
                      min={1}
                      step={1}
                      className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>

                {/* Payment methods — only shown when price > 0 */}
                {Number(form.price) > 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                        How will people pay? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {/* PayNow option */}
                        <label className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors">
                          <input
                            type="checkbox"
                            checked={form.acceptPayNow}
                            onChange={(e) => update('acceptPayNow', e.target.checked)}
                            className="mt-0.5 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">PayNow (QR code)</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Attendees scan your QR and upload proof. You verify manually.</p>
                          </div>
                        </label>

                        {/* Stripe option */}
                        <label className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors">
                          <input
                            type="checkbox"
                            checked={form.acceptStripe}
                            onChange={(e) => update('acceptStripe', e.target.checked)}
                            className="mt-0.5 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">Stripe (card / online)</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Instant card payments. Requires Stripe account connected.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* PayNow details — shown when PayNow selected */}
                    {form.acceptPayNow && (
                      <div className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">PayNow details</p>

                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Your name (shown to payers)
                          </label>
                          <input
                            type="text"
                            value={form.paynowName}
                            onChange={(e) => update('paynowName', e.target.value)}
                            placeholder="e.g. Reagan Kang"
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Phone number (optional)
                          </label>
                          <input
                            type="tel"
                            value={form.paynowPhoneNumber}
                            onChange={(e) => update('paynowPhoneNumber', e.target.value)}
                            placeholder="e.g. +65 9123 4567"
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            PayNow QR code <span className="text-red-500">*</span>
                          </label>
                          {qrPreviewUrl || form.paynowQrImageUrl ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qrPreviewUrl || form.paynowQrImageUrl}
                                alt="PayNow QR"
                                className="w-32 h-32 object-contain rounded-xl border border-neutral-200 dark:border-neutral-700"
                              />
                              <button
                                type="button"
                                aria-label="Remove QR code image"
                                onClick={() => {
                                  setQrPreviewUrl(null)
                                  setQrFile(null)
                                  update('paynowQrImageUrl', '')
                                  if (qrInputRef.current) qrInputRef.current.value = ''
                                }}
                                className="absolute -top-2 -right-2 rounded-full bg-neutral-800 p-1 text-white hover:bg-neutral-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => qrInputRef.current?.click()}
                              className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 px-4 py-6 text-sm text-neutral-500 hover:border-neutral-500 dark:hover:border-neutral-400 transition-colors w-full justify-center"
                            >
                              <Upload className="w-4 h-4" />
                              Upload QR image
                            </button>
                          )}
                          <input
                            ref={qrInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setQrFile(file)
                              const url = URL.createObjectURL(file)
                              setQrPreviewUrl(url)
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stripe warning/status */}
                    {form.acceptStripe && stripeConnected === false && (
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Connect Stripe to receive card payments
                        </p>
                        <a
                          href="/buddy/host/connect"
                          className="inline-block mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                        >
                          Connect Stripe →
                        </a>
                      </div>
                    )}

                    {form.acceptStripe && stripeConnected === true && (
                      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                        <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                          <span>✓</span> Stripe connected — card payments enabled
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Looks good?</h2>
              <p className="text-sm text-neutral-500 mt-1">Here&apos;s how your session will appear</p>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-neutral-400 mb-1">
                    {ACTIVITY_TYPES.find((t) => t.slug === form.categorySlug)?.emoji}{' '}
                    {ACTIVITY_TYPES.find((t) => t.slug === form.categorySlug)?.label}
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-neutral-500 mt-1">{form.description}</p>
                  )}
                </div>
                <span className={`text-sm font-semibold ${Number(form.price) > 0 ? 'text-neutral-900 dark:text-white' : 'text-green-600'}`}>
                  {Number(form.price) > 0 ? `${form.currency} ${form.price}` : 'Free'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-neutral-500">
                {form.startDate && form.startTime && (
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>
                      {new Date(`${form.startDate}T${form.startTime}`).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric',
                      })}{' '}
                      at {new Date(`${form.startDate}T${form.startTime}`).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {form.city && (
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{form.address ? `${form.address}, ${form.city}` : form.city}</span>
                  </div>
                )}
                {form.maxPeople && (
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>Max {form.maxPeople} people</span>
                  </div>
                )}
                {form.fitnessLevel !== 'ALL' && (
                  <div className="flex items-center gap-2">
                    <span>💪</span>
                    <span>{FITNESS_LEVELS.find((l) => l.value === form.fitnessLevel)?.label}</span>
                  </div>
                )}
                {form.whatToBring && (
                  <div className="flex items-center gap-2">
                    <span>🎒</span>
                    <span>{form.whatToBring}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit links */}
            <div className="space-y-2">
              {[
                { label: 'Edit basic info', target: 'basic' as Step },
                { label: 'Edit details', target: 'details' as Step },
                { label: 'Edit pricing', target: 'pricing' as Step },
              ].map((link) => (
                <button
                  key={link.target}
                  onClick={() => setStep(link.target)}
                  className="w-full text-left text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-t border-neutral-100 dark:border-neutral-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 mb-[80px] md:mb-0">
        <div className="max-w-lg mx-auto">
          {step === 'preview' ? (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="w-full rounded-xl bg-black dark:bg-white px-4 py-4 text-sm font-semibold text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
              ) : (
                '🚀 Publish Session'
              )}
            </button>
          ) : (
            <button
              onClick={step === 'details' ? goToPricing : nextStep}
              className="w-full rounded-xl bg-black dark:bg-white px-4 py-4 text-sm font-semibold text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
