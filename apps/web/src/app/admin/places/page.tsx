'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'
import { getListingPositioning } from '@/lib/listing-positioning'

type MediaAsset = {
  id: string
  imageUrl: string
  thumbnailUrl: string | null
  sourceUrl: string | null
  sourceType: string
  status: string
  priority: number
}

type AdminPlace = {
  id: string
  name: string
  slug: string
  description: string | null
  placeType: string
  area: string | null
  address: string | null
  coverImage: string | null
  photos: string[]
  activities: string[]
  amenities: string[]
  vibeTags: string[]
  communityTypes: string[]
  bestFor: string | null
  dropInFriendly: boolean
  beginnerFriendly: boolean
  socialScore: number
  googlePlaceId: string | null
  osmElementId: string | null
  sourceProvider: string | null
  websiteUrl: string | null
  instagramHandle: string | null
  bookingUrl: string | null
  sourceUrl: string | null
  averageRating: number
  reviewCount: number
  googleRating: number | null
  googleReviewCount: number
  googleMapsUrl: string | null
  openingHours: string[]
  placeTypes: string[]
  trustScore: number
  photoQualityScore: number
  reviewSentimentScore: number
  aiSummary: string | null
  aiPros: string[]
  aiCons: string[]
  intelligenceStatus: string | null
  lastEnrichedAt: string | null
  moderationStatus: 'LIVE' | 'LIMITED' | 'UNDER_REVIEW' | 'REJECTED' | 'BLOCKED'
  isActive: boolean
  isFeatured: boolean
  isSeeded: boolean
  lastVerifiedAt: string | null
  moderationNotes: string | null
  createdAt: string
  updatedAt: string
  city: { name: string; slug: string } | null
  _count: { communityLinks: number; reviews: number }
  mediaAssets: MediaAsset[]
}

type CountRow = {
  moderationStatus: string
  _count: { moderationStatus: number }
}

