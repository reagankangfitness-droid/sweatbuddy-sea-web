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

interface NominationForm {
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

  function update(field: keyof NominationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
      const res = await fetch('/api/community-nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityName: form.communityName.trim(),
          city: form.city.trim(),
          category: form.category || null,
          sourceUrl: form.sourceUrl.trim(),
          note: form.note.trim() || null,
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
        toast.success('Submitted for a quick review')
      } else if (data.duplicate) {
        toast.success('This community is already listed')
      } else {
        toast.success('Submitted for review')
      }
    } catch {
      toast.error('Failed to submit nomination')
    } finally {
      setSaving(false)
    }
  }

  if (submission) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] px-4 py-8 pb-28 text-white md:pb-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
          <Link
            href="/communities"
            className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#999999] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to crews
          </Link>

          <div className="rounded-lg border border-white/10 bg-[#151515] p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#63FF8F]">
              {submission.requiresReview ? 'Submitted' : 'Listed'}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {submission.requiresReview
                ? `${submission.name} is queued for a quick trust check.`
                : `${submission.name} was received.`}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#AAAAAA]">
              {submission.requiresReview
                ? 'We will keep it out of public discovery until it passes a trust check or an approved manager claims it.'
                : submission.limited
                  ? 'It needs crew verification or a manager claim before broad public discovery.'
                  : 'If it is already listed, people can find the existing crew page from the event map.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSubmission(null)}
                className="rounded-full bg-[#63FF8F] px-4 py-3 text-sm font-bold text-black hover:bg-[#83FFA6]"
              >
                List another
              </button>
              {submission.slug && (
                <Link
                  href={`/communities/${submission.slug}`}
                  className="rounded-full border border-white/15 px-4 py-3 text-sm font-bold text-white hover:bg-white/5"
                >
                  View community
                </Link>
              )}
              <Link
                href="/communities"
                className="rounded-full border border-white/15 px-4 py-3 text-sm font-bold text-white hover:bg-white/5"
              >
                Browse crews
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-8 pb-28 text-white md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/communities"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#999999] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to crews
        </Link>

        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#63FF8F]">
            Suggest a crew
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Help us verify the crew behind local fitness events.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#AAAAAA]">
            Send the official page or group link. New suggestions stay queued until the crew is verified or a manager claim is approved.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-white/10 bg-[#151515] p-5 sm:p-6">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
              Community name
            </label>
            <input
              value={form.communityName}
              onChange={(event) => update('communityName', event.target.value)}
              placeholder="Example: Running Department"
              maxLength={160}
              className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
                City
              </label>
              <input
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="Singapore"
                maxLength={100}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
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
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
              Official link
            </label>
            <input
              value={form.sourceUrl}
              onChange={(event) => update('sourceUrl', event.target.value)}
              placeholder="Instagram, website, Telegram, WhatsApp, Strava..."
              maxLength={500}
              className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              placeholder="Anything useful for verification: usual meet spot, who it is for, or why it belongs here."
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
                Your name
              </label>
              <input
                value={form.submitterName}
                onChange={(event) => update('submitterName', event.target.value)}
                placeholder="Optional"
                maxLength={160}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#777777]">
                Email
              </label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={(event) => update('submitterEmail', event.target.value)}
                placeholder="Optional"
                maxLength={255}
                className="w-full rounded-lg border border-white/15 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#63FF8F]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#2A2A2A] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#777777]">
              {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.label}` : 'We can classify it during review.'}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-5 text-sm font-bold text-black transition-colors hover:bg-[#83FFA6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Suggest crew
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
