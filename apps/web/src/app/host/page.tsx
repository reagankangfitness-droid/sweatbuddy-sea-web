'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ChevronRight, Check } from 'lucide-react'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

const STEPS = ['activity', 'details', 'done'] as const
type Step = typeof STEPS[number]

const TOP_ACTIVITIES = ACTIVITY_TYPES.slice(0, 12)

export default function BecomeAHostPage() {
  const [step, setStep] = useState<Step>('activity')
  const [activityType, setActivityType] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/host-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), activityType, city: city.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col lg:flex-row">

      {/* ── Left: Hero image ── */}
      <div className="relative lg:w-1/2 h-64 lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        <Image
          src="/images/hero-2.jpg"
          alt="Pilates session"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-transparent to-neutral-950/60" />

        {/* Logo overlay */}
        <div className="absolute top-6 left-6">
          <Link href="/">
            <Logo size={32} />
          </Link>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-20 max-w-lg lg:max-w-xl mx-auto w-full">

        {step === 'activity' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
              Apply to host
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
              What do you love to teach?
            </h1>
            <p className="text-neutral-400 mb-8">
              We&apos;re building SweatBuddies around real instructors and community leaders.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-8">
              {TOP_ACTIVITIES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActivityType(t.key)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center ${
                    activityType === t.key
                      ? 'border-white bg-white/10 text-white'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[11px] font-medium leading-tight">{t.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('details')}
              disabled={!activityType}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-neutral-900 text-sm font-bold disabled:opacity-30 hover:bg-neutral-100 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              type="button"
              onClick={() => setStep('activity')}
              className="text-xs text-neutral-500 hover:text-neutral-300 mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
              Almost there
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
              Where can we reach you?
            </h1>
            <p className="text-neutral-400 mb-8">
              We&apos;ll be in touch when your city opens up.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Reagan"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Email address <span className="text-white">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Singapore"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-neutral-900 text-sm font-bold disabled:opacity-30 hover:bg-neutral-100 transition-colors"
            >
              {submitting ? 'Sending…' : "I'm interested →"}
            </button>

            <p className="text-[11px] text-neutral-600 text-center mt-4">
              No spam. We&apos;ll only reach out when it matters.
            </p>
          </form>
        )}

        {step === 'done' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white mb-6">
              <Check className="w-7 h-7 text-neutral-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">You&apos;re on the list.</h1>
            <p className="text-neutral-400 mb-8 max-w-sm mx-auto">
              We&apos;ll reach out personally when we&apos;re ready to onboard hosts in your area.
              Keep doing what you love.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Explore sessions near you →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