const STATUS_FILTERS = ['UNDER_REVIEW', 'LIVE', 'LIMITED', 'REJECTED', 'BLOCKED', 'all']

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<AdminPlace[]>([])
  const [status, setStatus] = useState('UNDER_REVIEW')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [counts, setCounts] = useState<CountRow[]>([])
  const [total, setTotal] = useState(0)
  const [liveWeakCount, setLiveWeakCount] = useState(0)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const countByStatus = useMemo(() => {
    return new Map(counts.map((row) => [row.moderationStatus, row._count.moderationStatus]))
  }, [counts])

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, limit: '80' })
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/admin/places?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load place review queue')
      const data = await res.json()
      setPlaces(data.places ?? [])
      setCounts(data.counts ?? [])
      setTotal(data.total ?? 0)
      setLiveWeakCount(data.liveWeakCount ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load place review queue')
    } finally {
      setLoading(false)
    }
  }, [query, status])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  async function moderatePlace(placeId: string, action: string) {
    setReviewingId(placeId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/places/${placeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notesById[placeId] ?? null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Review action failed')
      }
      setNotesById((current) => {
        const next = { ...current }
        delete next[placeId]
        return next
      })
      await fetchPlaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review action failed')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Directory trust</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-100 sm:text-3xl">Place review queue</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Review places by show-up value: can someone join, who is it for, and is there enough social proof to surface it?
          </p>
        </div>
        <button
          onClick={() => fetchPlaces()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 text-sm font-semibold text-neutral-200 hover:bg-neutral-900"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Under review" value={countByStatus.get('UNDER_REVIEW') ?? 0} tone="warning" />
        <Metric label="Live places" value={countByStatus.get('LIVE') ?? 0} tone="good" />
        <Metric label="Weak live signals" value={liveWeakCount} tone={liveWeakCount > 0 ? 'warning' : 'muted'} />
        <Metric label="Current view" value={total} tone="muted" />
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, area, source, or intelligence status"
              className="min-h-11 w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-10 pr-3 text-sm text-neutral-100 outline-none focus:border-lime-400"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatus(filter)}
                className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold uppercase ${
                  status === filter
                    ? 'bg-white text-neutral-950'
                    : 'border border-neutral-800 text-neutral-400 hover:text-neutral-100'
                }`}
              >
                {filter} {filter !== 'all' ? `(${countByStatus.get(filter) ?? 0})` : ''}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-950">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-neutral-500" />
          </div>
        ) : places.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">No places in this queue.</div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {places.map((place) => (
              <AdminPlaceRow
                key={place.id}
                place={place}
                reviewingId={reviewingId}
                notes={notesById[place.id] ?? place.moderationNotes ?? ''}
                onNotesChange={(value) => setNotesById((current) => ({ ...current, [place.id]: value }))}
                onAction={(action) => moderatePlace(place.id, action)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AdminPlaceRow({
  place,
  reviewingId,
  notes,
  onNotesChange,
  onAction,
}: {
  place: AdminPlace
  reviewingId: string | null
  notes: string
  onNotesChange: (value: string) => void
  onAction: (action: string) => void
}) {
  const positioning = getListingPositioning({
    ...place,
    communityLinkCount: place._count.communityLinks,
    reviewCount: place._count.reviews,
  })

  return (
    <article className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusPill status={place.moderationStatus} />
          <SignalPill label="Show-up" value={positioning.score} />
          <SignalPill label="Trust" value={place.trustScore} />
          <SignalPill label="Photos" value={place.photoQualityScore} />
          <SignalPill label="Reviews" value={place.reviewSentimentScore} />
          <span className="rounded-full bg-lime-400/10 px-2 py-1 text-xs font-semibold text-lime-300">
            {positioning.publicPriority}
          </span>
          <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-300">
            {positioning.intent.replace(/_/g, ' ')}
          </span>
          {place.intelligenceStatus && (
            <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-400">
              {place.intelligenceStatus}
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
          <PlacePhotos place={place} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-neutral-100">{place.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>{formatPlaceType(place.placeType)}</span>
              <span>·</span>
              <span>{place.area || place.city?.name || 'Unknown area'}</span>
              {place.googleRating && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-lime-300" />
                    {place.googleRating.toFixed(1)} from {place.googleReviewCount} Google reviews
                  </span>
                </>
              )}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">
              {place.aiSummary || place.description || 'No generated summary yet.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {place.address || place.area || 'No address'}
              </span>
              <span>{place.sourceProvider || 'No provider'}</span>
              <span>{place.mediaAssets.length + place.photos.length} images in view</span>
              <span>{place._count.communityLinks} community links</span>
              <span>{positioning.joinPath}</span>
            </div>

            <PlaceLinks place={place} />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SignalList
                title="Show-up read"
                items={[positioning.reason, ...positioning.badges]}
                empty="No show-up signal"
              />
              <SignalList title="Pros" items={place.aiPros} empty="No pros generated" />
              <SignalList title="Cons" items={place.aiCons} empty="No cons generated" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-neutral-900 bg-neutral-900/40 p-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Review notes
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Why approve, reject, block, or keep in review?"
            className="mt-2 min-h-24 w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm normal-case tracking-normal text-neutral-100 outline-none focus:border-lime-400"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            label="Approve"
            icon={<Check className="h-4 w-4" />}
            disabled={reviewingId === place.id}
            onClick={() => onAction('approve')}
            tone="good"
          />
          <ActionButton
            label="Keep review"
            icon={<RotateCcw className="h-4 w-4" />}
            disabled={reviewingId === place.id}
            onClick={() => onAction('review')}
          />
          <ActionButton
            label="Duplicate"
            icon={<ShieldCheck className="h-4 w-4" />}
            disabled={reviewingId === place.id}
            onClick={() => onAction('duplicate')}
          />
          <ActionButton
            label="Reject"
            icon={<X className="h-4 w-4" />}
            disabled={reviewingId === place.id}
            onClick={() => onAction('reject')}
            tone="danger"
          />
          <ActionButton
            label="Feature socially"
            icon={<Star className="h-4 w-4" />}
            disabled={reviewingId === place.id}
            onClick={() => onAction('feature')}
            tone="good"
          />
          <ActionButton
            label="Normal priority"
            icon={<RotateCcw className="h-4 w-4" />}
            disabled={reviewingId === place.id}
            onClick={() => onAction('normal')}
          />
          <div className="col-span-2">
            <ActionButton
              label="Hide generic inventory"
              icon={<Ban className="h-4 w-4" />}
              disabled={reviewingId === place.id}
              onClick={() => onAction('hide')}
              tone="danger"
              full
            />
          </div>
          <div className="col-span-2">
            <ActionButton
              label="Block listing"
              icon={<Ban className="h-4 w-4" />}
              disabled={reviewingId === place.id}
              onClick={() => onAction('block')}
              tone="danger"
              full
            />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 p-3 text-xs leading-5 text-neutral-500">
          <div>Last enriched: {formatDate(place.lastEnrichedAt)}</div>
          <div>Last verified: {formatDate(place.lastVerifiedAt)}</div>
          <div>Google ID: {place.googlePlaceId || 'Missing'}</div>
          <div>OSM ID: {place.osmElementId || 'Missing'}</div>
        </div>
      </div>
    </article>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'good' | 'warning' | 'muted' }) {
  const toneClass =
    tone === 'good'
      ? 'text-lime-300'
      : tone === 'warning'
        ? 'text-yellow-300'
        : 'text-neutral-200'

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  )
}

function StatusPill({ status }: { status: AdminPlace['moderationStatus'] }) {
  const className =
    status === 'LIVE'
      ? 'bg-lime-400/10 text-lime-300'
      : status === 'UNDER_REVIEW'
        ? 'bg-yellow-400/10 text-yellow-300'
        : status === 'BLOCKED'
          ? 'bg-red-500/10 text-red-300'
          : 'bg-neutral-800 text-neutral-300'

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>
}

function SignalPill({ label, value }: { label: string; value: number }) {
  const className = value >= 80 ? 'text-lime-300' : value >= 60 ? 'text-yellow-300' : 'text-red-300'
  return (
    <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-400">
      {label}: <span className={className}>{value}</span>
    </span>
  )
}

function PlacePhotos({ place }: { place: AdminPlace }) {
  const urls = [
    ...place.mediaAssets.map((asset) => asset.thumbnailUrl || asset.imageUrl),
    ...place.photos,
    place.coverImage,
  ].filter(Boolean) as string[]
  const uniqueUrls = Array.from(new Set(urls)).slice(0, 4)

  if (uniqueUrls.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-600">
        <ImageIcon className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="grid aspect-[4/3] grid-cols-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      {uniqueUrls.map((url, index) => (
        <div key={`${url}-${index}`} className="relative min-h-0">
          <Image
            src={url}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  )
}

function PlaceLinks({ place }: { place: AdminPlace }) {
  const links = [
    { label: 'Public page', href: `/places/${place.slug}` },
    { label: 'Google Maps', href: place.googleMapsUrl },
    { label: 'Website', href: place.websiteUrl },
    { label: 'Source', href: place.sourceUrl },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href))

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={`${link.label}-${link.href}`}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-neutral-800 px-3 text-xs font-semibold text-neutral-300 hover:border-lime-400"
        >
          {link.label} <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  )
}

function SignalList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</div>
      <div className="mt-2 space-y-1 text-sm text-neutral-400">
        {items.length > 0 ? items.slice(0, 3).map((item) => <div key={item}>{item}</div>) : <div>{empty}</div>}
      </div>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
  tone = 'neutral',
  full = false,
}: {
  label: string
  icon: React.ReactNode
  disabled: boolean
  onClick: () => void
  tone?: 'neutral' | 'good' | 'danger'
  full?: boolean
}) {
  const className =
    tone === 'good'
      ? 'bg-lime-400 text-neutral-950 hover:bg-lime-300'
      : tone === 'danger'
        ? 'border border-red-900/80 text-red-300 hover:border-red-500'
        : 'border border-neutral-800 text-neutral-300 hover:border-neutral-500'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${className} ${full ? 'w-full' : ''}`}
    >
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  )
}

function formatPlaceType(value: string) {
  return value.toLowerCase().replace(/_/g, ' ')
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString('en-SG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
