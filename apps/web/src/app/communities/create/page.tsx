'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, X, ImagePlus, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES as ACTIVITY_TYPES_CONFIG } from '@/lib/activity-types'
import { useUploadThing } from '@/lib/uploadthing'

const ACTIVITY_TYPES = [
  ...ACTIVITY_TYPES_CONFIG.map((t) => ({ slug: t.key, label: t.label, emoji: t.emoji })),
  { slug: 'other', label: 'Other', emoji: '\u{1F3C5}' },
]

type Step = 'basics' | 'identity' | 'preview'

interface FormData {
  name: string
  category: string
  description: string
  city: string
  usualArea: string
  usualSchedule: string
  vibeTags: string
  priceType: string
  beginnerFriendly: boolean
  logoImage: string
  coverImage: string
  instagramHandle: string
  websiteUrl: string
  communityLink: string
  joinPlatform: string
  sourceUrl: string
}

const INITIAL_FORM: FormData = {
  name: '',
  category: '',
  description: '',
  city: 'Singapore',
  usualArea: '',
  usualSchedule: '',
  vibeTags: '',
  priceType: '',
  beginnerFriendly: false,
  logoImage: '',
  coverImage: '',
  instagramHandle: '',
  websiteUrl: '',
  communityLink: '',
  joinPlatform: '',
  sourceUrl: '',
}

