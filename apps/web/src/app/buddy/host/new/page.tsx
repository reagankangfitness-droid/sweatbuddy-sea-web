'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MapPin, ChevronDown, CheckCircle2, Upload, X, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES as ACTIVITY_TYPES_CONFIG } from '@/lib/activity-types'
import { LocationAutocomplete } from '@/components/host/LocationAutocomplete'
import { useUploadThing } from '@/lib/uploadthing'

const ACTIVITY_TYPES = [
  ...ACTIVITY_TYPES_CONFIG.map((t) => ({ slug: t.key, label: t.label, emoji: t.emoji })),
  { slug: 'other', label: 'Other', emoji: '🏅' },
]

const FITNESS_LEVELS = [
  { value: 'ALL', label: 'All levels welcome' },
  { value: 'INTERMEDIATE_PLUS', label: 'Intermediate & above' },
  { value: 'ADVANCED', label: 'Advanced only' },
]

const CANCELLATION_POLICIES = [
  { value: '24h', label: '24 hours notice' },
  { value: '12h', label: '12 hours notice' },
  { value: 'none', label: 'No cancellations' },
]

type Step = 'basic' | 'details' | 'pricing' | 'preview'

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
]

interface FormData {
  title: string
  description: string
  categorySlug: string
  imageUrl: string
  city: string
  address: string
  latitude: string
  longitude: string
  isRecurring: boolean
  daysOfWeek: string[]
  recurrenceEndDate: string
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
  cancellationPolicy: string
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
  isRecurring: false,
  daysOfWeek: [],
  recurrenceEndDate: '',
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
  cancellationPolicy: '24h',
}

