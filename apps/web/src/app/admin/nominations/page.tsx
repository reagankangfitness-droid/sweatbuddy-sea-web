'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, ExternalLink, Loader2, RefreshCw, RotateCcw, X, Archive } from 'lucide-react'

type NominationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

type CommunityNomination = {
  id: string
  status: NominationStatus
  moderationStatus: 'LIVE' | 'LIMITED' | 'UNDER_REVIEW' | 'REJECTED' | 'BLOCKED'
  riskScore: number
  riskFlags: string[]
  communityId: string | null
  communityName: string
  city: string
  category: string | null
  sourceUrl: string
  note: string | null
  submitterName: string | null
  submitterEmail: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

type CommunityClaim = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  verificationUrl: string
  verificationCode: string
  verifiedAt: string | null
  createdAt: string
  community: {
    name: string
    slug: string
    moderationStatus: string
    verificationStatus: string
  }
  user: {
    name: string | null
    email: string
  }
  challenges: Array<{
    status: string
    attempts: number
    targetUrl: string
    expiresAt: string
    lastCheckedAt: string | null
    lastError: string | null
  }>
}

type ReviewDraft = {
  category: string
  city: string
  usualArea: string
  usualSchedule: string
  joinPlatform: string
  priceType: string
  beginnerFriendly: boolean
  vibeTags: string
  communityLink: string
  websiteUrl: string
  instagramHandle: string
  description: string
  adminNotes: string
}

const STATUS_FILTERS: Array<NominationStatus | 'all'> = ['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED', 'all']

const CATEGORY_OPTIONS = [
  'running',
  'yoga',
  'pickleball',
  'strength',
  'hiit',
  'bootcamp',
  'pilates',
  'cycling',
  'badminton',
  'basketball',
  'combat_fitness',
  'dance_fitness',
  'cold_plunge',
  'hiking',
  'other',
]

const PLATFORM_OPTIONS = ['telegram', 'whatsapp', 'instagram', 'strava', 'meetup', 'website', 'linktree', 'other']
const PRICE_OPTIONS = ['FREE', 'PAID', 'MIXED', 'MEMBERSHIP', 'PAY_WHAT_YOU_CAN']
const INPUT_CLASS = 'w-full min-h-11 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400 disabled:cursor-not-allowed disabled:opacity-60'