const DRAFT_KEY = 'sb_community_draft'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basics')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const { startUpload } = useUploadThing('activityImage')

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setForm((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  // Save draft on form change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function parseTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8)
  }

  const STEPS: Step[] = ['basics', 'identity', 'preview']
  const stepIdx = STEPS.indexOf(step)

  function validateStep(s: Step): string | null {
    if (s === 'basics') {
      if (!form.name.trim()) return 'Community name is required'
      if (form.name.length > 60) return 'Name must be 60 characters or less'
      if (!form.category) return 'Category is required'
    }
    return null
  }

  function nextStep() {
    const error = validateStep(step)
    if (error) {
      toast.error(error)
      return
    }
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    }
  }

  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else router.back()
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category,
          city: form.city.trim() || null,
          usualArea: form.usualArea.trim() || null,
          usualSchedule: form.usualSchedule.trim() || null,
          vibeTags: parseTags(form.vibeTags),
          priceType: form.priceType || null,
          beginnerFriendly: form.beginnerFriendly,
          logoImage: form.logoImage || null,
          coverImage: form.coverImage || null,
          instagramHandle: form.instagramHandle.trim() || null,
          websiteUrl: form.websiteUrl.trim() || null,
          communityLink: form.communityLink.trim() || null,
          joinPlatform: form.joinPlatform || null,
          sourceUrl: form.sourceUrl.trim() || form.websiteUrl.trim() || form.communityLink.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create community')
        return
      }

      // Clear draft
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}
      if (data.requiresReview) {
        toast.success('Community saved for a quick trust check.')
      } else if (data.limited) {
        toast.success('Community listed with limited distribution until verified.')
      } else {
        toast.success('Community listed.')
      }
      router.push('/communities')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const selectedType = ACTIVITY_TYPES.find((t) => t.slug === form.category)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#333333]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={prevStep}
            aria-label="Go back"
            className="p-1 -ml-1 rounded-lg hover:bg-[#0D0D0D]"
          >
            <ArrowLeft className="w-5 h-5 text-[#666666]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">Create a Community</h1>
            <div
              className="flex gap-1 mt-1"
              role="progressbar"
              aria-valuenow={stepIdx + 1}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
            >
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= stepIdx ? 'bg-white' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 pb-48 md:pb-32">
        {/* Step 1: Basics */}
        {step === 'basics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">The basics</h2>
              <p className="text-sm text-[#666666] mt-1">
                Tell us about your community
              </p>
            </div>

            {/* Community name */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Community name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Marina Bay Run Club"
                maxLength={60}
                aria-required="true"
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <p className="mt-1 text-xs text-right text-[#666666]">
                {form.name.length}/60
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.slug}
                    type="button"
                    onClick={() => update('category', type.slug)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                      form.category === type.slug
                        ? 'border-[#1A1A1A] bg-white text-black'
                        : 'border-[#333333] bg-[#1A1A1A] text-[#666666] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{type.emoji}</span>
                    <span className="text-center leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Description{' '}
                <span className="text-[#666666] font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What's the vibe? Who's this for?"
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
              />
              <p className="mt-1 text-xs text-right text-[#666666]">
                {form.description.length}/500
              </p>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Singapore"
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#999999] mb-2">
                  Usual area
                </label>
                <input
                  type="text"
                  value={form.usualArea}
                  onChange={(e) => update('usualArea', e.target.value)}
                  placeholder="East Coast, CBD, Tanjong Pagar..."
                  maxLength={160}
                  className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#999999] mb-2">
                  Usual schedule
                </label>
                <input
                  type="text"
                  value={form.usualSchedule}
                  onChange={(e) => update('usualSchedule', e.target.value)}
                  placeholder="Wed evenings, weekend mornings..."
                  maxLength={220}
                  className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Vibe tags
              </label>
              <input
                type="text"
                value={form.vibeTags}
                onChange={(e) => update('vibeTags', e.target.value)}
                placeholder="social, beginner, women-only, competitive"
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <p className="mt-1 text-xs text-[#666666]">Separate tags with commas.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#999999] mb-2">
                  Price context
                </label>
                <select
                  value={form.priceType}
                  onChange={(e) => update('priceType', e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Not sure</option>
                  <option value="FREE">Mostly free</option>
                  <option value="PAID">Mostly paid</option>
                  <option value="MIXED">Free + paid</option>
                </select>
              </div>

              <label className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-[#999999]">
                <input
                  type="checkbox"
                  checked={form.beginnerFriendly}
                  onChange={(e) => update('beginnerFriendly', e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Beginner-friendly
              </label>
            </div>

            {/* Continue */}
            <button
              type="button"
              onClick={nextStep}
              className="w-full rounded-full bg-white px-4 py-4 text-sm font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Identity */}
        {step === 'identity' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Identity & links</h2>
              <p className="text-sm text-[#666666] mt-1">
                Brand your community and add social links
              </p>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Logo{' '}
                <span className="text-[#666666] font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                {form.logoImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logoImage}
                      alt="Logo preview"
                      className="w-24 h-24 rounded-full object-cover border border-[#333333]"
                    />
                    <button
                      type="button"
                      aria-label="Remove logo"
                      onClick={() => update('logoImage', '')}
                      className="absolute -top-1 -right-1 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 bg-[#1A1A1A] flex flex-col items-center justify-center gap-1 text-[#666666] hover:border-white/30 transition-colors"
                  >
                    {logoUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Upload logo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
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
                  setLogoUploading(true)
                  try {
                    const res = await startUpload([file])
                    if (res?.[0]?.url) {
                      update('logoImage', res[0].url)
                      toast.success('Logo uploaded')
                    }
                  } catch {
                    toast.error('Failed to upload image')
                  } finally {
                    setLogoUploading(false)
                    if (logoInputRef.current) logoInputRef.current.value = ''
                  }
                }}
              />
            </div>

            {/* Cover image upload */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Cover photo{' '}
                <span className="text-[#666666] font-normal">(optional)</span>
              </label>
              {form.coverImage ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="w-full h-40 object-cover rounded-xl border border-[#333333]"
                  />
                  <button
                    type="button"
                    aria-label="Remove cover photo"
                    onClick={() => update('coverImage', '')}
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
                  className="w-full h-40 rounded-xl border-2 border-dashed border-white/20 bg-[#1A1A1A] flex flex-col items-center justify-center gap-2 text-[#666666] hover:border-white/30 transition-colors"
                >
                  {coverUploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-sm font-medium">Upload cover photo</span>
                      <span className="text-xs text-[#666666]">JPG, PNG up to 8MB</span>
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
                      update('coverImage', res[0].url)
                      toast.success('Cover photo uploaded')
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

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Instagram{' '}
                <span className="text-[#666666] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.instagramHandle}
                onChange={(e) => update('instagramHandle', e.target.value)}
                placeholder="@yourcommunity"
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                Website{' '}
                <span className="text-[#666666] font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => update('websiteUrl', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            {/* WhatsApp / Telegram */}
            <div>
              <label className="block text-sm font-medium text-[#999999] mb-2">
                WhatsApp / Telegram link{' '}
                <span className="text-[#666666] font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.communityLink}
                onChange={(e) => update('communityLink', e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#999999] mb-2">
                  Join platform
                </label>
                <select
                  value={form.joinPlatform}
                  onChange={(e) => update('joinPlatform', e.target.value)}
                  className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Auto / unknown</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="STRAVA">Strava</option>
                  <option value="WEBSITE">Website</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#999999] mb-2">
                  Source URL
                </label>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(e) => update('sourceUrl', e.target.value)}
                  placeholder="Where should we verify this?"
                  className="w-full rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 rounded-full border border-[#333333] bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white hover:bg-[#0D0D0D] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 rounded-full bg-white px-4 py-4 text-sm font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Create */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Preview</h2>
              <p className="text-sm text-[#666666] mt-1">
                Here&apos;s how your community will look
              </p>
            </div>

            {/* Preview card */}
            <div className="bg-[#1A1A1A] border border-[#333333] shadow-sm rounded-2xl overflow-hidden">
              {/* Cover */}
              {form.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.coverImage}
                  alt="Cover"
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center text-4xl">
                  {selectedType?.emoji ?? '\u{1F3C5}'}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  {form.logoImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoImage}
                      alt="Logo"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white -mt-8 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2A2A2A] border-2 border-[#1A1A1A] flex items-center justify-center -mt-8 text-lg shadow-sm">
                      {selectedType?.emoji ?? '\u{1F3C5}'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-base font-semibold text-white truncate">
                      {form.name || 'Community Name'}
                    </h3>
                    <p className="text-xs text-[#666666] capitalize">
                      {selectedType?.label ?? form.category}
                    </p>
                  </div>
                </div>

                {form.description && (
                  <p className="mt-3 text-sm text-[#999999] line-clamp-3">
                    {form.description}
                  </p>
                )}

                {form.city && (
                  <div className="mt-3 flex items-center gap-1 text-sm text-[#666666]">
                    <MapPin className="w-3.5 h-3.5" />
                    {[form.usualArea, form.city].filter(Boolean).join(', ')}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    form.usualSchedule,
                    form.priceType ? form.priceType.toLowerCase().replace('_', ' ') : '',
                    form.beginnerFriendly ? 'beginner-friendly' : '',
                    ...parseTags(form.vibeTags),
                  ].filter(Boolean).slice(0, 6).map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#CCCCCC]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 rounded-full border border-[#333333] bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white hover:bg-[#0D0D0D] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCreate}
                className="flex-1 rounded-full bg-white px-4 py-4 text-sm font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Community'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
