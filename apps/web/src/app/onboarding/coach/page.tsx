'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

const DRAFT_KEY = 'sweatbuddies_coach_draft'

const COACH_TYPES = [
  { key: 'personal_trainer', label: 'Personal Trainer', emoji: '\u{1F3CB}\u{FE0F}' },
  { key: 'sports_coach', label: 'Sports Coach', emoji: '\u{1F3BE}' },
  { key: 'yoga_pilates', label: 'Yoga / Pilates Instructor', emoji: '\u{1F9D8}' },
  { key: 'swimming', label: 'Swimming Instructor', emoji: '\u{1F3CA}' },
  { key: 'physiotherapist', label: 'Physiotherapist', emoji: '\u{1FA7A}' },
  { key: 'running_coach', label: 'Running Coach', emoji: '\u{1F3C3}' },
  { key: 'other', label: 'Other', emoji: '\u{1F396}\u{FE0F}' },
]

const SPECIALIZATIONS = [
  'Weight Loss', 'Muscle Building', 'Flexibility', 'Rehabilitation',
  'Sports Performance', 'Endurance', 'Strength', 'Balance', 'Kids Coaching',
]

const GOALS = [
  'Lose weight', 'Build muscle', 'Learn to swim', 'Run faster',
  'Play tennis', 'Recover from injury', 'Get flexible', 'General fitness',
]

const LANGUAGES = ['English', 'Mandarin', 'Malay', 'Tamil', 'Other']

const CANCELLATION_POLICIES = [
  { value: '24h', label: '24 hours before session' },
  { value: '12h', label: '12 hours before session' },
  { value: 'none', label: 'No cancellation allowed' },
]

interface CoachForm {
  coachType: string
  displayName: string
  bio: string
  yearsExperience: string
  languages: string[]
  specializations: string[]
  activities: string[]
  goals: string[]
  sessionPrice: string
  privateSessionPrice: string
  freeTrialOffered: boolean
  city: string
  venues: string
  cancellationPolicy: string
}

const INITIAL_FORM: CoachForm = {
  coachType: '',
  displayName: '',
  bio: '',
  yearsExperience: '',
  languages: [],
  specializations: [],
  activities: [],
  goals: [],
  sessionPrice: '',
  privateSessionPrice: '',
  freeTrialOffered: false,
  city: 'Singapore',
  venues: '',
  cancellationPolicy: '24h',
}

const TOTAL_STEPS = 4

