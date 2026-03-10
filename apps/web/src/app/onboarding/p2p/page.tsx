'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const { user: clerkUser, isLoaded } = useUser()

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
            router.replace('/buddy')
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
  }, [isLoaded, router])

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
      router.push('/buddy')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Set up your buddy profile
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400 text-sm">
            Takes 60 seconds. Help others know who they&apos;re working out with.
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
                  className="rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-neutral-400" />
                </div>
              )}
            </div>
            {!clerkUser?.imageUrl && (
              <p className="text-xs text-neutral-400">
                Add a photo in your{' '}
                <a href="/settings/profile" className="underline">
                  profile settings
                </a>
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Morning runner, love exploring new routes. 5 days/week."
              maxLength={100}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
            <p className="mt-1 text-xs text-neutral-400 text-right">{bio.length}/100</p>
          </div>

          {/* Fitness Interests */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              What do you love? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FITNESS_INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest.slug)
                return (
                  <button
                    key={interest.slug}
                    type="button"
                    onClick={() => toggleInterest(interest.slug)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all ${
                      selected
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
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
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    <span className="font-medium">{level.label}</span>
                    <span className={`text-xs ${selected ? 'opacity-70' : 'text-neutral-400'}`}>
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
            className="w-full rounded-xl bg-black dark:bg-white px-4 py-4 text-sm font-semibold text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Find my workout buddies →'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
