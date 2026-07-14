'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Check, Loader2, X } from 'lucide-react'

type LeadType = 'USER' | 'HOST' | 'WEEKLY_DROP'
type ContactMethod = 'EMAIL' | 'WHATSAPP'

type LandingIntentCaptureProps = {
  type?: LeadType
  city?: string
  sourcePlacement: string
  ctaLabel: string
  className: string
  successHref?: string
  children: React.ReactNode
}

const cities = ['Singapore', 'Bangkok']
const activities = [
  'Run clubs',
  'Pickleball',
  'Yoga / pilates',
  'Gym / strength',
  'Recovery / ice bath',
  'Social wellness',
  'Not sure yet',
]
const comfortLevels = ['Beginner-friendly', 'Casual regular', 'Already active', 'New to the city']

export function LandingIntentCapture({
  type = 'USER',
  city,
  sourcePlacement,
  ctaLabel,
  className,
  successHref,
  children,
}: LandingIntentCaptureProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contactMethod, setContactMethod] = useState<ContactMethod>('EMAIL')
  const [form, setForm] = useState({
    city: city ?? 'Singapore',
    activityType: type === 'HOST' ? 'Run clubs' : 'Not sure yet',
    comfortLevel: 'Beginner-friendly',
    email: '',
    phone: '',
    name: '',
    communityName: '',
    contactLink: '',
  })

  const copy = useMemo(() => {
    if (type === 'HOST') {
      return {
        title: 'Host your next session.',
        body: 'Tell us what you host and where. SweatBuddies helps people nearby discover the session and show up.',
        submit: 'Start hosting',
        success: 'Got it. We will help you fill your next session.',
        next: 'Continue to host tools',
        href: successHref ?? '/host',
      }
    }

    if (type === 'WEEKLY_DROP') {
      return {
        title: 'Get the weekly fitness drop.',
        body: 'Tell us your city and we will send beginner-friendly crews and social sessions worth showing up for.',
        submit: 'Get the drop',
        success: 'You are on the list.',
        next: 'Browse sessions',
        href: successHref ?? '/buddy',
      }
    }

    return {
      title: city ? `Find your first crew in ${city}.` : 'Find your first crew.',
      body: 'Tell us what feels easiest to show up for. We will point you toward local crews that are easy to join alone.',
      submit: 'Find my crew',
      success: 'Got it. We know what kind of crew to look for.',
      next: city ? `Browse ${city}` : 'Browse sessions',
      href: successHref ?? (city ? `/${city.toLowerCase()}` : '/buddy'),
    }
  }, [city, successHref, type])

  function openModal() {
    setOpen(true)
    setError(null)
    setSubmitted(false)
    track('landing_cta_clicked', { action: 'intent_capture_open' })
    track('landing_intent_opened')
  }

  function closeModal() {
    if (!submitted) track('landing_intent_abandoned')
    setOpen(false)
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const email = form.email.trim()
    const phone = form.phone.trim()
    const needsEmail = type === 'HOST' || type === 'WEEKLY_DROP' || contactMethod === 'EMAIL'
    const needsPhone = contactMethod === 'WHATSAPP' && type === 'USER'

    if (needsEmail && !email) {
      setError('Add your email so we can follow up.')
      return
    }

    if (needsPhone && !phone) {
      setError('Add your WhatsApp number so we can follow up.')
      return
    }

    setLoading(true)
    const context = getPageContext()

    try {
      const response = await fetch('/api/landing-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          city: form.city,
          activityType: form.activityType,
          comfortLevel: type === 'USER' ? form.comfortLevel : undefined,
          contactMethod,
          email,
          phone,
          name: form.name,
          communityName: type === 'HOST' ? form.communityName : undefined,
          contactLink: type === 'HOST' ? form.contactLink : undefined,
          sourcePage: context.sourcePage,
          sourcePlacement,
          utmSource: context.utmSource,
          utmMedium: context.utmMedium,
          utmCampaign: context.utmCampaign,
          metadata: { ctaLabel },
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not save this yet.')
        return
      }

      setSubmitted(true)
      track('landing_intent_submitted', {
        city: form.city,
        activityType: form.activityType,
        comfortLevel: type === 'USER' ? form.comfortLevel : null,
        leadType: type,
      })
    } catch {
      setError('Could not save this yet. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function track(event: string, extra?: Record<string, string | number | boolean | null>) {
    const context = getPageContext()
    const body = JSON.stringify({
      event,
      metadata: {
        ctaLabel,
        leadType: type,
        sourcePlacement,
        sourcePage: context.sourcePage,
        city: form.city,
        ...extra,
      },
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
      return
    }

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <>
      <button type="button" onClick={openModal} className={className}>
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 px-3 py-3 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100svh-24px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0B0B] text-white shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#63FF8F]">
                  {type === 'HOST' ? 'For organisers' : 'Intent capture'}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{copy.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">{copy.body}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="ml-4 rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="px-5 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#63FF8F] text-[#111111]">
                  <Check size={22} strokeWidth={2.6} />
                </div>
                <h3 className="mt-5 text-2xl font-extrabold tracking-tight">{copy.success}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  You can keep browsing now. We will use your city, activity, and comfort level to shape better crew matches.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={copy.href}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#33E66C]"
                  >
                    {copy.next} <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
                  >
                    Stay here
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitLead} className="space-y-5 px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City">
                    <select
                      value={form.city}
                      onChange={(event) => updateForm('city', event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#63FF8F]"
                    >
                      {cities.map((option) => (
                        <option key={option} value={option} className="bg-[#101010]">
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={type === 'HOST' ? 'What do you host?' : 'What feels easiest?'}>
                    <select
                      value={form.activityType}
                      onChange={(event) => updateForm('activityType', event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#63FF8F]"
                    >
                      {activities.map((option) => (
                        <option key={option} value={option} className="bg-[#101010]">
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {type === 'USER' && (
                  <Field label="Comfort level">
                    <div className="grid grid-cols-2 gap-2">
                      {comfortLevels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateForm('comfortLevel', level)}
                          className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition-colors ${
                            form.comfortLevel === level
                              ? 'border-[#63FF8F] bg-[#63FF8F]/16 text-white'
                              : 'border-white/10 bg-white/[0.04] text-white/62 hover:bg-white/[0.08]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                {type === 'HOST' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Crew or session name">
                      <input
                        value={form.communityName}
                        onChange={(event) => updateForm('communityName', event.target.value)}
                        placeholder="Saturday run or crew name"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#63FF8F]"
                      />
                    </Field>
                    <Field label="Instagram or WhatsApp">
                      <input
                        value={form.contactLink}
                        onChange={(event) => updateForm('contactLink', event.target.value)}
                        placeholder="@crew or link"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#63FF8F]"
                      />
                    </Field>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {type !== 'USER' && (
                    <Field label="Name">
                      <input
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#63FF8F]"
                      />
                    </Field>
                  )}
                  <Field label="Preferred contact">
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                      {(['EMAIL', 'WHATSAPP'] as ContactMethod[]).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setContactMethod(method)}
                          className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
                            contactMethod === method ? 'bg-white text-black' : 'text-white/58 hover:text-white'
                          }`}
                        >
                          {method === 'EMAIL' ? 'Email' : 'WhatsApp'}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className={type === 'USER' ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
                  {(type !== 'USER' || contactMethod === 'EMAIL') && (
                    <Field label={type === 'HOST' || contactMethod === 'EMAIL' ? 'Email' : 'Email optional'}>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => updateForm('email', event.target.value)}
                        placeholder="you@email.com"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#63FF8F]"
                      />
                    </Field>
                  )}
                  {(type !== 'USER' || contactMethod === 'WHATSAPP') && (
                    <Field label={contactMethod === 'WHATSAPP' && type === 'USER' ? 'WhatsApp' : 'WhatsApp optional'}>
                      <input
                        value={form.phone}
                        onChange={(event) => updateForm('phone', event.target.value)}
                        placeholder="+65..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#63FF8F]"
                      />
                    </Field>
                  )}
                </div>

                {error && (
                  <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-7 py-4 text-sm font-bold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#33E66C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : null}
                  {copy.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </div>
  )
}

function getPageContext() {
  if (typeof window === 'undefined') {
    return { sourcePage: '/', utmSource: null, utmMedium: null, utmCampaign: null }
  }

  const params = new URLSearchParams(window.location.search)
  return {
    sourcePage: window.location.pathname,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  }
}
