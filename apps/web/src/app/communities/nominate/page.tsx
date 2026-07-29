'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES as ACTIVITY_TYPES_CONFIG } from '@/lib/activity-types'

const ACTIVITY_TYPES = [
  ...ACTIVITY_TYPES_CONFIG.map((type) => ({
    slug: type.key,
    label: type.label,
    emoji: type.emoji,
  })),
  { slug: 'other', label: 'Other', emoji: '\u{1F3C5}' },
]

const REQUEST_INTENTS = [
  {
    value: 'submit',
    label: 'Submit community',
    description: 'Add a public community people can discover.',
  },
  {
    value: 'claim',
    label: 'Claim listing',
    description: 'I manage this community and want to keep it accurate.',
  },
  {
    value: 'update',
    label: 'Update info',
    description: 'Fix a schedule, area, category, or official link.',
  },
  {
    value: 'remove',
    label: 'Request removal',
    description: 'Ask us to take down or hide a listing.',
  },
] as const

type RequestIntent = typeof REQUEST_INTENTS[number]['value']

interface NominationForm {
  intent: RequestIntent
  communityName: string
  city: string
  category: string
  sourceUrl: string
  note: string
  submitterName: string
  submitterEmail: string
}

type SubmissionResult = {
  name: string
  slug?: string
  requiresReview: boolean
  limited: boolean
  duplicate: boolean
}

const INITIAL_FORM: NominationForm = {
  intent: 'submit',
  communityName: '',
  city: 'Singapore',
  category: '',
  sourceUrl: '',
  note: '',
  submitterName: '',
  submitterEmail: '',
}

export default function NominateCommunityPage() {
  const [form, setForm] = useState<NominationForm>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [submission, setSubmission] = useState<SubmissionResult | null>(null)

  const selectedCategory = useMemo(
    () => ACTIVITY_TYPES.find((type) => type.slug === form.category),
    [form.category]
  )
  const selectedIntent = useMemo(
    () => REQUEST_INTENTS.find((intent) => intent.value === form.intent) ?? REQUEST_INTENTS[0],
    [form.intent],
  )

  function update(field: keyof NominationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value as NominationForm[typeof field] }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    if (!form.communityName.trim()) {
      toast.error('Community name is required')
      return
    }
    if (!form.city.trim()) {
      toast.error('City is required')
      return
    }
    if (!form.sourceUrl.trim()) {
      toast.error('Official link is required')
      return
    }

    setSaving(true)
    try {
      const noteWithIntent = [
        `Request: ${selectedIntent.label}`,
        form.note.trim(),
      ].filter(Boolean).join('\n\n')

      const res = await fetch('/api/community-nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityName: form.communityName.trim(),
          city: form.city.trim(),
          category: form.category || null,
          sourceUrl: form.sourceUrl.trim(),
          note: noteWithIntent,
          submitterName: form.submitterName.trim() || null,
          submitterEmail: form.submitterEmail.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit nomination')
        return
      }

      setSubmission({
        name: data.community?.name ?? data.nomination?.communityName ?? form.communityName.trim(),
        slug: data.community?.slug,
        requiresReview: Boolean(data.requiresReview),
        limited: Boolean(data.limited),
        duplicate: Boolean(data.duplicate),
      })
      setForm(INITIAL_FORM)
      if (data.requiresReview) {
        toast.success('Request submitted for a quick review')
      } else if (data.duplicate) {
        toast.success('This community is already listed')
      } else {
        toast.success('Request submitted for review')
      }
    } catch {
      toast.error('Failed to submit nomination')
    } finally {
      setSaving(false)
    }
  }

  if (submission) {
    return (
      <main className="sb-page px-4 py-6 pb-28 md:pb-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
          <Link
            href="/communities"
            className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#999999] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>

          <div className="rounded-lg border border-white/10 bg-[#151515] p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#63FF8F]">
              {submission.requiresReview ? 'Submitted' : 'Listed'}
            </p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {submission.requiresReview
                ? `${submission.name} is queued for a quick trust check.`
                : `${submission.name} was received.`}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#AAAAAA]">
              {submission.requiresReview
                ? 'We will keep it out of public discovery until it passes a trust check or an approved manager claims it.'
                : submission.limited
                  ? 'It needs community verification or a manager claim before broad public discovery.'
                  : 'If it is already listed, people can find the existing community page from the directory.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSubmission(null)}
                className="sb-button-primary px-4 py-3 text-sm"
              >
                List another
              </button>
              {submission.slug && (
                <Link
                  href={`/communities/${submission.slug}`}
                  className="sb-button-secondary px-4 py-3 text-sm"
                >
                  View community
                </Link>
              )}
              <Link
                href="/communities"
                className="sb-button-secondary px-4 py-3 text-sm"
              >
                Browse communities
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="sb-page px-4 py-5 pb-28 md:py-8 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/communities"
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/68 hover:text-white md:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to communities
        </Link>

        <div className="mb-5 md:mb-7">
          <p className="sb-eyebrow mb-2">
            Community requests
          </p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Submit, claim, update, or remove a community listing.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">
            Send the official page or group link. New suggestions stay queued until the community is verified or a manager claim is approved.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="sb-surface space-y-4 p-4 sm:p-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
              What do you need?
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {REQUEST_INTENTS.map((intent) => {
                const active = form.intent === intent.value

                return (
                  <button
                    key={intent.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update('intent', intent.value)}
                    className={`min-h-[56px] rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-[#63FF8F]/55 bg-[#63FF8F]/8'
                        : 'border-white/12 bg-[#101010] hover:border-white/28'
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${active ? 'text-[#63FF8F]' : 'text-white'}`}>
                      {intent.label}
                    </span>
                    <span className="mt-1 hidden text-xs leading-5 text-white/64 sm:block">
                      {intent.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
              Community name
            </label>
            <input
              value={form.communityName}
              onChange={(event) => update('communityName', event.target.value)}
              placeholder="Example: Running Department"
              maxLength={160}
              className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#63FF8F]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
                City
              </label>
              <input
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="Singapore"
                maxLength={100}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#63FF8F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
                Activity
              </label>
              <select
                value={form.category}
                onChange={(event) => update('category', event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
              >
                <option value="">Not sure</option>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.slug} value={type.slug}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
              Official or listing link
            </label>
            <input
              value={form.sourceUrl}
              onChange={(event) => update('sourceUrl', event.target.value)}
              placeholder="Instagram, website, Telegram, WhatsApp, Strava, or listing URL..."
              maxLength={500}
              className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#63FF8F]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              placeholder="Anything useful: usual meet spot, what changed, owner proof, or why the listing should be removed."
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#63FF8F]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
                Your name
              </label>
              <input
                value={form.submitterName}
                onChange={(event) => update('submitterName', event.target.value)}
                placeholder="Optional"
                maxLength={160}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#63FF8F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/62">
                Email
              </label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={(event) => update('submitterEmail', event.target.value)}
                placeholder="Optional"
                maxLength={255}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#63FF8F]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#2A2A2A] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/62">
              {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.label}` : 'We can classify it during review.'}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="sb-button-primary h-12 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {selectedIntent.label}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
