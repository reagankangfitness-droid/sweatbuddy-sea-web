'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogoWithText } from '@/components/logo'
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
type Step = (typeof STEPS)[number]

const TOP_ACTIVITIES = ACTIVITY_TYPES.slice(0, 12)

const HOST_OUTCOMES = [
  {
    icon: MapPin,
    title: 'Be visible where people choose plans',
    body: 'Show up where people nearby are actively looking for run clubs, yoga groups, pickleball crews, and wellness events.',
  },
  {
    icon: Users,
    title: 'Turn first-timers into regulars',
    body: 'Give new people a clear page, upcoming sessions, and an easy reason to come back after the first visit.',
  },
  {
    icon: CreditCard,
    title: 'Stop chasing payments in chat',
    body: 'Run free sessions or collect paid spots without stitching together payment screenshots, reminders, and spreadsheets.',
  },
]

const HOST_SYSTEM = [
  {
    icon: CalendarPlus,
    title: 'Publish one joinable event',
    body: 'Create the session once, set capacity, add the location, and share one clean link.',
  },
  {
    icon: BarChart3,
    title: 'See what brings people back',
    body: 'Track who is joining, who is new, and which sessions build repeat attendance.',
  },
  {
    icon: MessageCircle,
    title: 'Keep chat for connection',
    body: 'Move discovery, sessions, payments, and attendance out of scattered DMs.',
  },
]

const LAUNCH_STEPS = [
  {
    label: '01',
    title: 'Tell us what you host',
    body: 'Run club, yoga, HIIT, pilates, pickleball, cold plunge, or any group people can join without already knowing someone.',
  },
  {
    label: '02',
    title: 'Make the first session easy to join',
    body: 'Clarify who it is for, what happens, where to go, and why a newcomer should feel comfortable showing up.',
  },
  {
    label: '03',
    title: 'Turn attendance into repeat community',
    body: 'Use sessions, community pages, and attendee history to bring people back instead of restarting every week.',
  },
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
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          activityType,
          city: city.trim(),
        }),
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
          <Link
            href="/"
            aria-label="SweatBuddies home"
            className="flex min-h-11 min-w-11 items-center"
          >
            <LogoWithText
              size={28}
              color="#FFFFFF"
              textColor="#FFFFFF"
              wordmarkClassName="max-[360px]:hidden"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/buddy"
              className="hidden min-h-11 items-center text-sm font-medium text-white/70 hover:text-white sm:inline-flex"
            >
              Find plans
            </Link>
            <Link
              href="/buddy?create=session"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#63FF8F] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#83FFA6]"
            >
              Host a session
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

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#63FF8F]">
              For fitness community hosts
            </p>
            <h1 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Make it easier for new people to walk in.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
              SweatBuddies helps fitness hosts show first-timers what happens, who it is for,
              who is going, and why showing up solo is okay.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buddy?create=session"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-7 py-4 text-sm font-bold uppercase tracking-wider text-black hover:bg-[#83FFA6]"
              >
                Host your first session <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="#launch-help"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10"
              >
                Need launch help?
              </Link>
            </div>
          </div>

          <div className="hidden rounded-xl border border-white/12 bg-[#111111]/85 p-4 shadow-2xl shadow-black/40 backdrop-blur lg:block">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#63FF8F]">
              What people see
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Upcoming session', value: 'Date, place, price, level' },
                { label: 'People signals', value: 'Going, solo-friendly, regulars' },
                { label: 'Verified details', value: 'Official page behind the plan' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3"
                >
                  <p className="text-sm font-black text-white">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{item.value}</p>
                </div>
              ))}
            </div>
            <Link
              href="/buddy"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 text-xs font-black uppercase tracking-wide text-white transition-colors hover:border-[#63FF8F]/60"
            >
              View discovery
            </Link>
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-3 gap-2 lg:col-span-2">
            {[
              { value: 'Nearby', label: 'discovery' },
              { value: 'Free + paid', label: 'sessions' },
              { value: 'Regulars', label: 'repeat attendance' },
            ].map((stat) => (
              <div key={stat.label} className="min-h-[72px] border-t border-white/20 pt-3">
                <p className="text-sm font-bold text-white sm:text-base">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">
                  {stat.label}
                </p>
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
              Your best sessions should not vanish after one Instagram story.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {HOST_OUTCOMES.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/[0.08] bg-[#151515] p-5"
                >
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
              Run the event. Let the page carry the proof.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              Keep WhatsApp, LINE, and Instagram for conversation. Use SweatBuddies for the parts
              that need structure: discovery, sessions, payments, attendance, and repeat turnout.
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

      <section id="launch-help" className="px-5 pb-20 sm:pb-28">
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
                Need help launching a crew?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                If you are not ready to post a session yet, tell us what you are building and we
                will point you in the right direction.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {step === 'activity' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
                  Launch help
                </p>
                <h2 className="text-2xl font-bold text-white leading-tight mb-2 sm:text-3xl">
                  What do people show up for?
                </h2>
                <p className="text-sm leading-relaxed text-neutral-400 mb-8">
                  Pick the closest activity so we can understand the problem you solve for members
                  and the sessions you want to fill.
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
              <form
                onSubmit={handleSubmit}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
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
                  We&apos;ll follow up only if we can help with your launch path.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Your name
                    </label>
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
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Singapore"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                >
                  {submitting ? 'Sending...' : 'Get launch help'}
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
                  We&apos;ll reach out if we can help shape the launch path. You can still post a
                  session anytime.
                </p>
                <Link
                  href="/buddy?create=session"
                  className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
                >
                  Host a session
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
