'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Loader2, Camera } from 'lucide-react'
import { toast } from 'sonner'

const FITNESS_INTERESTS = [
  { slug: 'running', label: 'Running', emoji: '🏃' },
  { slug: 'cycling', label: 'Cycling', emoji: '🚴' },
  { slug: 'yoga', label: 'Yoga', emoji: '🧘' },
  { slug: 'strength', label: 'Strength Training', emoji: '🏋️' },
  { slug: 'hiking', label: 'Hiking', emoji: '🥾' },
  { slug: 'bootcamp', label: 'Bootcamp', emoji: '🎖️' },
  { slug: 'pilates', label: 'Pilates', emoji: '🦢' },
  { slug: 'hiit', label: 'HIIT', emoji: '⚡' },
  { slug: 'swimming', label: 'Swimming', emoji: '🏊' },
  { slug: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { slug: 'basketball', label: 'Basketball', emoji: '🏀' },
  { slug: 'cold_plunge', label: 'Cold Plunge', emoji: '🧊' },
]

const FITNESS_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Just getting started' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Comfortable with most workouts' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Training regularly, high intensity' },
]

export default function P2POnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: clerkUser, isLoaded } = useUser()
  const redirectTo = searchParams.get('redirect') || '/buddy'

  const [bio, setBio] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [fitnessLevel, setFitnessLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if already onboarded
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/user/p2p-onboarding')
        if (res.ok) {
          const data = await res.json()
          if (data.completed) {
            router.replace(redirectTo)
            return
          }
          // Pre-fill existing data
          if (data.user?.bio) setBio(data.user.bio)
          if (data.user?.fitnessInterests?.length) setSelectedInterests(data.user.fitnessInterests)
          if (data.user?.fitnessLevel) setFitnessLevel(data.user.fitnessLevel)
        }
      } catch {
        // ignore
      } finally {
        setChecking(false)
      }
    }
    if (isLoaded) check()
  }, [isLoaded, router, redirectTo])

  function toggleInterest(slug: string) {
    setSelectedInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!bio.trim()) {
      toast.error('Add a short bio')
      return
    }
    if (selectedInterests.length === 0) {
      toast.error('Pick at least one interest')
      return
    }
    if (!fitnessLevel) {
      toast.error('Select your fitness level')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/p2p-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio.trim(), fitnessInterests: selectedInterests, fitnessLevel }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong')
        return
      }

      toast.success('Profile set up!')
      router.push(redirectTo)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF8]">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Who should we introduce you to?
          </h1>
          <p className="mt-2 text-[#71717A] text-sm">
            30 seconds. We&apos;ll find the crews that sweat like you do.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {clerkUser?.imageUrl ? (
                <Image
                  src={clerkUser.imageUrl}
                  alt="Your photo"
                  width={80}
                  height={80}
                  className="rounded-full object-cover ring-2 ring-black/[0.06]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white border border-black/[0.06] flex items-center justify-center">
                  <Camera className="w-7 h-7 text-[#71717A]" />
                </div>
              )}
            </div>
            {!clerkUser?.imageUrl && (
              <p className="text-xs text-[#71717A]">
                Add a photo in your{' '}
                <a href="/settings/profile" className="underline">
                  profile settings
                </a>
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A5A] mb-2">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Morning runner, love exploring new routes. 5 days/week."
              maxLength={100}
              rows={3}
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
            />
            <p className="mt-1 text-xs text-[#71717A] text-right">{bio.length}/100</p>
          </div>

          {/* Fitness Interests */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A5A] mb-3">
              What makes you sweat? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FITNESS_INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest.slug)
                return (
                  <button
                    key={interest.slug}
                    type="button"
                    onClick={() => toggleInterest(interest.slug)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                      selected
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
                    }`}
                  >
                    <span className="text-xl">{interest.emoji}</span>
                    <span>{interest.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fitness Level */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A5A] mb-3">
              Fitness level <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {FITNESS_LEVELS.map((level) => {
                const selected = fitnessLevel === level.value
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFitnessLevel(level.value)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                      selected
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-black/[0.06] bg-white text-[#4A4A5A] hover:border-black/[0.12]'
                    }`}
                  >
                    <span className="font-medium">{level.label}</span>
                    <span className={`text-xs ${selected ? 'opacity-70' : 'text-[#71717A]'}`}>
                      {level.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#1A1A1A] px-4 py-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Show me my people →'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