const WIZARD_DRAFT_KEY = 'sb_session_draft'

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basic')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [isRecurringSuccess, setIsRecurringSuccess] = useState(false)
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing('activityImage')

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
      if (!form.startTime) return 'Start time is required'
      if (form.isRecurring) {
        if (form.daysOfWeek.length === 0) return 'Select at least one day'
      } else {
        if (!form.startDate) return 'Date is required'
        const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
        if (startDateTime <= new Date()) return 'Start time must be in the future'
      }
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

      if (form.isRecurring) {
        // Create a recurring template
        const res = await fetch('/api/host/templates', {
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
            daysOfWeek: form.daysOfWeek,
            startTime: form.startTime,
            endTime: form.endTime || null,
            endDate: form.recurrenceEndDate || null,
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
            cancellationPolicy: form.cancellationPolicy,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          if (data.code === 'ONBOARDING_REQUIRED') { router.push('/onboarding/p2p'); return }
          if (data.code === 'STRIPE_REQUIRED') { toast.error('Connect Stripe first to charge for sessions'); return }
          toast.error(data.error || 'Failed to create recurring session')
          return
        }

        try { localStorage.removeItem(WIZARD_DRAFT_KEY) } catch {}
        setPublishedId(data.template.id)
        setIsRecurringSuccess(true)
      } else {
        // Create a one-time session
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
            cancellationPolicy: form.cancellationPolicy,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          if (data.code === 'ONBOARDING_REQUIRED') { router.push('/onboarding/p2p'); return }
          if (data.code === 'STRIPE_REQUIRED') { toast.error('Connect Stripe first to charge for sessions'); return }
          toast.error(data.error || 'Failed to create session')
          return
        }

        try { localStorage.removeItem(WIZARD_DRAFT_KEY) } catch {}
        setPublishedId(data.activity.id)
      }
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
      <div className="min-h-screen bg-[#FFFBF8] flex flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          {isRecurringSuccess ? 'Recurring session created!' : 'Session created!'}
        </h1>
        <p className="text-[#71717A] mb-8 max-w-xs">
          {isRecurringSuccess
            ? 'Sessions will auto-generate for the next 4 weeks. You can manage your recurring sessions anytime.'
            : 'Your session is live. People can now find and join it.'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {isRecurringSuccess ? (
            <button
              onClick={() => router.push('/host/templates')}
              className="w-full rounded-xl bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white"
            >
              Manage recurring sessions →
            </button>
          ) : (
            <button
              onClick={() => router.push(`/activities/${publishedId}`)}
              className="w-full rounded-xl bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white"
            >
              View my session →
            </button>
          )}
          <button
            onClick={() => router.push('/buddy')}
            className="w-full rounded-xl border border-black/[0.06] px-4 py-3 text-sm font-medium text-[#4A4A5A]"
          >
            Back to Discover
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF8]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-black/[0.06]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={prevStep} aria-label="Go back" className="p-1 -ml-1 rounded-lg hover:bg-[#FFFBF8]">
            <ArrowLeft className="w-5 h-5 text-[#4A4A5A]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-[#1A1A1A]">Create a Session</h1>
            <div className="flex gap-1 mt-1" role="progressbar" aria-label={`Step ${stepIdx + 1} of ${STEPS.length}: ${step === 'basic' ? 'Basic Info' : step === 'details' ? 'Details' : step === 'pricing' ? 'Pricing' : 'Preview'}`} aria-valuenow={stepIdx + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= stepIdx ? 'bg-[#1A1A1A]' : 'bg-black/[0.06]'
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
              <h2 className="text-xl font-bold text-[#1A1A1A]">What are you hosting?</h2>
              <p className="text-sm text-[#71717A] mt-1">The basics about your session</p>
            </div>

            {/* Activity type */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-3">
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
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
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
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
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
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
              <p className="mt-1 text-xs text-right text-[#71717A]">{form.title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                Description <span className="text-[#71717A] font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What's the vibe? What should people expect?"
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
              />
              <p className="mt-1 text-xs text-right text-[#71717A]">{form.description.length}/500</p>
            </div>

            {/* Cover image upload */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                Cover image <span className="text-[#71717A] font-normal">(optional)</span>
              </label>
              {form.imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Cover preview"
                    className="w-full h-40 object-cover rounded-xl border border-black/[0.06]"
                  />
                  <button
                    type="button"
                    aria-label="Remove cover image"
                    onClick={() => update('imageUrl', '')}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={coverUploading}
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-black/[0.12] bg-white flex flex-col items-center justify-center gap-2 text-[#71717A] hover:border-black/[0.12] transition-colors active:scale-[0.98]"
                >
                  {coverUploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-sm font-medium">Tap to upload photo</span>
                      <span className="text-xs text-[#71717A]">JPG, PNG up to 8MB</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 8 * 1024 * 1024) {
                    toast.error('Image must be under 8MB')
                    return
                  }
                  setCoverUploading(true)
                  try {
                    const res = await startUpload([file])
                    if (res?.[0]?.url) {
                      update('imageUrl', res[0].url)
                      toast.success('Cover image uploaded')
                    }
                  } catch {
                    toast.error('Failed to upload image')
                  } finally {
                    setCoverUploading(false)
                    if (coverInputRef.current) coverInputRef.current.value = ''
                  }
                }}
              />
            </div>

            {/* Cancellation policy */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                Cancellation policy
              </label>
              <div className="relative">
                <select
                  value={form.cancellationPolicy}
                  onChange={(e) => update('cancellationPolicy', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                >
                  {CANCELLATION_POLICIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">When &amp; where?</h2>
              <p className="text-sm text-[#71717A] mt-1">Help people show up on time</p>
            </div>

            {/* One-time / Recurring toggle */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-3">
                Session type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: false, label: 'One-time', sub: 'Single session' },
                  { value: true, label: 'Recurring', sub: 'Repeats weekly' },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isRecurring: opt.value }))}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-sm font-medium transition-all ${
                      form.isRecurring === opt.value
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span className={`text-xs ${form.isRecurring === opt.value ? 'opacity-70' : 'text-[#71717A]'}`}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring: Day-of-week selector */}
            {form.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-[#4A4A5A] mb-3">
                  Which days? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = form.daysOfWeek.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            daysOfWeek: selected
                              ? prev.daysOfWeek.filter((d) => d !== day.value)
                              : [...prev.daysOfWeek, day.value],
                          }))
                        }}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                          selected
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-white border border-black/[0.06] text-[#4A4A5A] hover:border-black/[0.12]'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* One-time: Date picker */}
            {!form.isRecurring && (
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  aria-required="true"
                  className="w-full min-w-0 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] box-border"
                />
              </div>
            )}

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                  Start time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  aria-required="true"
                  className="w-full min-w-0 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] box-border"
                />
              </div>
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                  End time <span className="text-[#71717A] font-normal">(optional)</span>
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="w-full min-w-0 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] box-border"
                />
              </div>
            </div>

            {/* Recurring: End date (optional) */}
            {form.isRecurring && (
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                  Runs until <span className="text-[#71717A] font-normal">(optional — leave blank for ongoing)</span>
                </label>
                <input
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) => update('recurrenceEndDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full min-w-0 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] box-border"
                />
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
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
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                Max attendees <span className="text-[#71717A] font-normal">(optional — leave blank for unlimited)</span>
              </label>
              <input
                type="number"
                value={form.maxPeople}
                onChange={(e) => update('maxPeople', e.target.value)}
                placeholder="e.g. 10"
                min={1}
                max={500}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>

            {/* Fitness level */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                Who should join?
              </label>
              <div className="relative">
                <select
                  value={form.fitnessLevel}
                  onChange={(e) => update('fitnessLevel', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                >
                  {FITNESS_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
              </div>
            </div>

            {/* What to bring */}
            <div>
              <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                What to bring <span className="text-[#71717A] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.whatToBring}
                onChange={(e) => update('whatToBring', e.target.value)}
                placeholder="e.g. Running shoes, water bottle"
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Free or paid?</h2>
              <p className="text-sm text-[#71717A] mt-1">You can charge for your time and expertise</p>
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
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className={`text-xs ${selected ? 'opacity-70' : 'text-[#71717A]'}`}>{opt.sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Price input — shown only when Paid is selected */}
            {form.price !== '0' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
                    Price per person
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.currency}
                      onChange={(e) => update('currency', e.target.value)}
                      aria-label="Currency"
                      className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:outline-none min-w-[80px]"
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
                      className="flex-1 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                    />
                  </div>
                </div>

                {/* Payment methods — only shown when price > 0 */}
                {Number(form.price) > 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A5A] mb-3">
                        How will people pay? <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {/* PayNow option */}
                        <label className="flex items-start gap-3 rounded-xl border border-black/[0.06] p-4 cursor-pointer hover:border-black/[0.12] transition-colors">
                          <input
                            type="checkbox"
                            checked={form.acceptPayNow}
                            onChange={(e) => update('acceptPayNow', e.target.checked)}
                            className="mt-0.5 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">PayNow (QR code)</p>
                            <p className="text-xs text-[#71717A] mt-0.5">Attendees scan your QR and upload proof. You verify manually.</p>
                          </div>
                        </label>

                        {/* Stripe option */}
                        <label className="flex items-start gap-3 rounded-xl border border-black/[0.06] p-4 cursor-pointer hover:border-black/[0.12] transition-colors">
                          <input
                            type="checkbox"
                            checked={form.acceptStripe}
                            onChange={(e) => update('acceptStripe', e.target.checked)}
                            className="mt-0.5 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">Stripe (card / online)</p>
                            <p className="text-xs text-[#71717A] mt-0.5">Instant card payments. Requires Stripe account connected.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* PayNow details — shown when PayNow selected */}
                    {form.acceptPayNow && (
                      <div className="space-y-4 rounded-xl border border-black/[0.06] p-4">
                        <p className="text-sm font-semibold text-[#1A1A1A]">PayNow details</p>

                        <div>
                          <label className="block text-xs font-medium text-[#4A4A5A] mb-2">
                            Your name (shown to payers)
                          </label>
                          <input
                            type="text"
                            value={form.paynowName}
                            onChange={(e) => update('paynowName', e.target.value)}
                            placeholder="e.g. Reagan Kang"
                            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#4A4A5A] mb-2">
                            Phone number (optional)
                          </label>
                          <input
                            type="tel"
                            value={form.paynowPhoneNumber}
                            onChange={(e) => update('paynowPhoneNumber', e.target.value)}
                            placeholder="e.g. +65 9123 4567"
                            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#4A4A5A] mb-2">
                            PayNow QR code <span className="text-red-500">*</span>
                          </label>
                          {qrPreviewUrl || form.paynowQrImageUrl ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qrPreviewUrl || form.paynowQrImageUrl}
                                alt="PayNow QR"
                                className="w-32 h-32 object-contain rounded-xl border border-black/[0.06]"
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
                              className="flex items-center gap-2 rounded-xl border border-dashed border-black/[0.12] px-4 py-6 text-sm text-[#71717A] hover:border-neutral-500  transition-colors w-full justify-center"
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
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <p className="text-sm font-medium text-amber-800">
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
                      <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                        <p className="text-sm text-green-700 flex items-center gap-2">
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
              <h2 className="text-xl font-bold text-[#1A1A1A]">Looks good?</h2>
              <p className="text-sm text-[#71717A] mt-1">Here&apos;s how your session will appear</p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-[#71717A] mb-1">
                    {ACTIVITY_TYPES.find((t) => t.slug === form.categorySlug)?.emoji}{' '}
                    {ACTIVITY_TYPES.find((t) => t.slug === form.categorySlug)?.label}
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-[#71717A] mt-1">{form.description}</p>
                  )}
                </div>
                <span className={`text-sm font-semibold ${Number(form.price) > 0 ? 'text-[#1A1A1A]' : 'text-green-600'}`}>
                  {Number(form.price) > 0 ? `${form.currency} ${form.price}` : 'Free'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-[#71717A]">
                {form.isRecurring ? (
                  <div className="flex items-center gap-2">
                    <span>🔁</span>
                    <span>
                      Every {form.daysOfWeek.map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label).join(', ')}{' '}
                      at {form.startTime}
                      {form.endTime ? ` – ${form.endTime}` : ''}
                      {form.recurrenceEndDate ? ` until ${new Date(form.recurrenceEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                ) : form.startDate && form.startTime ? (
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
                ) : null}
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
                  className="w-full text-left text-sm text-[#71717A] hover:text-neutral-600 hover:text-[#4A4A5A] underline"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-black/[0.06] p-4 z-40 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-lg mx-auto">
          {step === 'preview' ? (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="w-full rounded-xl bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
              ) : (
                form.isRecurring ? '🔁 Publish Recurring Session' : '🚀 Publish Session'
              )}
            </button>
          ) : (
            <button
              onClick={step === 'details' ? goToPricing : nextStep}
              className="w-full rounded-xl bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white hover:bg-black transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