export default function CoachOnboardingPage() {
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CoachForm>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setForm((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  // Pre-fill display name from Clerk
  useEffect(() => {
    if (isLoaded && clerkUser && !form.displayName) {
      const name = clerkUser.fullName || clerkUser.firstName || ''
      if (name) {
        setForm((prev) => ({ ...prev, displayName: name }))
      }
    }
  }, [isLoaded, clerkUser, form.displayName])

  // Save draft to localStorage whenever form changes
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  const updateField = useCallback(<K extends keyof CoachForm>(key: K, value: CoachForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  function toggleArrayField(key: 'languages' | 'specializations' | 'activities' | 'goals', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }

  function validateStep(s: number): boolean {
    if (s === 1) {
      if (!form.coachType) { toast.error('Select your coach type'); return false }
      if (!form.displayName.trim()) { toast.error('Enter your display name'); return false }
      if (!form.bio.trim()) { toast.error('Add a short bio'); return false }
      if (!form.yearsExperience) { toast.error('Enter your years of experience'); return false }
      if (form.languages.length === 0) { toast.error('Select at least one language'); return false }
    }
    if (s === 2) {
      if (form.specializations.length === 0) { toast.error('Select at least one specialization'); return false }
      if (form.activities.length === 0) { toast.error('Select at least one activity'); return false }
      if (form.goals.length === 0) { toast.error('Select at least one goal'); return false }
    }
    if (s === 3) {
      if (!form.sessionPrice) { toast.error('Enter your session price'); return false }
      if (!form.privateSessionPrice) { toast.error('Enter your private session price'); return false }
      if (!form.city.trim()) { toast.error('Enter your city'); return false }
    }
    return true
  }

  function nextStep() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!confirmed) {
      toast.error('Please confirm your information is accurate')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/coaches/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: form.coachType,
          displayName: form.displayName,
          bio: form.bio,
          experienceYears: parseInt(form.yearsExperience, 10),
          languages: form.languages,
          specializations: form.specializations,
          sportsOffered: form.activities,
          goals: form.goals,
          groupRate: parseFloat(form.sessionPrice),
          hourlyRate: parseFloat(form.privateSessionPrice),
          freeTrialOffered: form.freeTrialOffered,
          serviceCity: form.city,
          venues: form.venues.split(',').map((v) => v.trim()).filter(Boolean),
          cancellationPolicy: form.cancellationPolicy,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong')
        return
      }

      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      setSubmitted(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Application submitted!
          </h1>
          <p className="text-[#666666] text-sm mb-8">
            We&apos;ll review your application within 48 hours. You&apos;ll receive an email once your coach profile is approved.
          </p>
          <button
            onClick={() => router.push('/buddy')}
            className="rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2A2A2A] transition-colors"
          >
            Go to homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-32">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step
                  ? 'bg-[#1A1A1A]'
                  : 'bg-neutral-200 dark:bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: About you */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              About you
            </h1>
            <p className="text-sm text-[#666666] mb-8">
              Tell us about your coaching background.
            </p>

            <div className="space-y-6">
              {/* Coach type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-3">
                  Coach type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COACH_TYPES.map((type) => {
                    const selected = form.coachType === type.key
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => updateField('coachType', type.key)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                          selected
                            ? 'border-black bg-black text-white dark:border-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-black/[0.06] dark:bg-[#1A1A1A] dark:text-[#4A4A5A]'
                        }`}
                      >
                        <span className="text-xl">{type.emoji}</span>
                        <span>{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  Display name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  Short bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="e.g. Certified personal trainer with 5 years of experience. Specializing in strength and conditioning."
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20 resize-none"
                />
                <p className="mt-1 text-xs text-neutral-400 text-right">{form.bio.length}/500</p>
              </div>

              {/* Years of experience */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  Years of experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={form.yearsExperience}
                  onChange={(e) => updateField('yearsExperience', e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-3">
                  Languages <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const selected = form.languages.includes(lang)
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayField('languages', lang)}
                        className={`rounded-full px-4 py-2 text-xs font-medium border transition-all ${
                          selected
                            ? 'border-black bg-black text-white dark:border-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-black/[0.06] dark:bg-[#1A1A1A] dark:text-[#4A4A5A]'
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: What you offer */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              What you offer
            </h1>
            <p className="text-sm text-[#666666] mb-8">
              Help students find the right coach.
            </p>

            <div className="space-y-6">
              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-3">
                  Specializations <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((spec) => {
                    const selected = form.specializations.includes(spec)
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleArrayField('specializations', spec)}
                        className={`rounded-full px-4 py-2 text-xs font-medium border transition-all ${
                          selected
                            ? 'border-black bg-black text-white dark:border-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-black/[0.06] dark:bg-[#1A1A1A] dark:text-[#4A4A5A]'
                        }`}
                      >
                        {spec}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-3">
                  Sports / activities you coach <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map((activity) => {
                    const selected = form.activities.includes(activity.key)
                    return (
                      <button
                        key={activity.key}
                        type="button"
                        onClick={() => toggleArrayField('activities', activity.key)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                          selected
                            ? 'border-black bg-black text-white dark:border-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-black/[0.06] dark:bg-[#1A1A1A] dark:text-[#4A4A5A]'
                        }`}
                      >
                        <span className="text-xl">{activity.emoji}</span>
                        <span>{activity.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-3">
                  Goals you help with <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => {
                    const selected = form.goals.includes(goal)
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleArrayField('goals', goal)}
                        className={`rounded-full px-4 py-2 text-xs font-medium border transition-all ${
                          selected
                            ? 'border-black bg-black text-white dark:border-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-black/[0.06] dark:bg-[#1A1A1A] dark:text-[#4A4A5A]'
                        }`}
                      >
                        {goal}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing & location */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Pricing &amp; location
            </h1>
            <p className="text-sm text-[#666666] mb-8">
              Set your rates and where you coach.
            </p>

            <div className="space-y-6">
              {/* Session price */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  Group session price (SGD per person) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sessionPrice}
                  onChange={(e) => updateField('sessionPrice', e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20"
                />
              </div>

              {/* Private session price */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  Private session price (SGD, 1-on-1) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.privateSessionPrice}
                  onChange={(e) => updateField('privateSessionPrice', e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20"
                />
              </div>

              {/* Free trial toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-[#4A4A5A]">
                  Offer free trial session?
                </label>
                <button
                  type="button"
                  onClick={() => updateField('freeTrialOffered', !form.freeTrialOffered)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    form.freeTrialOffered
                      ? 'bg-[#1A1A1A]'
                      : 'bg-neutral-200 dark:bg-neutral-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#1A1A1A] transition-transform shadow-sm ${
                      form.freeTrialOffered ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Singapore"
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20"
                />
              </div>

              {/* Venues */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-2">
                  Training venues
                </label>
                <input
                  type="text"
                  value={form.venues}
                  onChange={(e) => updateField('venues', e.target.value)}
                  placeholder="e.g. ActiveSG Gym, East Coast Park, Online"
                  className="w-full rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-black/20"
                />
                <p className="mt-1 text-xs text-neutral-400">Comma separated</p>
              </div>

              {/* Cancellation policy */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] mb-3">
                  Cancellation policy
                </label>
                <div className="space-y-2">
                  {CANCELLATION_POLICIES.map((policy) => {
                    const selected = form.cancellationPolicy === policy.value
                    return (
                      <button
                        key={policy.value}
                        type="button"
                        onClick={() => updateField('cancellationPolicy', policy.value)}
                        className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                          selected
                            ? 'border-black bg-black text-white dark:border-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-black/[0.06] dark:bg-[#1A1A1A] dark:text-[#4A4A5A]'
                        }`}
                      >
                        <span className="font-medium">{policy.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & submit */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Review &amp; submit
            </h1>
            <p className="text-sm text-[#666666] mb-8">
              Make sure everything looks good.
            </p>

            <div className="space-y-6">
              {/* Summary sections */}
              <div className="rounded-xl border border-neutral-200 dark:border-black/[0.06] divide-y divide-neutral-200 dark:divide-black/[0.06]">
                <SummarySection title="About you">
                  <SummaryRow label="Coach type" value={COACH_TYPES.find((t) => t.key === form.coachType)?.label || '-'} />
                  <SummaryRow label="Display name" value={form.displayName} />
                  <SummaryRow label="Bio" value={form.bio} />
                  <SummaryRow label="Experience" value={`${form.yearsExperience} years`} />
                  <SummaryRow label="Languages" value={form.languages.join(', ')} />
                </SummarySection>

                <SummarySection title="What you offer">
                  <SummaryRow label="Specializations" value={form.specializations.join(', ')} />
                  <SummaryRow label="Activities" value={form.activities.map((a) => ACTIVITY_TYPES.find((t) => t.key === a)?.label || a).join(', ')} />
                  <SummaryRow label="Goals" value={form.goals.join(', ')} />
                </SummarySection>

                <SummarySection title="Pricing & location">
                  <SummaryRow label="Group price" value={`SGD ${form.sessionPrice}`} />
                  <SummaryRow label="Private price" value={`SGD ${form.privateSessionPrice}`} />
                  <SummaryRow label="Free trial" value={form.freeTrialOffered ? 'Yes' : 'No'} />
                  <SummaryRow label="City" value={form.city} />
                  {form.venues && <SummaryRow label="Venues" value={form.venues} />}
                  <SummaryRow label="Cancellation" value={CANCELLATION_POLICIES.find((p) => p.value === form.cancellationPolicy)?.label || '-'} />
                </SummarySection>
              </div>

              {/* Confirm checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-300 dark:border-black/[0.08] text-black dark:text-[#1A1A1A] focus:ring-black dark:focus:ring-black/20"
                />
                <span className="text-sm text-neutral-700 dark:text-[#4A4A5A]">
                  I confirm my information is accurate
                </span>
              </label>

              <p className="text-xs text-neutral-400 text-center">
                We&apos;ll review your application within 48 hours.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 mt-10">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-black/[0.06] bg-white dark:bg-[#1A1A1A] px-4 py-3 text-sm font-medium text-neutral-700 dark:text-[#4A4A5A] hover:border-neutral-400 dark:hover:border-black/[0.12] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="flex-1" />

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1 rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2A2A2A] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application \u2192'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-[#666666] flex-shrink-0 w-28">{label}</span>
      <span className="text-white">{value || '-'}</span>
    </div>
  )
}
