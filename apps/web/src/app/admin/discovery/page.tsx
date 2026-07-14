'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ExternalLink, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react'

type DiscoverySource = {
  id: string
  name: string
  url: string
  sourceType: string
  status: string
  city: string
  category: string | null
  notes: string | null
  lastCheckedAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
  _count?: { discoveredSessions: number }
}

type DiscoveredSession = {
  id: string
  title: string
  description: string | null
  category: string | null
  city: string
  location: string | null
  startTime: string | null
  endTime: string | null
  price: number | null
  currency: string
  signupUrl: string | null
  sourceUrl: string
  imageUrl: string | null
  hostName: string | null
  communityName: string | null
  confidence: number
  status: string
  createdAt: string
  source: DiscoverySource
  createdActivity?: { id: string; title: string; status: string } | null
}

const SOURCE_TYPES = ['WEBSITE', 'EVENTBRITE', 'PEATIX', 'MEETUP', 'INSTAGRAM', 'LINKTREE', 'CALENDAR', 'OTHER']
const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'ARCHIVED', 'all']

export default function DiscoveryAdminPage() {
  const [sources, setSources] = useState<DiscoverySource[]>([])
  const [sessions, setSessions] = useState<DiscoveredSession[]>([])
  const [status, setStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    url: '',
    sourceType: 'WEBSITE',
    city: 'Singapore',
    category: '',
    notes: '',
  })

  const pendingCount = useMemo(
    () => sessions.filter((session) => session.status === 'PENDING').length,
    [sessions],
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sourceRes, sessionRes] = await Promise.all([
        fetch('/api/admin/discovery/sources'),
        fetch(`/api/admin/discovery/sessions?status=${encodeURIComponent(status)}`),
      ])
      if (!sourceRes.ok || !sessionRes.ok) throw new Error('Failed to load discovery data')
      const sourceData = await sourceRes.json()
      const sessionData = await sessionRes.json()
      setSources(sourceData.sources ?? [])
      setSessions(sessionData.sessions ?? [])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchData().catch((error) => console.error(error))
  }, [fetchData])

  async function createSource(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/discovery/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save source')
      setForm({ name: '', url: '', sourceType: 'WEBSITE', city: 'Singapore', category: '', notes: '' })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  async function scanSource(sourceId: string) {
    setScanningId(sourceId)
    try {
      const res = await fetch(`/api/admin/discovery/sources/${sourceId}/scan`, { method: 'POST' })
      if (!res.ok) throw new Error('Scan failed')
      await fetchData()
    } finally {
      setScanningId(null)
    }
  }

  async function reviewSession(sessionId: string, action: string) {
    setReviewingId(sessionId)
    try {
      const res = await fetch(`/api/admin/discovery/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Review failed')
      await fetchData()
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Community scout</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-100 sm:text-3xl">Discovery inbox</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Register public sources, scan for structured event listings, then approve only the sessions that are real and joinable.
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 text-sm font-semibold text-neutral-200 hover:bg-neutral-900"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-100">Sources</h2>
            <p className="text-sm text-neutral-500">Public pages only. Avoid private groups and personal contact harvesting.</p>
          </div>
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-400">
            {sources.length} tracked
          </span>
        </div>

        <form onSubmit={createSource} className="mb-5 grid gap-3 lg:grid-cols-[1fr_1.4fr_150px_120px_140px_auto]">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Community/source name"
            className="min-h-11 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400"
          />
          <input
            value={form.url}
            onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
            placeholder="https://..."
            className="min-h-11 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400"
          />
          <select
            value={form.sourceType}
            onChange={(event) => setForm((current) => ({ ...current, sourceType: event.target.value }))}
            className="min-h-11 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400"
          >
            {SOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            placeholder="Singapore"
            className="min-h-11 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400"
          />
          <input
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            placeholder="running"
            className="min-h-11 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none focus:border-lime-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Last scan</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {sources.map((source) => (
                <tr key={source.id} className="text-neutral-300">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-neutral-100">{source.name}</div>
                    <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex max-w-sm items-center gap-1 truncate text-xs text-neutral-500 hover:text-lime-400">
                      {source.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {source.lastError && <p className="mt-1 text-xs text-red-400">{source.lastError}</p>}
                  </td>
                  <td className="px-3 py-3">{source.city}</td>
                  <td className="px-3 py-3">{source.sourceType}</td>
                  <td className="px-3 py-3">{source._count?.discoveredSessions ?? 0}</td>
                  <td className="px-3 py-3 text-neutral-500">{formatDateTime(source.lastCheckedAt)}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => scanSource(source.id)}
                      disabled={scanningId === source.id}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-800 px-3 text-xs font-semibold text-neutral-100 hover:border-lime-400 disabled:opacity-50"
                    >
                      {scanningId === source.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Scan
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && sources.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">No sources yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950">
        <div className="flex flex-col gap-3 border-b border-neutral-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-neutral-100">Discovered sessions</h2>
            <p className="text-sm text-neutral-500">{pendingCount} pending in this view</p>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatus(filter)}
                className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold uppercase ${
                  status === filter
                    ? 'bg-white text-neutral-950'
                    : 'border border-neutral-800 text-neutral-400 hover:text-neutral-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-neutral-900">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-neutral-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center text-neutral-500">No discovered sessions in this status.</div>
          ) : (
            sessions.map((session) => (
              <article key={session.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-lime-400/10 px-2 py-1 text-xs font-semibold text-lime-300">
                      {session.confidence}% confidence
                    </span>
                    <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-400">
                      {session.status}
                    </span>
                    {session.category && (
                      <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-400">
                        {session.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-100">{session.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {formatDateTime(session.startTime)} · {session.location || session.city}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">{session.description || 'No description found.'}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span>Source: {session.source.name}</span>
                    {session.communityName && <span>Community: {session.communityName}</span>}
                    {session.price === 0 ? <span>Free</span> : session.price ? <span>{session.currency} {(session.price / 100).toFixed(0)}</span> : null}
                    {session.createdActivity && <span>Published: {session.createdActivity.title}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={session.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-neutral-800 px-3 text-xs font-semibold text-neutral-300 hover:border-lime-400">
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                    {session.signupUrl && (
                      <a href={session.signupUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-neutral-800 px-3 text-xs font-semibold text-neutral-300 hover:border-lime-400">
                        Signup <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap content-start gap-2 lg:justify-end">
                  <button
                    onClick={() => reviewSession(session.id, 'approve')}
                    disabled={reviewingId === session.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-lime-400 px-3 text-xs font-semibold text-neutral-950 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Approve + publish
                  </button>
                  <button
                    onClick={() => reviewSession(session.id, 'duplicate')}
                    disabled={reviewingId === session.id}
                    className="inline-flex min-h-10 items-center rounded-lg border border-neutral-800 px-3 text-xs font-semibold text-neutral-300 hover:border-neutral-500 disabled:opacity-50"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => reviewSession(session.id, 'reject')}
                    disabled={reviewingId === session.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-900/80 px-3 text-xs font-semibold text-red-300 hover:border-red-500 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Not checked'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString('en-SG', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
