'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

const ONBOARDING_ACTIVITIES = ACTIVITY_TYPES.filter((a) => a.tier === 1 || a.tier === 2)

const FITNESS_LEVELS = [
  {
    value: 'BEGINNER',
    emoji: '🌱',
    label: 'Beginner',
    description: 'Just getting started or getting back into it',
  },
  {
    value: 'INTERMEDIATE',
    emoji: '💪',
    label: 'Intermediate',
    description: 'Regular workouts, comfortable with most activities',
  },
  {
    value: 'ADVANCED',
    emoji: '🔥',
    label: 'Advanced',
    description: 'Pushing limits, love a challenge',
  },
] as const

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current ? 'w-6 bg-white' : i < current ? 'w-2 bg-white/40' : 'w-2 bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}

export default function P2POnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: clerkUser, isLoaded } = useUser()
  const redirectTo = searchParams.get('redirect') || '/buddy'

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [fitnessLevel, setFitnessLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)
  const [completed, setCompleted] = useState(false)

  // Pre-fill first name from Clerk
  useEffect(() => {
    if (clerkUser?.firstName) {
      setFirstName(clerkUser.firstName)
    }
  }, [clerkUser?.firstName])

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

  function goNext() {
    setDirection(1)
    setStep((s) => Math.min(s + 1, 2))
  }

  function goBack() {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  function toggleInterest(key: string) {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  const handleComplete = useCallback(async () => {
    if (!fitnessLevel) {
      toast.error('Select your fitness level')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/p2p-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: '',
          fitnessInterests: selectedInterests,
          fitnessLevel,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong')
        return
      }

      setCompleted(true)
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }, [fitnessLevel, selectedInterests, redirectTo, router])

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="w-6 h-6 animate-spin text-[#666666]" />
      </div>
    )
  }

  // Completion state
  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-black" strokeWidth={3} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-xl font-semibold text-white"
        >
          You&apos;re in. Now show up.
        </motion.p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-32">
        <ProgressDots current={step} total={3} />

        {/* Back button for steps > 0 */}
        {step > 0 && (
          <button
            onClick={goBack}
            className="mb-4 text-sm text-[#666666] hover:text-[#999999] transition-colors"
          >
            &#8592; Back
          </button>
        )}

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Welcome */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="text-center pt-8">
                  <h1 className="text-3xl font-bold text-white">
                    What moves you?
                  </h1>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {clerkUser?.imageUrl ? (
                    <Image
                      src={clerkUser.imageUrl}
                      alt="Your photo"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black text-2xl font-bold">
                      {firstName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#999999] mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    className="w-full rounded-2xl border border-[#333333] bg-[#1A1A1A] px-4 py-3.5 text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  />
                </div>

                <button
                  onClick={goNext}
                  disabled={!firstName.trim()}
                  className="w-full rounded-full bg-white px-4 py-4 text-sm font-bold uppercase tracking-wider text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2: Activities */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center pt-4">
                  <h1 className="text-2xl font-bold text-white">
                    Pick your thing.
                  </h1>
                  <p className="mt-2 text-sm text-[#999999]">
                    Select as many as you want
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {ONBOARDING_ACTIVITIES.map((activity) => {
                    const selected = selectedInterests.includes(activity.key)
                    return (
                      <button
                        key={activity.key}
                        type="button"
                        onClick={() => toggleInterest(activity.key)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all duration-200 ${
                          selected
                            ? 'bg-white text-black scale-105 shadow-md'
                            : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-white/[0.1]'
                        }`}
                      >
                        <span className="text-3xl">{activity.emoji}</span>
                        <span className="text-xs font-medium leading-tight text-center">
                          {activity.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={goNext}
                    disabled={selectedInterests.length === 0}
                    className="w-full rounded-full bg-white px-4 py-4 text-sm font-bold uppercase tracking-wider text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Continue
                  </button>
                  <button
                    onClick={goNext}
                    className="w-full text-sm text-[#666666] hover:text-[#999999] transition-colors py-2"
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Fitness Level */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center pt-4">
                  <h1 className="text-2xl font-bold text-white">
                    Where are you at?
                  </h1>
                  <p className="mt-2 text-sm text-[#999999]">
                    Helps us find the right sessions for you
                  </p>
                </div>

                <div className="space-y-3">
                  {FITNESS_LEVELS.map((level) => {
                    const selected = fitnessLevel === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFitnessLevel(level.value)}
                        className={`w-full flex items-start gap-4 rounded-2xl p-5 text-left transition-all duration-200 ${
                          selected
                            ? 'bg-white text-black shadow-md scale-[1.02]'
                            : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-white/[0.1]'
                        }`}
                      >
                        <span className="text-3xl mt-0.5">{level.emoji}</span>
                        <div>
                          <span className="text-base font-semibold block">
                            {level.label}
                          </span>
                          <span
                            className={`text-sm mt-0.5 block ${
                              selected ? 'text-white/70' : 'text-[#666666]'
                            }`}
                          >
                            {level.description}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleComplete}
                  disabled={!fitnessLevel || saving}
                  className="w-full rounded-full bg-white px-4 py-4 text-sm font-bold uppercase tracking-wider text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "I'm in"
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
