'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import {
  BarChart3,
  CalendarPlus,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
} from 'lucide-react'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

const STEPS = ['activity', 'details', 'done'] as const
type Step = typeof STEPS[number]

const TOP_ACTIVITIES = ACTIVITY_TYPES.slice(0, 12)

const HOST_OUTCOMES = [
  {
    icon: MapPin,
    title: 'Get discovered nearby',
    body: 'Show up where people are already looking for run clubs, yoga groups, pickleball crews, and social fitness plans.',
  },
  {
    icon: Users,
    title: 'Turn attendees into regulars',
    body: 'Build a community page, show upcoming sessions, and give new people an easy reason to come back.',
  },
  {
    icon: CreditCard,
    title: 'Run free or paid sessions',
    body: 'Launch open community plans, collect payments when needed, and keep the flow simple for members.',
  },
]

const HOST_SYSTEM = [
  { icon: CalendarPlus, title: 'Publish sessions', body: 'Create a plan, set capacity, add a location, and share one clean link.' },
  { icon: BarChart3, title: 'Track momentum', body: 'See who is joining, who is new, and which sessions are building repeat attendance.' },
  { icon: MessageCircle, title: 'Reduce admin', body: 'Spend less time stitching together Instagram, WhatsApp, PayNow, and spreadsheets.' },
]

const LAUNCH_STEPS = [
  { label: '01', title: 'Tell us your community type', body: 'Run club, yoga, HIIT, pilates, pickleball, cold plunge, or anything people can show up to together.' },
  { label: '02', title: 'We help shape the first offer', body: 'Position your crew, set the right first sessions, and make discovery simple for locals nearby.' },
  { label: '03', title: 'Grow with regulars, not random clicks', body: 'Use sessions, community pages, and attendee history to build a repeatable rhythm.' },
]

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
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" aria-label="SweatBuddies home">
            <Logo size={32} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/buddy" className="hidden text-sm font-medium text-white/70 hover:text-white sm:inline">
              Find a crew
            </Link>
            <Link
              href="#apply"
              className="rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-neutral-200"
            >
              Apply
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[86svh] overflow-hidden px-5 pt-28 pb-16 sm:min-h-[82svh] sm:pt-36">
        <Image
          src="/images/organizers-bg.jpg"
          alt="A local fitness crew smiling together after a session"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/20 to-transparent" />

        <div className="relative mx-auto flex max-w-6xl flex-col justify-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/60">
              For fitness community hosts
            </p>
            <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Grow your crew beyond the group chat.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
              SweatBuddies helps run clubs, yoga groups, pickleball crews, and local fitness hosts get discovered, fill sessions, collect payments, and bring people back.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#apply"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-wider text-black hover:bg-neutral-200"
              >
                Start hosting <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/communities"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10"
              >
                See communities
              </Link>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-3 gap-2">
            {[
              { value: 'Nearby', label: 'discovery' },
              { value: 'Free + paid', label: 'sessions' },
              { value: 'Regulars', label: 'growth loop' },
            ].map((stat) => (
              <div key={stat.label} className="min-h-[72px] border-t border-white/20 pt-3">
                <p className="text-sm font-bold text-white sm:text-base">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
              Why hosts use SweatBuddies
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Build a community people can actually find.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {HOST_OUTCOMES.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-xl border border-white/[0.08] bg-[#151515] p-5">
                  <Icon className="h-5 w-5 text-white" />
                  <h3 className="mt-5 text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-[#111111] px-5 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
              Less admin, more momentum
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Replace scattered tools with one community operating layer.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              Keep WhatsApp and Instagram for conversation. Use SweatBuddies for discovery, sessions, payments, attendance, and repeat growth.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {HOST_SYSTEM.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-xl bg-[#1A1A1A] p-5">
                  <Icon className="h-5 w-5 text-white" />
                  <h3 className="mt-5 text-sm font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {LAUNCH_STEPS.map((stepItem) => (
              <div key={stepItem.label} className="border-t border-white/[0.12] pt-5">
                <p className="text-xs font-bold text-neutral-600">{stepItem.label}</p>
                <h3 className="mt-4 text-xl font-bold text-white">{stepItem.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">{stepItem.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="px-5 pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151515] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[360px] overflow-hidden">
            <Image
              src="/images/hero-2.jpg"
              alt="Fitness community session"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
              <Sparkles className="mb-4 h-6 w-6 text-white" />
              <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
                Ready to grow your run club, yoga group, or fitness crew?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Apply once. We will follow up with the right launch path for your city and community type.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {step === 'activity' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
                  Apply to host
                </p>
                <h2 className="text-2xl font-bold text-white leading-tight mb-2 sm:text-3xl">
                  What community are you building?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-400 mb-8">
                  Pick the closest activity so we can understand your audience and launch path.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-8">
                  {TOP_ACTIVITIES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActivityType(t.key)}
                      className={`flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all ${
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-30"
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
                  className="mb-6 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
                >
                  Back
                </button>

                <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
                  Almost there
                </p>
                <h2 className="text-2xl font-bold text-white leading-tight mb-2 sm:text-3xl">
                  Where can we reach you?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-400 mb-8">
                  We&apos;ll help you launch or grow your crew when your city opens up.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Reagan"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
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
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Singapore"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-xs mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                >
                  {submitting ? 'Sending...' : "I'm interested"}
                </button>

                <p className="mt-4 text-center text-[11px] text-neutral-600">
                  No spam. We&apos;ll only reach out when it matters.
                </p>
              </form>
            )}

            {step === 'done' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <Check className="h-7 w-7 text-neutral-900" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">You&apos;re on the list.</h2>
                <p className="mx-auto mb-8 max-w-sm text-neutral-400">
                  We&apos;ll reach out personally when we&apos;re ready to help hosts grow communities in your area. Keep bringing people together.
                </p>
                <Link
                  href="/buddy"
                  className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
                >
                  Explore sessions near you
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