export default function AdminNominationsPage() {
  const [nominations, setNominations] = useState<CommunityNomination[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<NominationStatus | 'all'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState<CommunityClaim[]>([])
  const [claimCounts, setClaimCounts] = useState<Record<string, number>>({})
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({})

  const fetchNominations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`
      const res = await fetch(`/api/admin/community-nominations${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load nominations')
      setNominations(data.nominations ?? [])
      setCounts(data.counts ?? {})
      setDrafts((current) => {
        const next = { ...current }
        for (const nomination of data.nominations ?? []) {
          if (!next[nomination.id]) {
            next[nomination.id] = createDraft(nomination)
          }
        }
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nominations')
    } finally {
      setLoading(false)
    }
  }, [status])

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/community-claims')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load claims')
      setClaims(data.claims ?? [])
      setClaimCounts(data.counts ?? {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims')
    }
  }, [])

  useEffect(() => {
    fetchNominations()
    fetchClaims()
  }, [fetchClaims, fetchNominations])

  function updateDraft(id: string, patch: Partial<ReviewDraft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }))
  }

  async function reviewNomination(id: string, action: 'approve' | 'reject' | 'archive' | 'pending') {
    setReviewingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/community-nominations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(drafts[id] ?? {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')
      await fetchNominations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Growth loop</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-100 sm:text-3xl">Community nominations</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Review user-submitted communities, add the missing directory context, then approve only listings with a real official link.
          </p>
        </div>
        <button
          onClick={() => {
            void fetchNominations()
            void fetchClaims()
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 text-sm font-semibold text-neutral-200 hover:bg-neutral-900"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              status === filter
                ? 'bg-white text-neutral-950'
                : 'border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-100'
            }`}
          >
            {filter === 'all' ? 'All' : filter.toLowerCase()} {filter !== 'all' ? counts[filter] ?? 0 : ''}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Manager claims</h2>
            <p className="text-sm text-neutral-500">
              {claimCounts.PENDING ?? 0} pending · {claimCounts.APPROVED ?? 0} verified
            </p>
          </div>
        </div>
        {claims.length === 0 ? (
          <p className="text-sm text-neutral-500">No community manager claims yet.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {claims.slice(0, 6).map((claim) => {
              const latestChallenge = claim.challenges[0]
              return (
                <div key={claim.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass(claim.status)}`}>
                      {claim.status}
                    </span>
                    {latestChallenge && (
                      <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-300">
                        {latestChallenge.status} · {latestChallenge.attempts} tries
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-neutral-100">{claim.community.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {claim.user.name ?? claim.user.email} · {formatDate(claim.createdAt)}
                  </p>
                  <a
                    href={claim.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-xs text-lime-400 hover:text-lime-300"
                  >
                    {claim.verificationUrl}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  {latestChallenge?.lastError && (
                    <p className="mt-2 text-xs text-amber-300">{latestChallenge.lastError}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
        </div>
      ) : nominations.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-10 text-center text-neutral-500">
          No nominations in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {nominations.map((nomination) => {
            const draft = drafts[nomination.id] ?? createDraft(nomination)
            const isPending = nomination.status === 'PENDING'
            const isReviewing = reviewingId === nomination.id

            return (
              <article key={nomination.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass(nomination.status)}`}>
                        {nomination.status}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${moderationClass(nomination.moderationStatus)}`}>
                        {nomination.moderationStatus.replace('_', ' ')}
                      </span>
                      {nomination.riskScore > 0 && (
                        <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-300">
                          Risk {nomination.riskScore}
                        </span>
                      )}
                      <span className="text-xs text-neutral-500">{formatDate(nomination.createdAt)}</span>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-100">{nomination.communityName}</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {nomination.city}{nomination.category ? ` · ${nomination.category}` : ''}
                    </p>
                    <a
                      href={nomination.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm text-lime-400 hover:text-lime-300"
                    >
                      {nomination.sourceUrl}
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    </a>
                    {nomination.note && (
                      <p className="mt-3 max-w-3xl rounded-xl bg-neutral-900 p-3 text-sm leading-6 text-neutral-300">
                        {nomination.note}
                      </p>
                    )}
                    {(nomination.submitterName || nomination.submitterEmail) && (
                      <p className="mt-2 text-xs text-neutral-600">
                        Submitted by {[nomination.submitterName, nomination.submitterEmail].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {nomination.riskFlags.length > 0 && (
                      <p className="mt-2 text-xs text-neutral-500">
                        Flags: {nomination.riskFlags.join(', ')}
                      </p>
                    )}
                    {nomination.communityId && (
                      <p className="mt-1 text-xs text-neutral-600">
                        Linked community: {nomination.communityId}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {nomination.status !== 'PENDING' && (
                      <button
                        onClick={() => reviewNomination(nomination.id, 'pending')}
                        disabled={isReviewing}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-800 px-3 text-xs font-semibold text-neutral-200 hover:border-neutral-500 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Pending
                      </button>
                    )}
                    {isPending && (
                      <>
                        <button
                          onClick={() => reviewNomination(nomination.id, 'reject')}
                          disabled={isReviewing}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-900/70 px-3 text-xs font-semibold text-red-300 hover:bg-red-950/50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => reviewNomination(nomination.id, 'archive')}
                          disabled={isReviewing}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-800 px-3 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                  <Field label="Category">
                    <select
                      value={draft.category}
                      onChange={(event) => updateDraft(nomination.id, { category: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="City">
                    <input
                      value={draft.city}
                      onChange={(event) => updateDraft(nomination.id, { city: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Usual area">
                    <input
                      value={draft.usualArea}
                      onChange={(event) => updateDraft(nomination.id, { usualArea: event.target.value })}
                      disabled={!isPending}
                      placeholder="East Coast, CBD..."
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Join platform">
                    <select
                      value={draft.joinPlatform}
                      onChange={(event) => updateDraft(nomination.id, { joinPlatform: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    >
                      <option value="">Auto-detect</option>
                      {PLATFORM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Usual schedule">
                    <input
                      value={draft.usualSchedule}
                      onChange={(event) => updateDraft(nomination.id, { usualSchedule: event.target.value })}
                      disabled={!isPending}
                      placeholder="Sat mornings, Tue evenings..."
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Price">
                    <select
                      value={draft.priceType}
                      onChange={(event) => updateDraft(nomination.id, { priceType: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    >
                      <option value="">Unknown</option>
                      {PRICE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Community link">
                    <input
                      value={draft.communityLink}
                      onChange={(event) => updateDraft(nomination.id, { communityLink: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Instagram">
                    <input
                      value={draft.instagramHandle}
                      onChange={(event) => updateDraft(nomination.id, { instagramHandle: event.target.value })}
                      disabled={!isPending}
                      placeholder="@handle"
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Vibe tags">
                    <input
                      value={draft.vibeTags}
                      onChange={(event) => updateDraft(nomination.id, { vibeTags: event.target.value })}
                      disabled={!isPending}
                      placeholder="social, beginner, women-only"
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Website URL">
                    <input
                      value={draft.websiteUrl}
                      onChange={(event) => updateDraft(nomination.id, { websiteUrl: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      checked={draft.beginnerFriendly}
                      onChange={(event) => updateDraft(nomination.id, { beginnerFriendly: event.target.checked })}
                      disabled={!isPending}
                      className="h-4 w-4 accent-white"
                    />
                    Beginner-friendly
                  </label>
                  <Field label="Admin notes">
                    <input
                      value={draft.adminNotes}
                      onChange={(event) => updateDraft(nomination.id, { adminNotes: event.target.value })}
                      disabled={!isPending}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <Field label="Description">
                    <textarea
                      value={draft.description}
                      onChange={(event) => updateDraft(nomination.id, { description: event.target.value })}
                      disabled={!isPending}
                      rows={2}
                      placeholder="Short public description. Optional; nomination note is used as fallback."
                      className={`${INPUT_CLASS} min-h-20 resize-none py-3`}
                    />
                  </Field>
                </div>

                {isPending && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => reviewNomination(nomination.id, 'approve')}
                      disabled={isReviewing}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
                    >
                      {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve into directory
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  )
}

function createDraft(nomination: CommunityNomination): ReviewDraft {
  const platform = inferJoinPlatform(nomination.sourceUrl)
  const isInstagram = platform === 'instagram'
  const isWebsite = platform === 'website' || platform === 'linktree'

  return {
    category: nomination.category ? nomination.category.toLowerCase().replace(/[^a-z0-9]+/g, '_') : '',
    city: nomination.city || 'Singapore',
    usualArea: '',
    usualSchedule: '',
    joinPlatform: platform,
    priceType: '',
    beginnerFriendly: false,
    vibeTags: '',
    communityLink: nomination.sourceUrl,
    websiteUrl: isWebsite ? nomination.sourceUrl : '',
    instagramHandle: isInstagram ? inferInstagramHandle(nomination.sourceUrl) : '',
    description: nomination.note ?? '',
    adminNotes: nomination.adminNotes ?? '',
  }
}

function inferJoinPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('telegram') || host.includes('t.me')) return 'telegram'
    if (host.includes('whatsapp')) return 'whatsapp'
    if (host.includes('instagram')) return 'instagram'
    if (host.includes('strava')) return 'strava'
    if (host.includes('meetup')) return 'meetup'
    if (host.includes('linktr.ee') || host.includes('linktree')) return 'linktree'
  } catch {
    return ''
  }
  return 'website'
}

function inferInstagramHandle(url: string): string {
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean)[0]
    return path ? `@${path}` : ''
  } catch {
    return ''
  }
}

function statusClass(status: string): string {
  if (status === 'PENDING') return 'bg-yellow-400/15 text-yellow-300'
  if (status === 'APPROVED') return 'bg-lime-400/15 text-lime-300'
  if (status === 'REJECTED') return 'bg-red-400/15 text-red-300'
  return 'bg-neutral-800 text-neutral-300'
}

function moderationClass(status: CommunityNomination['moderationStatus']): string {
  if (status === 'LIVE') return 'bg-lime-400/15 text-lime-300'
  if (status === 'LIMITED') return 'bg-sky-400/15 text-sky-300'
  if (status === 'UNDER_REVIEW') return 'bg-yellow-400/15 text-yellow-300'
  if (status === 'BLOCKED') return 'bg-red-500/20 text-red-200'
  return 'bg-red-400/15 text-red-300'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
