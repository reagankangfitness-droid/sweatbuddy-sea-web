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
    image: '/images/hosts/run-club-group.jpg',
    imageAlt: 'Fitness community gathering after a group plan',
    title: 'Be visible where people choose plans',
    body: 'Show up where people nearby are actively looking for run clubs, yoga groups, pickleball crews, and community workouts.',
  },
  {
    icon: Users,
    image: '/images/community-bonds.jpg',
    imageAlt: 'People connecting through a local wellness community',
    title: 'Turn first-timers into regulars',
    body: 'Give new people a clear community page, upcoming plans, and an easy reason to come back after the first visit.',
  },
  {
    icon: CreditCard,
    image: '/images/attendees-dashboard.png',
    imageAlt: 'Host dashboard showing attendee management',
    title: 'Stop chasing payments in chat',
    body: 'Run free plans or collect paid spots without stitching together payment screenshots, reminders, and spreadsheets.',
  },
]

const HOST_SYSTEM = [
  {
    icon: CalendarPlus,
    title: 'Publish one joinable plan',
    body: 'Create the plan once, set capacity, add the meeting point, and share one clean link.',
  },
  {
    icon: BarChart3,
    title: 'See what brings people back',
    body: 'Track who is joining, who is new, and which plans build repeat attendance.',
  },
  {
    icon: MessageCircle,
    title: 'Keep chat for connection',
    body: 'Move discovery, plans, payments, and attendance out of scattered DMs.',
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
    title: 'Make the first plan easy to join',
    body: 'Clarify who it is for, what happens, where to go, and why a newcomer should feel comfortable showing up.',
  },
  {
    label: '03',
    title: 'Turn attendance into repeat community',
    body: 'Use plans, community pages, and attendee history to bring people back instead of restarting every week.',
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
    <div className="min-h-screen bg-[#0B0D0C] text-white" data-sb-paper-shell data-sb-host-shell>
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
              className="sb-button-secondary px-4"
            >
              Post a plan
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[76svh] overflow-hidden px-5 pt-28 pb-14 sm:min-h-[78svh] sm:pt-32">
        <Image
          src="/images/organizers-bg.jpg"
          alt="A local fitness crew smiling together after a group plan"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C] via-[#0B0D0C]/20 to-transparent" />

        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#C6E76A]">
              For fitness community hosts
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Make it easier for new people to walk in.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72">
              SweatBuddies helps fitness hosts show first-timers what happens, who it is for,
              who is going, and why showing up solo is okay.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
              The easier it feels to arrive alone, the more first-timers actually show up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buddy?create=session"
                className="sb-button-primary px-5"
              >
                Post your first plan <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="#launch-help"
                className="sb-button-secondary px-5"
              >
                Need launch help?
              </Link>
            </div>
          </div>

          <div className="hidden rounded-lg border border-white/10 bg-[#111412]/85 p-4 shadow-xl shadow-black/25 backdrop-blur lg:block">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#C6E76A]">
              What people see
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Upcoming plan', value: 'Date, meeting point, price, level' },
                { label: 'People signals', value: 'Going, solo-friendly, regulars' },
                { label: 'Verified details', value: 'Official page behind the plan' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3"
                >
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{item.value}</p>
                </div>
              ))}
            </div>
            <Link
              href="/buddy"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:border-[#C6E76A]/60"
            >
              View discovery
            </Link>
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-3 gap-2 lg:col-span-2">
            {[
              { value: 'Nearby', label: 'discovery' },
              { value: 'Free + paid', label: 'plans' },
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
              Your best plans should not vanish after one Instagram story.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {HOST_OUTCOMES.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#151816]"
                >
                  <div className="relative aspect-[16/10] bg-[#222222]">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-[#111412] px-5 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
              Less admin, more momentum
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Run the plan. Let the page carry the proof.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              Keep WhatsApp, LINE, and Instagram for conversation. Use SweatBuddies for the parts
              that need structure: discovery, plans, payments, attendance, and repeat turnout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {HOST_SYSTEM.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-xl bg-[#1B1F1C] p-5">
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
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-white/[0.08] bg-[#151816] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[360px] overflow-hidden">
            <Image
              src="/images/hero-2.jpg"
              alt="Fitness community plan"
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
                If you are not ready to post a plan yet, tell us what you are building and we
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
                  and the plans you want to fill.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-8">
                  {TOP_ACTIVITIES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActivityType(t.key)}
                      className={`flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all ${
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
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-30"
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
                      className="min-h-11 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
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
                      className="min-h-11 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
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
                      className="min-h-11 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:opacity-30"
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
                  plan anytime.
                </p>
                <Link
                  href="/buddy?create=session"
                  className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
                >
                  Post a plan
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
