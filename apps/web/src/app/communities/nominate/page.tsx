'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
interface NominationForm {
  communityName: string
  sourceUrl: string
  note: string
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
  sourceUrl: '',
  note: '',
}

export default function NominateCommunityPage() {
  const [form, setForm] = useState<NominationForm>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [submission, setSubmission] = useState<SubmissionResult | null>(null)

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
          city: 'Singapore',
          category: null,
          sourceUrl: form.sourceUrl.trim(),
          note: form.note.trim() || null,
          submitterName: null,
          submitterEmail: null,
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
      <main className="sb-page px-4 py-6 pb-28 md:pb-8" data-sb-paper-shell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
          <Link
            href="/communities"
            className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#17130E]/68 hover:text-[#17130E]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>

          <div className="sb-surface p-5">
            <p className="sb-eyebrow mb-2">
              {submission.requiresReview ? 'Submitted' : 'Listed'}
            </p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {submission.requiresReview
                ? `${submission.name} is queued for a quick trust check.`
                : `${submission.name} was received.`}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#17130E]/68">
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
                Suggest another
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
    <main className="sb-page px-4 py-5 pb-28 md:py-8 md:pb-8" data-sb-paper-shell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/communities"
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#17130E]/68 hover:text-[#17130E] md:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to communities
        </Link>

        <div className="mb-5 md:mb-7">
          <p className="sb-eyebrow mb-2">
            Suggest a community
          </p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Know a fitness community we should include?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#17130E]/68">
            Send us its name and official link. New suggestions stay queued while we verify them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="sb-surface space-y-4 p-4 sm:p-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#17130E]/62">
              Community name
            </label>
            <input
              value={form.communityName}
              onChange={(event) => update('communityName', event.target.value)}
              placeholder="Example: Running Department"
              maxLength={160}
              className="w-full rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-4 py-3 text-sm text-[#17130E] outline-none placeholder:text-[#17130E]/42 focus:border-[#E8412C]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#17130E]/62">
              Official or listing link
            </label>
            <input
              value={form.sourceUrl}
              onChange={(event) => update('sourceUrl', event.target.value)}
              placeholder="Instagram, website, Telegram, WhatsApp, Strava, or listing URL..."
              maxLength={500}
              className="w-full rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-4 py-3 text-sm text-[#17130E] outline-none placeholder:text-[#17130E]/42 focus:border-[#E8412C]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#17130E]/62">
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              placeholder="Optional: usual meet spot, schedule, or what makes the community welcoming."
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-4 py-3 text-sm text-[#17130E] outline-none placeholder:text-[#17130E]/42 focus:border-[#E8412C]"
            />
          </div>

          <p className="text-xs leading-5 text-[#17130E]/58">
            Manage an existing listing? Email support@sweatbuddies.co for claims, corrections, or removal requests.
          </p>

          <div className="flex flex-col gap-3 border-t-2 border-[#17130E]/18 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#17130E]/62">
              We will classify and verify it during review.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="sb-button-primary h-12 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit community
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
