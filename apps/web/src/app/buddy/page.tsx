'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@clerk/nextjs'
import { format } from 'date-fns'
import {
  Plus,
  Loader2,
  Zap,
  Map,
  MapPin,
  List,
  Search,
  X,
  ArrowRight,
  ChevronDown,
  Check,
  Users,
  ShieldCheck,
  UserPlus,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { LogoWithText } from '@/components/logo'
import { getActivityEmoji } from '@/lib/activity-types'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'
import { CreateChoiceSheet } from '@/components/CreateChoiceSheet'
import { SessionFeedbackSheet } from '@/components/SessionFeedbackSheet'
import { BioPromptSheet } from '@/components/BioPromptSheet'
import {
  LazySessionVectorMap,
  type SessionVectorMapPin,
} from '@/components/maps/LazySessionVectorMap'
import {
  CITY_LOCATION_CONFIGS,
  DEFAULT_CITY_LOCATION_CONFIG,
  findCityLocationConfig,
  getCityLocationConfig,
  getCityLocationConfigFromText,
  getNearestCityLocationConfig,
  type CityLocationConfig,
  type CityNeighborhood,
} from '@/lib/location-config'
import { compareByShowUpConfidence, getShowUpConfidence } from '@/lib/show-up-confidence'
import { getCategoryFallbackImage, getCityFallbackImage } from '@/lib/visual-fallbacks'

interface Host {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
  sessionsHostedCount: number
  fitnessLevel: string | null
  isCoach?: boolean
  coachVerificationStatus?: string | null
}

interface Attendee {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
  goingSolo?: boolean
}

interface Session {
  id: string
  title: string
  description: string | null
  activityMode: string
  categorySlug: string | null
  city: string
  address: string | null
  latitude?: number
  longitude?: number
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  price: number
  currency: string
  status: string
  fitnessLevel: string | null
  whatToBring: string | null
  requiresApproval: boolean
  imageUrl: string | null
  resolvedImageUrl?: string | null
  imageSourceType?: string | null
  imageSourceLabel?: string | null
  imageAttributionName?: string | null
  imageAttributionUrl?: string | null
  imageSourceUrl?: string | null
  matchedFitnessPlaceId?: string | null
  host: Host
  community?: {
    id: string
    name: string
    logoImage: string | null
    coverImage?: string | null
    slug: string
    communityLink?: string | null
    websiteUrl?: string | null
    sourceUrl?: string | null
    joinPlatform?: string | null
    lastVerifiedAt?: string | null
  } | null
  officialJoinUrl?: string | null
  officialJoinPlatform?: string | null
  lastVerifiedAt?: string | null
  attendees: Attendee[]
  attendeeCount: number
  goingSoloCount?: number
  isFull: boolean
  userStatus: string | null
  isFeatured?: boolean
  avgRating: number | null
  reviewCount: number
  acceptPayNow?: boolean
  acceptStripe?: boolean
  paynowQrImageUrl?: string | null
  paynowName?: string | null
  paynowPhoneNumber?: string | null
}

interface MySessionSummary {
  id: string
  title: string
  startTime: string | null
  address: string | null
  city: string | null
  userStatus: 'JOINED' | 'HOSTING'
}

interface DirectoryCommunityPreview {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  logoImage: string | null
  category: string
  isVerified: boolean
  memberCount: number
  eventCount: number
  city: { name: string; slug: string } | null
  latitude?: number | null
  longitude?: number | null
  usualArea: string | null
  usualSchedule: string | null
  joinPlatform: string | null
  communityLink: string | null
  websiteUrl?: string | null
  sourceUrl: string | null
  sourceLabel?: string | null
  bestFor?: string | null
  soloFriendly?: boolean
  confidenceScore?: number | null
  confidenceTier?: string | null
  vibeTags: string[]
  priceType: string | null
  beginnerFriendly: boolean
  lastVerifiedAt: string | null
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

interface TimeBucket {
  key: string
  label: string
  sessions: Session[]
}

function getRelativeTime(startTime: string): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMin < 0) return 'Started'
  if (diffMin < 60) return `In ${diffMin} min`
  if (diffHrs < 3) return `In ${diffHrs}h ${diffMin % 60}m`

  // Check if same calendar day
  const isToday = start.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = start.toDateString() === tomorrow.toDateString()

  const h = start.getHours() % 12 || 12
  const ampm = start.getHours() >= 12 ? 'PM' : 'AM'
  const min = start.getMinutes()
  const timeStr = min === 0 ? `${h} ${ampm}` : `${h}:${String(min).padStart(2, '0')} ${ampm}`

  if (isToday) return `Today ${timeStr}`
  if (isTomorrow) return `Tomorrow ${timeStr}`
  return format(start, 'EEE, MMM d') + ` · ${timeStr}`
}

function getSocialDiscoveryScore(session: Session): number {
  return getShowUpConfidence(session).score
}

function sortSessionsBySocialMomentum(sessions: Session[]): Session[] {
  return sessions.slice().sort((a, b) => {
    const scoreDelta = getSocialDiscoveryScore(b) - getSocialDiscoveryScore(a)
    if (scoreDelta !== 0) return scoreDelta
    return compareByShowUpConfidence(a, b)
  })
}

function bucketSessions(sessions: Session[]): TimeBucket[] {
  const now = new Date()
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const endOfTomorrow = new Date(endOfToday)
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1)

  const happeningNow: Session[] = []
  const nextFewHours: Session[] = []
  const today: Session[] = []
  const tomorrow: Session[] = []
  const later: Session[] = []

  for (const s of sessions) {
    if (!s.startTime) {
      later.push(s)
      continue
    }
    const start = new Date(s.startTime)
    const diffMs = start.getTime() - now.getTime()
    const diffHrs = diffMs / (1000 * 60 * 60)

    if (diffHrs < 0 && diffHrs > -2) happeningNow.push(s)
    else if (diffHrs >= 0 && diffHrs < 3) nextFewHours.push(s)
    else if (start <= endOfToday) today.push(s)
    else if (start <= endOfTomorrow) tomorrow.push(s)
    else later.push(s)
  }

  const buckets: TimeBucket[] = []
  if (happeningNow.length)
    buckets.push({ key: 'now', label: 'Now', sessions: sortSessionsBySocialMomentum(happeningNow) })
  if (nextFewHours.length)
    buckets.push({
      key: 'soon',
      label: 'Soon',
      sessions: sortSessionsBySocialMomentum(nextFewHours),
    })
  if (today.length)
    buckets.push({ key: 'today', label: 'Today', sessions: sortSessionsBySocialMomentum(today) })
  if (tomorrow.length)
    buckets.push({
      key: 'tomorrow',
      label: 'Tomorrow',
      sessions: sortSessionsBySocialMomentum(tomorrow),
    })
  if (later.length)
    buckets.push({
      key: 'later',
      label: 'This week',
      sessions: sortSessionsBySocialMomentum(later),
    })
  return buckets
}

function formatBuddyMapPrice(price: number, currency: string): string {
  if (price <= 0) return 'Free'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price / 100)
  } catch {
    return `${currency} ${Math.round(price / 100)}`
  }
}

function getLocalDateString(timezone: string, offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA', { timeZone: timezone })
}

function LocationPermissionPanel({
  status,
  cityOptions,
  onUseLocation,
  onChooseCity,
}: {
  status: LocationStatus
  cityOptions: CityLocationConfig[]
  onUseLocation: () => void
  onChooseCity: (citySlug: string) => void
}) {
  if (status === 'granted' || status === 'stored' || status === 'city') return null

  const isDetecting = status === 'detecting'
  const title = isDetecting ? 'Finding plans near you' : 'Choose how to start'
  const body = isDetecting
    ? 'SweatBuddies uses your browser location to load nearby plans and map pins first.'
    : status === 'unsupported'
      ? 'This browser cannot share location. Pick a city and we will keep discovery scoped there.'
      : 'Location was not shared. You can try again or choose a city manually.'

  return (
    <section className="border-b border-white/10 bg-[#101010] px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
            Location setup
          </p>
          <h2 className="mt-1 text-sm font-black text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-white/58">{body}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onUseLocation}
            disabled={isDetecting}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#C6E76A] px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A] disabled:cursor-wait disabled:bg-[#3B432C] disabled:text-white/55"
          >
            {isDetecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPinIcon />}
            Use my location
          </button>
          {cityOptions.map((city) => (
            <button
              key={city.slug}
              type="button"
              onClick={() => onChooseCity(city.slug)}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-3 text-xs font-black uppercase tracking-wide text-white/72 transition-colors hover:border-white/30 hover:text-white"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function MapLocationPermissionOverlay({
  status,
  cityOptions,
  onUseLocation,
  onChooseCity,
}: {
  status: LocationStatus
  cityOptions: CityLocationConfig[]
  onUseLocation: () => void
  onChooseCity: (citySlug: string) => void
}) {
  if (status === 'granted' || status === 'stored' || status === 'city') return null

  const isDetecting = status === 'detecting'

  return (
    <section className="absolute left-3 right-3 top-3 z-30 rounded-xl border border-white/14 bg-black/82 p-2.5 text-white shadow-2xl shadow-black/35 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
            Start nearby
          </p>
          <p className="mt-0.5 truncate text-xs font-bold leading-tight text-white/78">
            Share location or pick a city
          </p>
        </div>
        <button
          type="button"
          onClick={onUseLocation}
          disabled={isDetecting}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#C6E76A] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A] disabled:cursor-wait disabled:bg-[#3B432C] disabled:text-white/55"
        >
          {isDetecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
          Use
        </button>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
        {cityOptions.map((city) => (
          <button
            key={city.slug}
            type="button"
            onClick={() => onChooseCity(city.slug)}
            className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.06] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white transition-colors hover:border-[#C6E76A]/60 hover:text-[#C6E76A]"
          >
            {city.name}
          </button>
        ))}
      </div>
    </section>
  )
}

function MapPinIcon() {
  return <MapPin className="h-3.5 w-3.5" />
}

function LocalPulsePanel({
  activeLocationLabel,
  activeDateLabel,
  sessions,
  communityCount,
  myNextSession,
  loading,
  signedIn,
  locationStatus,
  communityHref,
  onOpenMap,
  onUseLocation,
}: {
  activeLocationLabel: string
  activeDateLabel: string
  sessions: Session[]
  communityCount: number | null
  myNextSession: MySessionSummary | null
  loading: boolean
  signedIn: boolean
  locationStatus: LocationStatus
  communityHref: string
  onOpenMap: () => void
  onUseLocation: () => void
}) {
  const planCount = sessions.length
  const listedCommunityCount = communityCount ?? 0
  const isBootstrapping = loading && planCount === 0 && communityCount === null
  const hasLocalSupply = planCount > 0 || listedCommunityCount > 0
  const locationNeedsChoice = locationStatus === 'denied' || locationStatus === 'unsupported'
  const myPlanTime = myNextSession?.startTime ? getRelativeTime(myNextSession.startTime) : null
  const topSession = sessions[0] ?? null

  const title = myNextSession
    ? `Your next plan is ${myPlanTime ? myPlanTime.toLowerCase() : 'coming up'}.`
    : isBootstrapping
      ? `Checking what is active in ${activeLocationLabel}.`
      : planCount > 0
        ? `${planCount} joinable plan${planCount === 1 ? '' : 's'} around ${activeLocationLabel}.`
        : hasLocalSupply
          ? `Quiet for plans, active for communities.`
          : locationNeedsChoice
            ? 'Choose an area to see what is active.'
            : `No community workouts in ${activeLocationLabel} yet.`

  const body = myNextSession
    ? `${myNextSession.title}${myNextSession.address ? ` · ${myNextSession.address.split(',')[0]}` : ''}`
    : planCount > 0
      ? `Best first option: ${topSession?.title ?? 'open plans'}${topSession?.startTime ? ` · ${getRelativeTime(topSession.startTime)}` : ''}.`
      : hasLocalSupply
        ? `${listedCommunityCount} communities are mapped nearby. Open a community or post the next workout.`
        : locationNeedsChoice
          ? 'Location was not shared. Pick a city, use your location, or browse communities while the map catches up.'
          : 'Suggest a community or post a simple session so people know where to show up.'

  return (
    <section className="rounded-lg border border-white/10 bg-[#111412] p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
              Local pulse
            </p>
            <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-white/45">
              {activeLocationLabel}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide text-white/45">
              {activeDateLabel}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-black leading-tight text-white sm:text-xl">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/58 sm:text-sm">
            {body}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <PulseStat
            label="Plans"
            value={isBootstrapping ? '...' : String(planCount)}
            active={planCount > 0}
          />
          <PulseStat
            label="Communities"
            value={communityCount === null && loading ? '...' : String(listedCommunityCount)}
            active={listedCommunityCount > 0}
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {myNextSession ? (
            <Link
              href={`/activities/${myNextSession.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#C6E76A] px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
            >
              Open my plan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : planCount > 0 ? (
            <button
              type="button"
              onClick={onOpenMap}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#C6E76A] px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
            >
              Open map
              <Map className="h-3.5 w-3.5" />
            </button>
          ) : listedCommunityCount > 0 ? (
            <Link
              href={communityHref}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#C6E76A] px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
            >
              Browse communities
              <Users className="h-3.5 w-3.5" />
            </Link>
          ) : null}

          {!signedIn && (
            <Link
              href="/sign-in?redirect_url=/buddy"
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-black uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              Sign in
            </Link>
          )}

          {locationNeedsChoice && locationStatus !== 'unsupported' && (
            <button
              type="button"
              onClick={onUseLocation}
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-black uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              Use location
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function PulseStat({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active: boolean
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${active ? 'border-[#C6E76A]/24 bg-[#C6E76A]/8' : 'border-white/10 bg-white/[0.035]'}`}>
      <p className={`font-mono text-base font-black leading-none ${active ? 'text-[#C6E76A]' : 'text-white'}`}>
        {value}
      </p>
      <p className="mt-1 truncate font-mono text-[9px] font-black uppercase tracking-wide text-white/42">
        {label}
      </p>
    </div>
  )
}

function DiscoveryWorkspaceNav({
  viewMode,
  communityHref,
  onToggleView,
}: {
  viewMode: 'list' | 'map'
  communityHref: string
  onToggleView: () => void
}) {
  return (
    <nav className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[10px] font-black uppercase tracking-wide">
      <button
        type="button"
        onClick={onToggleView}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-white/12 bg-[#171A18] text-white/72 transition-colors hover:border-[#C6E76A] hover:text-[#C6E76A]"
      >
        {viewMode === 'list' ? <Map className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
        {viewMode === 'list' ? 'Map' : 'List'}
      </button>
      <Link
        href={communityHref}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-white/12 bg-[#171A18] text-white/72 transition-colors hover:border-[#C6E76A] hover:text-[#C6E76A]"
      >
        <Users className="h-3.5 w-3.5" />
        Communities
      </Link>
    </nav>
  )
}

function ResultsCommandHeader({
  sessionCount,
  peopleCount,
  goingSoloCount,
  communityCount,
  activeLocationLabel,
  activeDateLabel,
}: {
  sessionCount: number
  peopleCount: number
  goingSoloCount: number
  communityCount: number | null
  activeLocationLabel: string
  activeDateLabel: string
}) {
  return (
    <div className="border-b border-white/[0.08] py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
            Ranked results
          </p>
          <h1 className="mt-1 truncate text-lg font-black text-white">
            {sessionCount} plan{sessionCount !== 1 ? 's' : ''} in {activeLocationLabel}
          </h1>
          <p className="mt-1 text-xs leading-5 text-white/50">
            {activeDateLabel} sorted by confidence, join path, people going, and local trust.
          </p>
        </div>
        <div className="grid w-[142px] shrink-0 grid-cols-2 gap-1.5 max-[380px]:hidden">
          <MiniSignal label="Going" value={peopleCount} active={peopleCount > 0} />
          <MiniSignal label="Solo" value={goingSoloCount} active={goingSoloCount > 0} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <MiniSignal label="Plans" value={sessionCount} active={sessionCount > 0} />
        <MiniSignal label="Communities" value={communityCount ?? 0} active={(communityCount ?? 0) > 0} />
      </div>
    </div>
  )
}

function MiniSignal({
  label,
  value,
  active,
}: {
  label: string
  value: number
  active: boolean
}) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${active ? 'border-[#C6E76A]/24 bg-[#C6E76A]/8' : 'border-white/10 bg-white/[0.03]'}`}>
      <p className={`font-mono text-sm font-black leading-none ${active ? 'text-[#C6E76A]' : 'text-white/72'}`}>
        {value}
      </p>
      <p className="mt-1 truncate font-mono text-[8px] font-black uppercase tracking-wide text-white/36">
        {label}
      </p>
    </div>
  )
}

function LocalDirectoryFallback({
  cityName,
  communityCount,
  communities,
  loading,
  hasFilters,
  communityHref,
  onClearFilters,
  onCreate,
  onOpenMap,
}: {
  cityName: string
  communityCount: number | null
  communities: DirectoryCommunityPreview[]
  loading: boolean
  hasFilters: boolean
  communityHref: string
  onClearFilters: () => void
  onCreate: () => void
  onOpenMap: () => void
}) {
  const listedCommunityCount = communityCount ?? communities.length

  return (
    <div className="grid gap-4 py-4">
      <section className="rounded-lg border border-white/[0.10] bg-[#111412] p-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
          Active communities
        </p>
        <h2 className="mt-2 text-xl font-black leading-tight text-white">
          Start with communities in {cityName}.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
          No live session matches this moment. The directory still gives you official links,
          usual areas, schedules, and newcomer signals so the next move is clear.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          <MiniSignal label="Plans" value={0} active={false} />
          <MiniSignal label="Communities" value={listedCommunityCount} active={listedCommunityCount > 0} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={communityHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#C6E76A] px-4 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
          >
            Browse communities
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 px-4 font-mono text-[10px] font-black uppercase tracking-wide text-white/72 transition-colors hover:border-[#C6E76A] hover:text-[#C6E76A]"
          >
            Open map
            <Map className="h-3.5 w-3.5" />
          </button>
          {hasFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 font-mono text-[10px] font-black uppercase tracking-wide text-white/58 transition-colors hover:border-white/30 hover:text-white"
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 px-4 font-mono text-[10px] font-black uppercase tracking-wide text-white/58 transition-colors hover:border-white/30 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Post workout
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 rounded-lg border border-white/[0.06] bg-[#111412] shimmer" />
          ))}
        </div>
      ) : null}

      {!loading && communities.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <h3 className="font-mono text-xs font-black uppercase tracking-[0.16em] text-white">
              Source-checked communities
            </h3>
            <Link
              href={communityHref}
              className="font-mono text-[10px] font-black uppercase tracking-wide text-white/46 transition-colors hover:text-[#C6E76A]"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-2">
            {communities.slice(0, 4).map((community) => (
              <CommunityDecisionCard key={community.id} community={community} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function CommunityDecisionCard({ community }: { community: DirectoryCommunityPreview }) {
  const imageUrl = getCommunityImage(community)
  const joinHref = getCommunityJoinHref(community)
  const score = community.confidenceScore ?? (community.isVerified ? 90 : 70)
  const signals = [
    community.usualSchedule,
    community.beginnerFriendly ? 'Beginner-friendly' : null,
    community.soloFriendly ? 'Solo-friendly' : null,
    community.priceType ? formatCommunityPrice(community.priceType) : null,
  ].filter((signal): signal is string => Boolean(signal)).slice(0, 3)

  return (
    <article className="grid min-h-[132px] grid-cols-[116px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/[0.08] bg-[#151816] transition-colors hover:border-[#C6E76A]/35">
      <Link href={`/communities/${community.slug}`} className="relative block bg-[#222222]">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="116px"
          className="object-cover"
          unoptimized={!imageUrl.startsWith('/')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-[#C6E76A] backdrop-blur">
          {score}
        </span>
      </Link>
      <div className="flex min-w-0 flex-col p-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] font-black uppercase tracking-[0.15em] text-white/42">
              {formatCommunityCategory(community.category)}
            </p>
            <Link href={`/communities/${community.slug}`} className="mt-1 block">
              <h4 className="line-clamp-1 text-sm font-black text-white transition-colors hover:text-[#C6E76A]">
                {community.name}
              </h4>
            </Link>
          </div>
          {community.isVerified ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#C6E76A]" />
          ) : null}
        </div>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/54">
          {community.usualArea || community.city?.name || 'Area listed soon'}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-4 text-white/42">
          {community.bestFor || community.description || 'Source-checked community with an official join path.'}
        </p>
        {signals.length > 0 ? (
          <div className="mt-2 flex gap-1 overflow-hidden">
            {signals.map((signal) => (
              <span
                key={signal}
                className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-wide text-white/54"
              >
                {signal}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Link
            href={`/communities/${community.slug}`}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/12 px-3 font-mono text-[9px] font-black uppercase tracking-wide text-white/66 transition-colors hover:border-white/28 hover:text-white"
          >
            Details
          </Link>
          {joinHref ? (
            <a
              href={joinHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full bg-[#C6E76A] px-3 font-mono text-[9px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
            >
              {formatJoinPlatformLabel(community.joinPlatform)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Link
              href={`/communities/${community.slug}`}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#C6E76A] px-3 font-mono text-[9px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
            >
              Join path
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function getSessionListingImage(
  session: Pick<Session, 'imageUrl' | 'resolvedImageUrl' | 'categorySlug'>,
): string {
  return (
    session.resolvedImageUrl ||
    session.imageUrl ||
    getCategoryFallbackImage(session.categorySlug)
  )
}

function pinEmoji(slug: string | null | undefined) {
  return getActivityEmoji(slug, '🏅')
}

function formatCommunityCategory(value: string | null | undefined) {
  if (!value) return 'Fitness'
  return value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCommunityPrice(value: string | null | undefined) {
  if (!value) return 'Cost unknown'
  const normalized = value.toLowerCase()
  if (normalized === 'free') return 'Free'
  if (normalized === 'paid') return 'Paid'
  if (normalized === 'mixed' || normalized === 'free_paid') return 'Free + paid'
  if (normalized === 'membership') return 'Membership'
  if (normalized === 'charity') return 'Charity'
  if (normalized === 'pay_what_you_can') return 'Pay what you can'
  return formatCommunityCategory(normalized)
}

function formatJoinPlatformLabel(value: string | null | undefined) {
  if (!value) return 'Official link'
  return formatCommunityCategory(value)
}

function getCommunityImage(community: DirectoryCommunityPreview) {
  return community.coverImage || community.logoImage || getCategoryFallbackImage(community.category)
}

function getCommunityJoinHref(community: DirectoryCommunityPreview) {
  return community.communityLink || community.websiteUrl || community.sourceUrl || null
}

// ─── Fitness / type filters ───────────────────────────────────────────────────

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'pickleball', label: 'Pickleball' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'strength', label: 'Strength' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'social', label: 'Social' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'pilates', label: 'Pilates' },
]

const PRICING_FILTERS = [
  { value: '', label: 'All prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const LEVEL_FILTERS = [
  { value: '', label: 'All levels' },
  { value: 'ALL', label: 'Beginner-friendly' },
  { value: 'INTERMEDIATE_PLUS', label: 'Intermediate+' },
  { value: 'ADVANCED', label: 'Advanced' },
]

const STARTER_SESSION_IDEAS = [
  {
    label: 'Find a run',
    type: 'running',
    categorySlug: 'running',
    seedTitle: 'Easy social run',
    note: 'Easy pace, open invite',
  },
  {
    label: 'Lift with someone',
    type: 'strength',
    categorySlug: 'gym',
    seedTitle: 'Beginner-friendly gym session',
    note: 'Train with one or two people',
  },
  {
    label: 'Do yoga',
    type: 'yoga',
    categorySlug: 'yoga',
    seedTitle: 'Casual yoga flow',
    note: 'Park, studio, or rooftop',
  },
  {
    label: 'Play pickleball',
    type: 'pickleball',
    categorySlug: 'pickleball',
    seedTitle: 'Pickleball hit',
    note: 'Find a court and fill spots',
  },
]

type StarterSessionIdea = (typeof STARTER_SESSION_IDEAS)[number]

type DiscoveryMode = 'nearby' | 'city'
type LocationStatus = 'detecting' | 'granted' | 'stored' | 'denied' | 'unsupported' | 'city'
type MobileBuddyTab = 'crews' | 'plans' | 'map' | 'you'

const NEARBY_FILTER_VALUE = 'nearby'
const LAST_LOCATION_STORAGE_KEY = 'sb_last_discovery_location'

function getBrowserTimezone() {
  if (typeof Intl === 'undefined') return DEFAULT_CITY_LOCATION_CONFIG.timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_CITY_LOCATION_CONFIG.timezone
}

function readStoredDiscoveryLocation(): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(LAST_LOCATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<{ lat: number; lng: number; savedAt: number }>
    const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0
    const isFresh = Date.now() - savedAt < 1000 * 60 * 60 * 24 * 14

    if (
      isFresh &&
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return { lat: parsed.lat, lng: parsed.lng }
    }
  } catch {
    return null
  }

  return null
}

function storeDiscoveryLocation(location: { lat: number; lng: number }) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      LAST_LOCATION_STORAGE_KEY,
      JSON.stringify({ ...location, savedAt: Date.now() }),
    )
  } catch {
    /* ignore storage failures */
  }
}

export default function BuddyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#666666]" />
        </div>
      }
    >
      <BuddyPageInner />
    </Suspense>
  )
}

function BuddyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const [hasMounted, setHasMounted] = useState(false)
  const requestedCitySlug = searchParams.get('city')
  const requestedLocation = searchParams.get('location')
  const explicitNearbyLocation = requestedLocation === NEARBY_FILTER_VALUE
  const explicitCityConfig = useMemo(
    () => findCityLocationConfig(requestedCitySlug),
    [requestedCitySlug],
  )
  const initialCityConfig = useMemo(
    () => getCityLocationConfig(requestedCitySlug),
    [requestedCitySlug],
  )
  const initialStoredLocation = useMemo(() => readStoredDiscoveryLocation(), [])
  const shouldStartInCityMode = Boolean(explicitCityConfig) && !explicitNearbyLocation
  const initialTypeFilter = searchParams.get('type') ?? searchParams.get('cat') ?? ''
  const initialPricingFilter = searchParams.get('pricing') ?? ''
  const initialLevelFilter = searchParams.get('fitnessLevel') ?? searchParams.get('level') ?? ''
  const initialDateFilter = searchParams.get('date') ?? ''
  const initialViewMode = searchParams.get('view') === 'list' ? 'list' : 'map'
  const initialCreateMode = searchParams.get('create')

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    shouldStartInCityMode ? initialCityConfig.center : initialStoredLocation,
  )
  const [cityConfig, setCityConfig] = useState<CityLocationConfig>(initialCityConfig)
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    shouldStartInCityMode ? 'city' : 'nearby',
  )
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    shouldStartInCityMode ? 'city' : initialStoredLocation ? 'stored' : 'detecting',
  )
  const [locationReady, setLocationReady] = useState(
    shouldStartInCityMode || Boolean(initialStoredLocation),
  )
  const [userTimezone] = useState(getBrowserTimezone)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [myUpcomingSessions, setMyUpcomingSessions] = useState<MySessionSummary[]>([])
  const [myPlansLoading, setMyPlansLoading] = useState(false)
  const [communityCount, setCommunityCount] = useState<number | null>(null)
  const [communityPreviews, setCommunityPreviews] = useState<DirectoryCommunityPreview[]>([])
  const [communityCountLoading, setCommunityCountLoading] = useState(false)
  const profileCityLockedRef = useRef(shouldStartInCityMode)

  const [typeFilter, setTypeFilter] = useState(() =>
    TYPE_FILTERS.some((filter) => filter.value === initialTypeFilter) ? initialTypeFilter : '',
  )
  const [pricingFilter, setPricingFilter] = useState(() =>
    PRICING_FILTERS.some((filter) => filter.value === initialPricingFilter)
      ? initialPricingFilter
      : '',
  )
  const [levelFilter, setLevelFilter] = useState(() =>
    LEVEL_FILTERS.some((filter) => filter.value === initialLevelFilter) ? initialLevelFilter : '',
  )
  const [dateFilter, setDateFilter] = useState(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(initialDateFilter)) return initialDateFilter
    return initialViewMode === 'map'
      ? getLocalDateString(shouldStartInCityMode ? initialCityConfig.timezone : getBrowserTimezone())
      : ''
  })
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [createSeed, setCreateSeed] = useState<{ categorySlug: string; title: string } | null>(null)
  const [selectedPin, setSelectedPin] = useState<Session | null>(null)
  const [selectedMapPinId, setSelectedMapPinId] = useState<string | null>(null)
  const [feedbackSession, setFeedbackSession] = useState<{
    id: string
    title: string
    hostId: string
    hostName: string | null
  } | null>(null)
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  const [profileLocationReady, setProfileLocationReady] = useState(false)
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null)
  const [followPromptSession, setFollowPromptSession] = useState<Session | null>(null)
  const [pendingFollowSession, setPendingFollowSession] = useState<Session | null>(null)
  const [soloPromptSession, setSoloPromptSession] = useState<Session | null>(null)
  const [attendeeSheetSession, setAttendeeSheetSession] = useState<Session | null>(null)
  const [soloPromptLoading, setSoloPromptLoading] = useState(false)
  const [soloOptedSessionIds, setSoloOptedSessionIds] = useState<Set<string>>(new Set())
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null)
  const [followedCommunityIds, setFollowedCommunityIds] = useState<Set<string>>(new Set())

  // View mode: map-first by default, with list available as a secondary scan mode.
  const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode)
  const [mobileTab, setMobileTab] = useState<MobileBuddyTab>('map')
  const mapDrawerTrackedRef = useRef<string | null>(null)

  // Neighborhood filter
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<CityNeighborhood | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Session[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (initialCreateMode === 'session') {
      setShowCreateSheet(true)
    } else if (initialCreateMode === 'community') {
      setShowCreateMenu(true)
    }
  }, [initialCreateMode])

  const discoveryStats = useMemo(
    () => ({
      sessionCount: sessions.length,
      peopleCount: sessions.reduce((sum, session) => sum + session.attendeeCount, 0),
      goingSoloCount: sessions.reduce((sum, session) => sum + (session.goingSoloCount ?? 0), 0),
    }),
    [sessions],
  )

  const activeTimezone = discoveryMode === 'nearby' ? userTimezone : cityConfig.timezone
  const activeLocationLabel =
    discoveryMode === 'nearby'
      ? locationStatus === 'detecting'
        ? 'Finding location'
        : locationStatus === 'stored'
        ? 'Near last location'
        : locationStatus === 'denied' || locationStatus === 'unsupported'
        ? 'Choose area'
        : 'Near me'
      : cityConfig.name
  const locationFilterValue = discoveryMode === 'nearby' ? NEARBY_FILTER_VALUE : cityConfig.slug
  const locationFilterOptions = [
    {
      value: NEARBY_FILTER_VALUE,
      label:
        locationStatus === 'denied' || locationStatus === 'unsupported'
          ? 'Choose area'
          : 'Near me',
    },
    ...CITY_LOCATION_CONFIGS.map((city) => ({
      value: city.slug,
      label: city.name,
    })),
  ]

  const todayDateString = useMemo(() => getLocalDateString(activeTimezone), [activeTimezone])

  const activeDateLabel = dateFilter
    ? dateFilter === todayDateString
      ? 'Today'
      : (() => {
          const parsed = new Date(`${dateFilter}T00:00:00`)
          if (Number.isNaN(parsed.getTime())) return 'Selected day'
          return parsed.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: activeTimezone,
          })
        })()
    : 'Upcoming'

  const sessionById = useMemo(
    () => new globalThis.Map(sessions.map((session) => [session.id, session])),
    [sessions],
  )

  const mapPins = useMemo<SessionVectorMapPin[]>(
    () => {
      const communityPins = communityPreviews.map((community) => {
        const cityLabel = community.city?.name ?? activeLocationLabel
        const scheduleLabel = community.usualSchedule || community.bestFor || 'Community activity'

        return {
          id: `community:${community.id}`,
          kind: 'community' as const,
          markerVariant: 'community' as const,
          title: community.name,
          latitude: community.latitude,
          longitude: community.longitude,
          city: cityLabel,
          primaryLabel: 'Community',
          activityLabel: getActivityEmoji(community.category),
          previewTitle: community.name,
          previewSubtitle: scheduleLabel,
          previewMeta: `${community.usualArea || cityLabel} · ${community.beginnerFriendly ? 'Beginner-friendly' : 'Source-checked'}`,
          previewImage:
            community.logoImage ||
            community.coverImage ||
            getCategoryFallbackImage(community.category),
          previewCtaLabel: 'View community',
          href: `/communities/${community.slug}`,
        }
      })

      const sessionPins = sessions.map((session) => {
        const activityLabel = session.categorySlug
          ? session.categorySlug.replace(/[-_]/g, ' ')
          : 'session'
        const hostIsReal =
          session.host?.name &&
          session.host.name !== 'sweatbuddies' &&
          session.host.name !== 'SweatBuddies'
        const displayName =
          session.community?.name ?? (hostIsReal ? session.host.name : null) ?? session.title
        const location = session.address?.split(',')[0] || session.city

        return {
          id: `session:${session.id}`,
          kind: 'session' as const,
          markerVariant: 'session' as const,
          title: session.title,
          latitude: session.latitude,
          longitude: session.longitude,
          city: session.city,
          primaryLabel: activityLabel,
          priceLabel: formatBuddyMapPrice(session.price, session.currency),
          activityLabel: pinEmoji(session.categorySlug ?? 'other'),
          previewTitle: displayName,
          previewSubtitle: session.community ? `Known plan: ${session.title}` : session.title,
          previewMeta: `${session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'} · ${location}`,
          previewImage:
            session.resolvedImageUrl ||
            session.imageUrl ||
            session.community?.coverImage ||
            session.community?.logoImage ||
            (hostIsReal ? session.host.imageUrl : null),
        }
      })

      return [...communityPins, ...sessionPins]
    },
    [activeLocationLabel, communityPreviews, sessions],
  )

  useEffect(() => {
    if (viewMode !== 'map') return
    const key = [
      cityConfig.slug,
      activeDateLabel,
      typeFilter || 'all',
      pricingFilter || 'all',
      levelFilter || 'all',
      sessions.length,
      communityPreviews.length,
    ].join(':')
    if (mapDrawerTrackedRef.current === key) return
    mapDrawerTrackedRef.current = key
    trackBrowserEvent('buddy_map_drawer_opened', {
      city: cityConfig.slug,
      activeDateLabel,
      type: typeFilter || 'all',
      pricing: pricingFilter || 'all',
      fitnessLevel: levelFilter || 'all',
      sessionCount: sessions.length,
      communityCount: communityCount ?? 0,
    })
  }, [
    activeDateLabel,
    cityConfig.slug,
    communityCount,
    levelFilter,
    pricingFilter,
    communityPreviews.length,
    sessions.length,
    typeFilter,
    viewMode,
  ])

  const activeTypeLabel = TYPE_FILTERS.find((type) => type.value === typeFilter)?.label ?? 'All'
  const activePriceLabel =
    PRICING_FILTERS.find((price) => price.value === pricingFilter)?.label ?? 'All prices'
  const activeLevelLabel =
    LEVEL_FILTERS.find((level) => level.value === levelFilter)?.label ?? 'All levels'

  function updateTypeFilter(value: string) {
    const next = typeFilter === value ? '' : value
    setTypeFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'type',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function openSeededCreate(idea: StarterSessionIdea, source: string) {
    setTypeFilter(idea.type)
    setCreateSeed({
      categorySlug: idea.categorySlug,
      title: idea.seedTitle,
    })
    setShowCreateSheet(true)
    trackBrowserEvent('buddy_quick_intent_selected', {
      label: idea.label,
      type: idea.type,
      categorySlug: idea.categorySlug,
      source,
      city: cityConfig.slug,
      viewMode,
    })
  }

  function updatePricingFilter(value: string) {
    const next = pricingFilter === value ? '' : value
    setPricingFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'pricing',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updateLevelFilter(value: string) {
    const next = levelFilter === value ? '' : value
    setLevelFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'fitnessLevel',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updateDateFilter(value: string) {
    const next = dateFilter === value ? '' : value
    setDateFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'date',
      value: next || 'all',
      city: cityConfig.slug,
    })
  }

  function updateNeighborhoodFilter(value: CityNeighborhood) {
    const next = neighborhoodFilter?.name === value.name ? null : value
    setNeighborhoodFilter(next)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'neighborhood',
      value: next?.name ?? 'all',
      city: cityConfig.slug,
    })
  }

  const requestCurrentLocation = useCallback(() => {
    profileCityLockedRef.current = false
    setDiscoveryMode('nearby')
    setLocationStatus('detecting')
    setLocationReady(false)
    setNeighborhoodFilter(null)
    setSelectedPin(null)
    setSelectedMapPinId(null)

    if (!navigator.geolocation) {
      setDiscoveryMode(explicitNearbyLocation ? 'nearby' : 'city')
      setLocationStatus('unsupported')
      setCityConfig(DEFAULT_CITY_LOCATION_CONFIG)
      setUserLocation(null)
      setLocationReady(true)
      return
    }

    let settled = false
    const settle = () => {
      if (!settled) {
        settled = true
        setLocationReady(true)
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (profileCityLockedRef.current) return
        const nextLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(nextLocation)
        storeDiscoveryLocation(nextLocation)
        setLocationStatus('granted')
        settle()
      },
      () => {
        setDiscoveryMode(explicitNearbyLocation ? 'nearby' : 'city')
        setLocationStatus('denied')
        setCityConfig(DEFAULT_CITY_LOCATION_CONFIG)
        setUserLocation(null)
        settle()
      },
      { timeout: 3000, maximumAge: 60000 },
    )

    const timer = setTimeout(() => {
      if (profileCityLockedRef.current) return
      if (!settled) {
        setDiscoveryMode(explicitNearbyLocation ? 'nearby' : 'city')
        setLocationStatus('denied')
        setCityConfig(DEFAULT_CITY_LOCATION_CONFIG)
        setUserLocation(null)
      }
      settle()
    }, 3000)

    return () => clearTimeout(timer)
  }, [explicitNearbyLocation])

  function updateCityFilter(value: string) {
    if (value === NEARBY_FILTER_VALUE) {
      requestCurrentLocation()
      trackBrowserEvent('buddy_filter_used', {
        filter: 'city',
        value: NEARBY_FILTER_VALUE,
        city: NEARBY_FILTER_VALUE,
      })
      return
    }

    const nextCity = getCityLocationConfig(value)
    profileCityLockedRef.current = true
    setDiscoveryMode('city')
    setLocationStatus('city')
    setLocationReady(true)
    setCityConfig(nextCity)
    setUserLocation(nextCity.center)
    setNeighborhoodFilter(null)
    setSelectedPin(null)
    setSelectedMapPinId(null)
    trackBrowserEvent('buddy_filter_used', {
      filter: 'city',
      value: nextCity.slug,
      city: nextCity.slug,
    })
  }

  function updateNeighborhoodSelect(value: string) {
    if (!value) {
      setNeighborhoodFilter(null)
      trackBrowserEvent('buddy_filter_used', {
        filter: 'neighborhood',
        value: 'all',
        city: cityConfig.slug,
      })
      return
    }

    const selected = cityConfig.neighborhoods.find((n) => n.name === value)
    if (selected) updateNeighborhoodFilter(selected)
  }

  const handleMapPinClick = useCallback(
    (session: Session | null, pinId?: string | null) => {
      setSelectedPin(session)
      setSelectedMapPinId(session ? pinId ?? `session:${session.id}` : null)
      if (!session) return

      trackBrowserEvent('buddy_map_pin_clicked', {
        sessionId: session.id,
        category: session.categorySlug ?? 'unknown',
        city: cityConfig.slug,
        viewMode,
      })
    },
    [cityConfig.slug, viewMode],
  )

  const handleVectorMapPinClick = useCallback(
    (pin: SessionVectorMapPin | null) => {
      if (!pin) {
        handleMapPinClick(null)
        setSelectedMapPinId(null)
        return
      }

      if (pin.kind === 'community') {
        setSelectedPin(null)
        setSelectedMapPinId(pin.id)
        trackBrowserEvent('buddy_map_pin_clicked', {
          communityPinId: pin.id,
          city: cityConfig.slug,
          viewMode,
        })
        return
      }

      const sessionId = pin.id.replace(/^session:/, '')
      handleMapPinClick(sessionById.get(sessionId) ?? null, pin.id)
    },
    [cityConfig.slug, handleMapPinClick, sessionById, viewMode],
  )

  function updateSessionAfterRsvp(sessionId: string, updates: Partial<Session>) {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, ...updates } : session)),
    )
    setSearchResults((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, ...updates } : session)),
    )
    setSelectedPin((current) => (current?.id === sessionId ? { ...current, ...updates } : current))
  }

  function redirectToSignIn(session: Session) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'auth_intent',
        JSON.stringify({
          intent: 'buddy_rsvp',
          sessionId: session.id,
          timestamp: Date.now(),
        }),
      )
    }

    const redirectUrl =
      discoveryMode === 'nearby'
        ? `/buddy?view=${viewMode}&location=nearby`
        : `/buddy?view=${viewMode}&city=${cityConfig.slug}`
    router.push(`/sign-in?intent=rsvp&redirect_url=${encodeURIComponent(redirectUrl)}`)
  }

  async function handleJoinSession(session: Session, source: string) {
    if (!authLoaded) return
    if (!isSignedIn) {
      redirectToSignIn(session)
      return
    }

    if (session.isFull || session.requiresApproval || session.activityMode === 'P2P_PAID') {
      router.push(`/activities/${session.id}`)
      return
    }

    if (rsvpLoadingId) return
    setRsvpLoadingId(session.id)
    const userMarkedSolo = soloOptedSessionIds.has(session.id)

    try {
      const res = await fetch(`/api/buddy/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 402 || data.code === 'PAYMENT_REQUIRED') {
        router.push(`/activities/${session.id}`)
        return
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to RSVP')
      }

      updateSessionAfterRsvp(session.id, {
        userStatus: 'JOINED',
        attendeeCount:
          session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
            ? session.attendeeCount
            : session.attendeeCount + 1,
        isFull:
          typeof session.maxPeople === 'number'
            ? session.attendeeCount + 1 >= session.maxPeople
            : session.isFull,
      })
      toast.success("You're going")
      trackBrowserEvent('buddy_quick_rsvp_joined', {
        sessionId: session.id,
        source,
        city: session.city,
        category: session.categorySlug ?? 'unknown',
        communityId: session.community?.id ?? null,
      })
      setSoloPromptSession(session)
      if (session.community && !followedCommunityIds.has(session.community.id)) {
        setPendingFollowSession(session)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to RSVP')
    } finally {
      setRsvpLoadingId(null)
    }
  }

  async function handleLeaveSession(session: Session, source: string) {
    if (!authLoaded) return
    if (!isSignedIn) {
      redirectToSignIn(session)
      return
    }

    if (rsvpLoadingId) return
    setRsvpLoadingId(session.id)
    const userMarkedSolo = soloOptedSessionIds.has(session.id)

    try {
      const res = await fetch(`/api/buddy/sessions/${session.id}/leave`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update RSVP')
      }

      updateSessionAfterRsvp(session.id, {
        userStatus: 'CANCELLED',
        attendeeCount: Math.max(0, session.attendeeCount - 1),
        goingSoloCount: userMarkedSolo
          ? Math.max(0, (session.goingSoloCount ?? 0) - 1)
          : session.goingSoloCount,
        isFull: false,
      })
      if (userMarkedSolo) {
        setSoloOptedSessionIds((prev) => {
          const next = new Set(prev)
          next.delete(session.id)
          return next
        })
      }
      toast.success('RSVP cancelled')
      trackBrowserEvent('buddy_quick_rsvp_cancelled', {
        sessionId: session.id,
        source,
        city: session.city,
        category: session.categorySlug ?? 'unknown',
        communityId: session.community?.id ?? null,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update RSVP')
    } finally {
      setRsvpLoadingId(null)
    }
  }

  async function handleFollowPrompt() {
    const community = followPromptSession?.community
    if (!community) return

    setFollowLoadingId(community.id)
    try {
      const res = await fetch('/api/community/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: community.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to follow host')
      }

      setFollowedCommunityIds((prev) => new Set(prev).add(community.id))
      setFollowPromptSession(null)
      toast.success(`Following ${community.name}`)
      trackBrowserEvent('buddy_post_rsvp_followed_host', {
        communityId: community.id,
        communitySlug: community.slug,
        sessionId: followPromptSession.id,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to follow host')
    } finally {
      setFollowLoadingId(null)
    }
  }

  function revealPendingFollowPrompt() {
    if (
      pendingFollowSession?.community &&
      !followedCommunityIds.has(pendingFollowSession.community.id)
    ) {
      setFollowPromptSession(pendingFollowSession)
    }
    setPendingFollowSession(null)
  }

  async function handleGoingSoloAnswer(goingSolo: boolean) {
    const session = soloPromptSession
    if (!session) return

    setSoloPromptLoading(true)
    try {
      const res = await fetch(`/api/events/${session.id}/going-solo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goingSolo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      if (goingSolo) {
        updateSessionAfterRsvp(session.id, {
          goingSoloCount: (session.goingSoloCount ?? 0) + 1,
        })
        setSoloOptedSessionIds((prev) => new Set(prev).add(session.id))
      }

      trackBrowserEvent('buddy_going_solo_answered', {
        sessionId: session.id,
        goingSolo,
        city: session.city,
        category: session.categorySlug ?? 'unknown',
        communityId: session.community?.id ?? null,
      })
      setSoloPromptSession(null)
      revealPendingFollowPrompt()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSoloPromptLoading(false)
    }
  }

  function dismissGoingSoloPrompt() {
    if (soloPromptSession) {
      trackBrowserEvent('buddy_going_solo_dismissed', {
        sessionId: soloPromptSession.id,
        city: soloPromptSession.city,
        category: soloPromptSession.categorySlug ?? 'unknown',
        communityId: soloPromptSession.community?.id ?? null,
      })
    }
    setSoloPromptSession(null)
    revealPendingFollowPrompt()
  }

  function toggleViewMode() {
    const next = viewMode === 'list' ? 'map' : 'list'
    const nextDateFilter = next === 'map' && !dateFilter ? todayDateString : dateFilter
    setViewMode(next)
    if (nextDateFilter !== dateFilter) setDateFilter(nextDateFilter)
    setSelectedPin(null)
    setSelectedMapPinId(null)

    const params = new URLSearchParams(searchParams.toString())
    if (next === 'map') {
      params.set('view', 'map')
      if (nextDateFilter) params.set('date', nextDateFilter)
    } else {
      params.delete('view')
    }
    router.replace(`/buddy${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })

    trackBrowserEvent('buddy_view_changed', {
      viewMode: next,
      city: cityConfig.slug,
      type: typeFilter || 'all',
      pricing: pricingFilter || 'all',
      fitnessLevel: levelFilter || 'all',
      sessionCount: sessions.length,
    })
  }

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      if (!cursor) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({ tab: 'happening' })
        if (typeFilter) params.set('type', typeFilter)
        if (pricingFilter) params.set('pricing', pricingFilter)
        if (levelFilter) params.set('fitnessLevel', levelFilter)
        if (dateFilter) params.set('date', dateFilter)
        if (cursor) params.set('cursor', cursor)
        const effectiveLocation = neighborhoodFilter
          ? { lat: neighborhoodFilter.lat, lng: neighborhoodFilter.lng }
          : userLocation
        const isCityScoped = discoveryMode === 'city' || Boolean(neighborhoodFilter)
        const activeCityConfig =
          isCityScoped || !effectiveLocation
            ? cityConfig
            : getNearestCityLocationConfig(effectiveLocation.lat, effectiveLocation.lng)
        if (isCityScoped) params.set('city', activeCityConfig.slug)
        else params.set('location', NEARBY_FILTER_VALUE)
        params.set('timezone', isCityScoped ? activeCityConfig.timezone : activeTimezone)
        if (effectiveLocation) {
          params.set('lat', String(effectiveLocation.lat))
          params.set('lng', String(effectiveLocation.lng))
        }
        if (neighborhoodFilter) {
          params.set('radius', String(neighborhoodFilter.radius))
        }

        const res = await fetch(`/api/buddy/sessions?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()

        if (cursor) {
          setSessions((prev) => [...prev, ...(data.sessions ?? [])])
        } else {
          setSessions(data.sessions ?? [])
        }
        setNextCursor(data.nextCursor ?? null)
        if (data.currentUserId) setCurrentUserId(data.currentUserId)
      } catch {
        toast.error('Failed to load sessions')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [
      typeFilter,
      pricingFilter,
      levelFilter,
      dateFilter,
      userLocation,
      neighborhoodFilter,
      cityConfig,
      discoveryMode,
      activeTimezone,
    ],
  )

  useEffect(() => {
    if (!userLocation) return
    if (profileCityLockedRef.current) return
    const detectedCity = getNearestCityLocationConfig(userLocation.lat, userLocation.lng)
    setCityConfig((current) => (current.slug === detectedCity.slug ? current : detectedCity))
  }, [userLocation])

  useEffect(() => {
    setNeighborhoodFilter(null)
  }, [cityConfig.slug])

  // Get user location on mount. Explicit city URLs keep their city-scoped behavior.
  useEffect(() => {
    if (profileCityLockedRef.current) {
      setUserLocation(initialCityConfig.center)
      setLocationReady(true)
      return
    }

    return requestCurrentLocation()
  }, [initialCityConfig.center, requestCurrentLocation])

  // Load user context after browser location resolves. Profile location is only a fallback.
  useEffect(() => {
    if (!locationReady) return
    if (!authLoaded) return
    if (!isSignedIn) {
      setCurrentUserId(null)
      setProfileLocationReady(true)
      return
    }

    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/user/p2p-onboarding')
        const contentType = res.headers.get('content-type') ?? ''
        const data = res.ok && contentType.includes('application/json') ? await res.json() : null
        if (data?.user?.accountStatus === 'BANNED' || data?.user?.accountStatus === 'SUSPENDED') {
          router.replace('/banned')
          return
        }
        if (data?.user?.id) setCurrentUserId(data.user.id)

        const profileCity = getCityLocationConfigFromText(data?.user?.location)
        if (
          profileCity &&
          !explicitNearbyLocation &&
          !profileCityLockedRef.current &&
          (discoveryMode === 'nearby' ||
            locationStatus === 'denied' ||
            locationStatus === 'unsupported') &&
          locationStatus !== 'granted' &&
          !userLocation
        ) {
          profileCityLockedRef.current = true
          setDiscoveryMode('city')
          setLocationStatus('city')
          setCityConfig(profileCity)
          setUserLocation(profileCity.center)
        }
      } finally {
        setProfileLocationReady(true)
      }
    }
    loadInitialData()
  }, [
    authLoaded,
    discoveryMode,
    explicitNearbyLocation,
    isSignedIn,
    locationReady,
    locationStatus,
    router,
    userLocation,
  ])

  useEffect(() => {
    if (!locationReady || authLoaded || profileLocationReady) return

    const timer = window.setTimeout(() => {
      setProfileLocationReady(true)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [authLoaded, locationReady, profileLocationReady])

  useEffect(() => {
    if (!authLoaded || !isSignedIn) {
      setMyUpcomingSessions([])
      setMyPlansLoading(false)
      return
    }

    let cancelled = false
    setMyPlansLoading(true)

    fetch('/api/buddy/sessions/mine')
      .then((res) => (res.ok ? res.json() : { upcoming: [] }))
      .then((data) => {
        if (cancelled) return
        setMyUpcomingSessions((data.upcoming ?? []).slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setMyUpcomingSessions([])
      })
      .finally(() => {
        if (!cancelled) setMyPlansLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoaded, isSignedIn])

  useEffect(() => {
    if (!locationReady || !profileLocationReady) return

    let cancelled = false
    setCommunityCountLoading(true)

    const params = new URLSearchParams({
      city: cityConfig.slug,
      limit: '6',
    })
    if (typeFilter) params.set('category', typeFilter)

    fetch(`/api/communities?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { total: null }))
      .then((data) => {
        if (cancelled) return
        setCommunityCount(typeof data.total === 'number' ? data.total : null)
        setCommunityPreviews(Array.isArray(data.communities) ? data.communities.slice(0, 6) : [])
      })
      .catch(() => {
        if (!cancelled) {
          setCommunityCount(null)
          setCommunityPreviews([])
        }
      })
      .finally(() => {
        if (!cancelled) setCommunityCountLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cityConfig.slug, locationReady, profileLocationReady, typeFilter])

  // Check for pending feedback + bio prompt on past sessions
  useEffect(() => {
    if (!currentUserId) return

    // Check pending feedback
    fetch('/api/buddy/sessions/pending-feedback')
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((data) => {
        if (data.sessions?.length > 0) {
          setTimeout(() => setFeedbackSession(data.sessions[0]), 2000)
        }
      })
      .catch(() => {})

    // Check if bio prompt should show (3+ sessions, no bio, not dismissed)
    try {
      if (localStorage.getItem('sb_bio_prompted')) return
    } catch {
      return
    }
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile && !data.profile.bio && data.profile.sessionsAttendedCount >= 3) {
          // Show after feedback dismisses (or 5s if no feedback)
          setTimeout(() => setShowBioPrompt(true), 5000)
        }
      })
      .catch(() => {})
  }, [currentUserId])

  // Refetch when filters change
  useEffect(() => {
    if (!locationReady) return
    if (!profileLocationReady) return
    setSessions([])
    setSelectedPin(null)
    setSelectedMapPinId(null)
    fetchSessions()
  }, [
    locationReady,
    profileLocationReady,
    typeFilter,
    pricingFilter,
    levelFilter,
    dateFilter,
    neighborhoodFilter,
    fetchSessions,
  ])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type: 'sessions',
        })
        const activeCityConfig = profileCityLockedRef.current
          ? cityConfig
          : userLocation
            ? getNearestCityLocationConfig(userLocation.lat, userLocation.lng)
            : cityConfig
        const searchLocation = userLocation ?? activeCityConfig.center
        params.set('city', activeCityConfig.slug)
        params.set('lat', String(searchLocation.lat))
        params.set('lng', String(searchLocation.lng))
        const res = await fetch(`/api/search?${params}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.sessions ?? [])
        }
      } catch {
        /* ignore */
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, userLocation, cityConfig])

  if (!hasMounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0B0D0C] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col bg-[#0B0D0C]"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* Create Session Sheet */}
      <CreateSessionSheet
        open={showCreateSheet}
        initialCategorySlug={createSeed?.categorySlug}
        initialTitle={createSeed?.title}
        onClose={() => {
          setShowCreateSheet(false)
          setCreateSeed(null)
        }}
        onSuccess={() => {
          setCreateSeed(null)
          fetchSessions()
        }}
      />
      <CreateChoiceSheet
        open={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
        onHostSession={() => {
          setShowCreateMenu(false)
          setCreateSeed(null)
          setShowCreateSheet(true)
        }}
      />

      {/* Bio Prompt */}
      <BioPromptSheet
        open={showBioPrompt && !feedbackSession}
        onClose={() => setShowBioPrompt(false)}
      />

      {/* Post-Session Feedback */}
      <SessionFeedbackSheet
        open={!!feedbackSession}
        onClose={() => setFeedbackSession(null)}
        sessionId={feedbackSession?.id ?? ''}
        sessionTitle={feedbackSession?.title ?? ''}
        hostId={feedbackSession?.hostId ?? ''}
        hostName={feedbackSession?.hostName ?? null}
      />

      <BuddyMobileConceptShell
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        activeLocationLabel={neighborhoodFilter?.name ?? activeLocationLabel}
        activeDateLabel={activeDateLabel}
        activeTimezone={activeTimezone}
        todayDateString={todayDateString}
        dateFilter={dateFilter}
        onDateChange={updateDateFilter}
        typeFilter={typeFilter}
        onTypeChange={updateTypeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searching={searching}
        searchResults={searchResults}
        sessions={sessions}
        communities={communityPreviews}
        communityCount={communityCount}
        loading={loading || communityCountLoading}
        myNextSession={myUpcomingSessions[0] ?? null}
        myPlansLoading={myPlansLoading}
        mapCenter={userLocation ?? cityConfig.center}
        mapPins={mapPins}
        selectedMapPinId={selectedMapPinId}
        selectedPin={selectedPin}
        onPinClick={handleVectorMapPinClick}
        onClearSelectedPin={() => {
          setSelectedPin(null)
          setSelectedMapPinId(null)
        }}
        onCreate={() => {
          setCreateSeed(null)
          setShowCreateMenu(true)
        }}
        onHostSession={() => {
          setCreateSeed(null)
          setShowCreateSheet(true)
        }}
        onJoin={handleJoinSession}
        onLeave={handleLeaveSession}
        onPreviewAttendees={setAttendeeSheetSession}
        rsvpLoadingId={rsvpLoadingId}
        signedIn={Boolean(isSignedIn)}
        citySlug={cityConfig.slug}
      />

      <div className="hidden min-h-0 flex-1 flex-col md:flex" data-buddy-desktop-shell>
      {/* ── Filters — sticky top bar ── */}
      <div className="sticky top-0 z-20 pt-[env(safe-area-inset-top,4px)]">
        <div className="space-y-1.5 border-b border-white/[0.07] bg-[#0B0D0C]/92 px-3 pb-2 pt-1.5 font-mono backdrop-blur-xl">
          <div className="flex min-h-9 items-center justify-between gap-3">
            <Link
              href="/"
              aria-label="SweatBuddies home"
              className="inline-flex min-h-9 min-w-9 items-center bg-[#0B4BA8] px-2.5"
            >
              <LogoWithText
                size={23}
                color="#FFFFFF"
                textColor="#FFFFFF"
                wordmarkClassName="max-[360px]:hidden"
              />
            </Link>
            <p className="hidden min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.16em] text-white/42 sm:block">
              Solo-friendly fitness plans
            </p>
            <Link
              href="/host"
              className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-md border-2 border-[#17130E] bg-[#F4EFE3] px-3 text-[10px] font-black uppercase tracking-wide text-[#17130E] shadow-[2px_2px_0_#17130E] transition-colors hover:bg-[#F8F4EA]"
            >
              Host
            </Link>
          </div>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Search communities or activities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-10 w-full rounded-full border border-white/12 bg-white/[0.045] py-2 pl-9 pr-10 text-sm text-white transition-all placeholder:text-white/38 focus:border-white/30 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-[#666666] hover:text-white transition-colors" />
              </button>
            )}
          </div>
          {/* Row 1: Date strip */}
          <div
            data-testid="buddy-date-strip"
            className={`${viewMode === 'map' ? 'hidden sm:grid' : 'grid'} grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 max-[360px]:grid-cols-[minmax(0,1fr)_auto]`}
          >
            <div className="flex min-w-0 gap-1 overflow-x-auto no-scrollbar">
              {(() => {
                const days = []
                for (let i = 0; i < 7; i++) {
                  const dateStr = getLocalDateString(activeTimezone, i)
                  const d = new Date(`${dateStr}T00:00:00`)
                  const dayLabel =
                    i === 0
                      ? 'Today'
                      : i === 1
                        ? 'Tmr'
                        : d.toLocaleDateString('en-US', {
                            weekday: 'short',
                            timeZone: activeTimezone,
                          })
                  const dateNum = d.toLocaleDateString('en-US', {
                    day: 'numeric',
                    timeZone: activeTimezone,
                  })
                  days.push(
                    <button
                      key={dateStr}
                      onClick={() => updateDateFilter(dateStr)}
                      className={`flex min-h-10 min-w-[42px] flex-shrink-0 flex-col items-center justify-center rounded-lg px-2.5 py-1.5 text-center transition-all ${
                        dateFilter === dateStr
                          ? 'bg-white text-black shadow-md'
                          : 'bg-[#171A18] text-[#999999] shadow-none'
                      }`}
                    >
                      <span className="text-[10px] font-medium leading-tight">{dayLabel}</span>
                      <span className="text-[13px] font-bold leading-tight">{dateNum}</span>
                    </button>,
                  )
                }
                return days
              })()}
              <button
                onClick={() => updateDateFilter('')}
                className={`flex min-h-10 min-w-[70px] flex-shrink-0 flex-col items-center justify-center rounded-lg px-2.5 py-1.5 text-center transition-all ${
                  !dateFilter
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#171A18] text-[#999999] shadow-none'
                }`}
              >
                <span className="text-[10px] font-medium leading-tight">All</span>
                <span className="text-[13px] font-bold leading-tight">Upcoming</span>
              </button>
            </div>
            <button
              onClick={() => setShowCreateMenu(true)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#C6E76A] shadow-lg shadow-[#C6E76A]/16 transition-colors hover:bg-[#D8F18A] active:scale-95"
              aria-label="Add to the map"
            >
              <Plus className="w-4 h-4 text-black" />
            </button>
            <button
              type="button"
              onClick={toggleViewMode}
              className="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#171A18] px-3 text-[11px] font-black uppercase tracking-wide text-white transition-colors hover:border-white/30 active:scale-95 max-[360px]:hidden lg:hidden"
              aria-label={viewMode === 'list' ? 'Show map' : 'Show list'}
            >
              {viewMode === 'list' ? (
                <>
                  <Map className="w-3.5 h-3.5" /> Map
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5" /> List
                </>
              )}
            </button>
          </div>

          {/* Mobile collapsed filters */}
          <details className={viewMode === 'map' ? 'hidden' : 'group sm:hidden'}>
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-lg border border-white/[0.12] bg-[#171A18] px-3 text-[12px] font-black uppercase tracking-wide text-white transition-colors group-open:border-white/30 [&::-webkit-details-marker]:hidden">
              <span>Filters</span>
              <span className="min-w-0 truncate text-right text-[10px] text-[#999999]">
                {[neighborhoodFilter?.name ?? activeLocationLabel, activeTypeLabel, activePriceLabel]
                  .filter(Boolean)
                  .join(' / ')}
              </span>
            </summary>
            <div className="mt-2 grid gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <FilterOptionGroup
                label="Location"
                value={locationFilterValue}
                onChange={updateCityFilter}
                options={locationFilterOptions}
              />
              <FilterOptionGroup
                label="Area"
                value={neighborhoodFilter?.name ?? ''}
                onChange={updateNeighborhoodSelect}
                options={[
                  { value: '', label: 'All areas' },
                  ...cityConfig.neighborhoods.map((n) => ({ value: n.name, label: n.name })),
                ]}
              />
              <FilterOptionGroup
                label="Activity"
                value={typeFilter}
                onChange={updateTypeFilter}
                options={TYPE_FILTERS}
              />
              <FilterOptionGroup
                label="Price"
                value={pricingFilter}
                onChange={updatePricingFilter}
                options={PRICING_FILTERS}
              />
              <FilterOptionGroup
                label="Level"
                value={levelFilter}
                onChange={updateLevelFilter}
                options={LEVEL_FILTERS}
              />
            </div>
          </details>

          {/* Tablet and desktop dropdown filters */}
          <div className="hidden grid-cols-5 gap-1.5 sm:grid">
            <FilterMenu
              label="Location"
              displayValue={activeLocationLabel}
              value={locationFilterValue}
              onChange={updateCityFilter}
              options={locationFilterOptions}
            />
            <FilterMenu
              label="Area"
              displayValue={neighborhoodFilter?.name ?? 'All areas'}
              value={neighborhoodFilter?.name ?? ''}
              onChange={updateNeighborhoodSelect}
              options={[
                { value: '', label: 'All areas' },
                ...cityConfig.neighborhoods.map((n) => ({ value: n.name, label: n.name })),
              ]}
            />
            <FilterMenu
              label="Activity"
              displayValue={activeTypeLabel}
              value={typeFilter}
              onChange={updateTypeFilter}
              options={TYPE_FILTERS}
            />
            <FilterMenu
              label="Price"
              displayValue={activePriceLabel}
              value={pricingFilter}
              onChange={updatePricingFilter}
              options={PRICING_FILTERS}
            />
            <FilterMenu
              label="Level"
              displayValue={activeLevelLabel}
              value={levelFilter}
              onChange={updateLevelFilter}
              options={LEVEL_FILTERS}
            />
          </div>

          <div className="hidden min-h-7 items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#777777] sm:flex">
            {[
              neighborhoodFilter?.name ?? activeLocationLabel,
              activeTypeLabel,
              activePriceLabel,
              activeLevelLabel,
            ].map((value) => (
              <span
                key={value}
                className="shrink-0 rounded-full border border-white/[0.08] bg-[#111412] px-2.5 py-1"
              >
                {value}
              </span>
            ))}
            {(typeFilter || pricingFilter || levelFilter || dateFilter || neighborhoodFilter) && (
              <button
                onClick={() => {
                  setTypeFilter('')
                  setPricingFilter('')
                  setLevelFilter('')
                  setDateFilter('')
                  setNeighborhoodFilter(null)
                }}
                className="min-h-10 shrink-0 rounded-full border border-white/[0.10] px-3 py-1 text-[#999999] hover:border-white/30 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      {viewMode === 'list' ? (
        <LocationPermissionPanel
          status={locationStatus}
          cityOptions={CITY_LOCATION_CONFIGS}
          onUseLocation={requestCurrentLocation}
          onChooseCity={updateCityFilter}
        />
      ) : null}

      {viewMode === 'list' ? (
        <div className="flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-[minmax(390px,42vw)_1fr]">
          {/* List view — community-first cards backed by known sessions */}
          <div className="h-full min-h-0 overflow-y-auto border-white/[0.08] px-4 pb-24 lg:border-r">
            <div className="sticky top-0 z-10 -mx-4 border-b border-white/[0.08] bg-[#0B0D0C]/96 px-4 py-3 backdrop-blur-xl">
              <LocalPulsePanel
                activeLocationLabel={neighborhoodFilter?.name ?? activeLocationLabel}
                activeDateLabel={activeDateLabel}
                sessions={sessions}
                communityCount={communityCount}
                myNextSession={myUpcomingSessions[0] ?? null}
                loading={loading || communityCountLoading || myPlansLoading}
                signedIn={Boolean(isSignedIn)}
                locationStatus={locationStatus}
                communityHref={`/communities?city=${encodeURIComponent(cityConfig.slug)}`}
                onOpenMap={toggleViewMode}
                onUseLocation={requestCurrentLocation}
              />
              <DiscoveryWorkspaceNav
                viewMode={viewMode}
                communityHref={`/communities?city=${encodeURIComponent(cityConfig.slug)}`}
                onToggleView={toggleViewMode}
              />
            </div>
            {!searchQuery.trim() ? (
              <QuickIntentRail
                ideas={STARTER_SESSION_IDEAS}
                activeType={typeFilter}
                onSelect={(idea) => openSeededCreate(idea, 'list_intent_rail')}
              />
            ) : null}
            {/* Search results */}
            {searchQuery.trim() ? (
              <div className="pt-3">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-16">
                    <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
                    <p className="text-sm text-[#666666]">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-[#999999]">
                      No solo-friendly plans or communities for &apos;{searchQuery}&apos;
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 inline-flex min-h-10 items-center text-xs text-[#666666] underline transition-colors hover:text-white"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-[#666666] uppercase tracking-wider">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#666666] hover:text-white transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
                      {searchResults.map((session, i) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          index={i}
                          source="search_results"
                          rsvpLoading={rsvpLoadingId === session.id}
                          onJoin={handleJoinSession}
                          onLeave={handleLeaveSession}
                          onPreviewAttendees={setAttendeeSheetSession}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {!loading && sessions.length > 0 && (
                  <ResultsCommandHeader
                    sessionCount={discoveryStats.sessionCount}
                    peopleCount={discoveryStats.peopleCount}
                    goingSoloCount={discoveryStats.goingSoloCount}
                    communityCount={communityCount}
                    activeLocationLabel={neighborhoodFilter?.name ?? activeLocationLabel}
                    activeDateLabel={activeDateLabel}
                  />
                )}

                {loading ? (
                  <div className="pt-3 space-y-8">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-white/[0.06] bg-[#111412] p-3"
                      >
                        <div className="h-20 rounded-lg bg-[#1B1F1C] shimmer" />
                        <div className="min-w-0 py-1">
                          <div className="h-3 w-20 rounded bg-[#1B1F1C] shimmer" />
                          <div className="mt-3 h-4 w-4/5 rounded bg-[#1B1F1C] shimmer" />
                          <div className="mt-2 h-3 w-3/5 rounded bg-[#1B1F1C] shimmer" />
                          <div className="mt-4 flex gap-2">
                            <div className="h-6 w-16 rounded-full bg-[#1B1F1C] shimmer" />
                            <div className="h-6 w-20 rounded-full bg-[#1B1F1C] shimmer" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <style>{`
                  .shimmer {
                    background: linear-gradient(90deg, #1B1F1C 25%, #2A2A2A 50%, #1B1F1C 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                  }
                  @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                `}</style>
                  </div>
                ) : sessions.length === 0 ? (
                  communityCountLoading ||
                  communityPreviews.length > 0 ? (
                    <LocalDirectoryFallback
                      cityName={neighborhoodFilter?.name ?? activeLocationLabel}
                      communityCount={communityCount}
                      communities={communityPreviews}
                      loading={communityCountLoading}
                      hasFilters={Boolean(
                        typeFilter ||
                        pricingFilter ||
                        levelFilter ||
                        dateFilter ||
                        neighborhoodFilter,
                      )}
                      communityHref={`/communities?city=${encodeURIComponent(cityConfig.slug)}`}
                      onClearFilters={() => {
                        setTypeFilter('')
                        setPricingFilter('')
                        setLevelFilter('')
                        setDateFilter('')
                        setNeighborhoodFilter(null)
                      }}
                      onCreate={() => setShowCreateMenu(true)}
                      onOpenMap={toggleViewMode}
                    />
                  ) : (
                    <CityEmptyState
                      cityName={neighborhoodFilter?.name ?? activeLocationLabel}
                      citySlug={cityConfig.slug}
                      hasFilters={Boolean(
                        typeFilter ||
                        pricingFilter ||
                        levelFilter ||
                        dateFilter ||
                        neighborhoodFilter,
                      )}
                      onClearFilters={() => {
                        setTypeFilter('')
                        setPricingFilter('')
                        setLevelFilter('')
                        setDateFilter('')
                        setNeighborhoodFilter(null)
                      }}
                      onCreate={() => setShowCreateMenu(true)}
                      onStarterSelect={(type) => {
                        const idea =
                          STARTER_SESSION_IDEAS.find((starter) => starter.type === type) ??
                          STARTER_SESSION_IDEAS[0]
                        openSeededCreate(idea, 'empty_state')
                      }}
                      showMarketSwitch={discoveryMode === 'city'}
                      onOpenMap={toggleViewMode}
                    />
                  )
                ) : (
                  <div className="space-y-8 pt-1">
                    {bucketSessions(sessions).map((bucket) => (
                      <div key={bucket.key}>
                        {/* Section header — NTC style */}
                        <div className="flex items-center justify-between px-1 mb-3">
                          <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">
                            {bucket.label}
                          </h2>
                          <span className="text-[11px] text-[#666666] uppercase tracking-wider">
                            {bucket.sessions.length} event{bucket.sessions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {/* Horizontal scroll on mobile, grid on desktop */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
                          {bucket.sessions.map((session, i) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              index={i}
                              source={`bucket_${bucket.key}`}
                              rsvpLoading={rsvpLoadingId === session.id}
                              onJoin={handleJoinSession}
                              onLeave={handleLeaveSession}
                              onPreviewAttendees={setAttendeeSheetSession}
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    {nextCursor && (
                      <button
                        onClick={() => fetchSessions(nextCursor)}
                        disabled={loadingMore}
                        className="w-full py-3 text-sm text-[#666666] hover:text-[#999999] flex items-center justify-center gap-2"
                      >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                      </button>
                    )}

                    {sessions.length > 0 && sessions.length < 6 && !nextCursor && (
                      <div className="text-center py-6 border-t border-white/[0.06]">
                        <p className="text-xs text-[#666666] mb-3">
                          That&apos;s everything nearby for now. RSVP to an event or list one we
                          should map.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setShowCreateSheet(true)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-black uppercase tracking-wider"
                          >
                            <Zap className="w-3 h-3" />
                            Post a session
                          </button>
                          <Link
                            href="/communities"
                            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1B1F1C] px-3.5 py-2 text-xs font-semibold text-[#999999]"
                          >
                            Browse communities
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="relative hidden min-h-0 bg-[#151816] lg:block">
            <LazySessionVectorMap
              center={userLocation ?? cityConfig.center}
              pins={mapPins}
              selectedPinId={selectedMapPinId}
              onPinClick={handleVectorMapPinClick}
              onMapClick={() => {
                setSelectedPin(null)
                setSelectedMapPinId(null)
              }}
              initialZoom={12}
              maxFitZoom={13}
              showEmptyState={false}
            />
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-white/[0.10] bg-black/55 px-3 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white/70 backdrop-blur">
              {activeLocationLabel} · community activity ·{' '}
              {sessions.filter((session) => session.latitude && session.longitude).length} plans
            </div>
            {selectedPin && (
              <div className="absolute bottom-5 left-5 z-20 w-[260px] max-w-[calc(100%-40px)]">
                <SessionCard
                  session={selectedPin}
                  index={0}
                  source="desktop_map_selected_pin"
                  rsvpLoading={rsvpLoadingId === selectedPin.id}
                  onJoin={handleJoinSession}
                  onLeave={handleLeaveSession}
                  onPreviewAttendees={setAttendeeSheetSession}
                />
              </div>
            )}
            {!loading && !communityCountLoading && sessions.length === 0 && communityPreviews.length === 0 && (
              <MapEmptyOverlay
                cityName={neighborhoodFilter?.name ?? activeLocationLabel}
                onCreate={() => setShowCreateMenu(true)}
              />
            )}
            {!loading && !communityCountLoading && dateFilter === todayDateString && sessions.length < 3 && communityPreviews.length > 0 && (
                <MapQuietTodayBanner
                  sessionCount={sessions.length}
                  onViewUpcoming={() => updateDateFilter('')}
                />
              )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Map view ── */}
          <div className="relative min-h-0 w-full flex-1">
            <LazySessionVectorMap
              center={userLocation ?? cityConfig.center}
              pins={mapPins}
              selectedPinId={selectedMapPinId}
              onPinClick={handleVectorMapPinClick}
              onMapClick={() => {
                setSelectedPin(null)
                setSelectedMapPinId(null)
              }}
              initialZoom={12}
              maxFitZoom={13}
              showEmptyState={false}
            />
            <MapLocationPermissionOverlay
              status={locationStatus}
              cityOptions={CITY_LOCATION_CONFIGS}
              onUseLocation={requestCurrentLocation}
              onChooseCity={updateCityFilter}
            />
            <MapCommandOverlay
              activeLocationLabel={neighborhoodFilter?.name ?? activeLocationLabel}
              activeDateLabel={activeDateLabel}
              sessionCount={sessions.length}
              communityCount={communityCount}
              communityHref={`/communities?city=${encodeURIComponent(cityConfig.slug)}`}
              onShowList={toggleViewMode}
            />

            {!selectedPin ? (
              <MapActivityDrawer
                activeLocationLabel={neighborhoodFilter?.name ?? activeLocationLabel}
                activeDateLabel={activeDateLabel}
                sessions={sessions}
                communities={communityPreviews}
                loading={loading || communityCountLoading}
                communityHref={`/communities?city=${encodeURIComponent(cityConfig.slug)}`}
                onShowList={toggleViewMode}
                onCreate={() => {
                  setCreateSeed(null)
                  setShowCreateSheet(true)
                }}
              />
            ) : null}

            {/* Selected pin card overlay */}
            {selectedPin && (
              <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-3 right-3 z-30 lg:bottom-5 lg:left-5 lg:right-auto lg:w-[340px]">
                <MapSelectedSessionCard
                  session={selectedPin}
                  onClose={() => setSelectedPin(null)}
                  source="map_selected_pin"
                  rsvpLoading={rsvpLoadingId === selectedPin.id}
                  onJoin={handleJoinSession}
                  onLeave={handleLeaveSession}
                  onPreviewAttendees={setAttendeeSheetSession}
                />
              </div>
            )}
            {!loading && !communityCountLoading && sessions.length === 0 && communityPreviews.length === 0 && (
              <MapEmptyOverlay
                cityName={neighborhoodFilter?.name ?? activeLocationLabel}
                onCreate={() => setShowCreateMenu(true)}
              />
            )}
            {!loading && !communityCountLoading && dateFilter === todayDateString && sessions.length < 3 && communityPreviews.length > 0 && (
                <MapQuietTodayBanner
                  sessionCount={sessions.length}
                  onViewUpcoming={() => updateDateFilter('')}
                />
              )}
          </div>
        </>
      )}
      </div>

      {soloPromptSession ? (
        <GoingSoloAfterRsvpPrompt
          session={soloPromptSession}
          loading={soloPromptLoading}
          onAnswer={handleGoingSoloAnswer}
          onDismiss={dismissGoingSoloPrompt}
        />
      ) : null}

      {!soloPromptSession && followPromptSession?.community ? (
        <FollowAfterRsvpPrompt
          session={followPromptSession}
          loading={followLoadingId === followPromptSession.community.id}
          onFollow={handleFollowPrompt}
          onDismiss={() => setFollowPromptSession(null)}
        />
      ) : null}

      {attendeeSheetSession ? (
        <AttendeePreviewSheet
          session={attendeeSheetSession}
          rsvpLoading={rsvpLoadingId === attendeeSheetSession.id}
          onClose={() => setAttendeeSheetSession(null)}
          onJoin={handleJoinSession}
        />
      ) : null}
    </div>
  )
}

function BuddyMobileConceptShell({
  activeTab,
  onTabChange,
  activeLocationLabel,
  activeDateLabel,
  activeTimezone,
  todayDateString,
  dateFilter,
  onDateChange,
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  searching,
  searchResults,
  sessions,
  communities,
  communityCount,
  loading,
  myNextSession,
  myPlansLoading,
  mapCenter,
  mapPins,
  selectedMapPinId,
  selectedPin,
  onPinClick,
  onClearSelectedPin,
  onCreate,
  onHostSession,
  onJoin,
  onLeave,
  onPreviewAttendees,
  rsvpLoadingId,
  signedIn,
  citySlug,
}: {
  activeTab: MobileBuddyTab
  onTabChange: (tab: MobileBuddyTab) => void
  activeLocationLabel: string
  activeDateLabel: string
  activeTimezone: string
  todayDateString: string
  dateFilter: string
  onDateChange: (date: string) => void
  typeFilter: string
  onTypeChange: (type: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  searching: boolean
  searchResults: Session[]
  sessions: Session[]
  communities: DirectoryCommunityPreview[]
  communityCount: number | null
  loading: boolean
  myNextSession: MySessionSummary | null
  myPlansLoading: boolean
  mapCenter: { lat: number; lng: number }
  mapPins: SessionVectorMapPin[]
  selectedMapPinId: string | null
  selectedPin: Session | null
  onPinClick: (pin: SessionVectorMapPin | null) => void
  onClearSelectedPin: () => void
  onCreate: () => void
  onHostSession: () => void
  onJoin: (session: Session, source: string) => void
  onLeave: (session: Session, source: string) => void
  onPreviewAttendees: (session: Session) => void
  rsvpLoadingId: string | null
  signedIn: boolean
  citySlug: string
}) {
  const [firstTimerOnly, setFirstTimerOnly] = useState(false)
  const candidateSessions = searchQuery.trim() ? searchResults : sessions
  const visibleSessions = firstTimerOnly
    ? candidateSessions.filter(
        (session) => session.fitnessLevel === 'ALL' || (session.goingSoloCount ?? 0) > 0,
      )
    : candidateSessions
  const featuredSession = visibleSessions[0] ?? sessions[0] ?? null
  const visibleCommunities = (firstTimerOnly
    ? communities.filter((community) => community.beginnerFriendly || community.soloFriendly)
    : communities
  ).slice(0, 5)
  const visiblePlans = visibleSessions.slice(0, 6)
  const crewCount = firstTimerOnly ? visibleCommunities.length : communityCount ?? communities.length
  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = getLocalDateString(activeTimezone, index)
      const parsed = new Date(`${date}T00:00:00`)
      return {
        date,
        label:
          index === 0
            ? 'Mon'
            : parsed.toLocaleDateString('en-US', {
                weekday: 'short',
                timeZone: activeTimezone,
              }),
        day: parsed.toLocaleDateString('en-US', {
          day: 'numeric',
          timeZone: activeTimezone,
        }),
      }
    })
  }, [activeTimezone])

  return (
    <section
      data-testid="buddy-mobile-concept"
      className="flex h-full min-h-0 flex-col bg-[#F4EFE3] text-[#17130E] md:hidden"
    >
      <div className="shrink-0 border-b-2 border-[#17130E] px-3 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex min-h-9 items-center justify-between gap-3 font-mono">
          <Link
            href="/"
            className="inline-flex min-h-8 items-center bg-[#0B4BA8] px-2.5 text-[13px] font-black lowercase tracking-tight text-white"
          >
            sweatbuddies
          </Link>
          <p className="min-w-0 flex-1 truncate text-[8px] font-black uppercase tracking-[0.22em] text-[#17130E]/58">
            {activeLocationLabel} &gt; {crewCount} crews live
          </p>
          <Link
            href="/host"
            className="inline-flex min-h-8 shrink-0 items-center justify-center border-2 border-[#17130E] bg-[#F4EFE3] px-3 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#17130E]"
          >
            Host
          </Link>
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_44px] gap-2">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#17130E]/48" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search crews or plans"
              className="min-h-11 w-full border-2 border-[#17130E] bg-[#F8F4EA] py-2 pl-9 pr-3 font-mono text-[13px] font-black text-[#17130E] placeholder:text-[#17130E]/42 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={onCreate}
            className="flex min-h-11 items-center justify-center border-2 border-[#17130E] bg-[#E8412C] text-white shadow-[2px_2px_0_#17130E]"
            aria-label="Add a plan or community"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="relative min-h-0 flex-1">
          <LazySessionVectorMap
            center={mapCenter}
            pins={mapPins}
            selectedPinId={selectedMapPinId}
            onPinClick={onPinClick}
            onMapClick={onClearSelectedPin}
            initialZoom={12}
            maxFitZoom={13}
            fitPadding={104}
            showEmptyState={false}
          />
          <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[236px] border-2 border-[#17130E] bg-[#F8F4EA]/92 px-2.5 py-2 font-mono shadow-[2px_2px_0_#17130E] backdrop-blur">
            <p className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-[#0B4BA8]">
              Within 3 km of {activeLocationLabel}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase text-[#17130E]/56">
              {sessions.length} plans + {crewCount} crews
            </p>
          </div>
          {selectedPin ? (
            <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30">
              <MobileConceptSelectedPlanCard
                session={selectedPin}
                onClose={onClearSelectedPin}
                onJoin={onJoin}
                onLeave={onLeave}
                rsvpLoading={rsvpLoadingId === selectedPin.id}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+86px)]">
          {activeTab === 'crews' ? (
            <div className="py-4">
              <div className="border-b-[6px] border-[#17130E] pb-4">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#E8412C]">
                  Find the crew
                </p>
                <h1 className="mt-1 max-w-[320px] font-sans text-[36px] font-black uppercase leading-[0.94] tracking-normal">
                  Crews near
                  <span className="block text-[#0B4BA8]">you this week</span>
                </h1>
                <p className="mt-3 max-w-[310px] font-serif text-[13px] italic leading-5 text-[#17130E]/72">
                  New here? Start with the ones that say first-timers welcome.
                </p>
              </div>

              <MobileConceptTypeRail activeType={typeFilter} onTypeChange={onTypeChange} />

              <label className="mt-3 flex min-h-10 items-center gap-2 border-b-2 border-[#17130E] font-mono text-[10px] font-black uppercase tracking-wide">
                <input
                  type="checkbox"
                  checked={firstTimerOnly}
                  onChange={(event) => setFirstTimerOnly(event.target.checked)}
                  className="h-4 w-4 accent-[#E8412C]"
                />
                First-timer friendly only
                <span className="ml-auto text-[#E8412C]">{crewCount} crews</span>
              </label>

              {loading ? (
                <MobileConceptLoadingRows />
              ) : visibleCommunities.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {visibleCommunities.map((community, index) => (
                    <MobileConceptCrewCard
                      key={community.id}
                      community={community}
                      index={index}
                      citySlug={citySlug}
                    />
                  ))}
                </div>
              ) : (
                <MobileConceptEmptyState
                  title="No crews mapped yet"
                  body="Start with a verified source. Instagram, WhatsApp, Discord, or a public calendar all work."
                  actionLabel="Submit a crew"
                  href="/communities/nominate"
                />
              )}

              {featuredSession ? (
                <div className="mt-5">
                  <p className="border-b-2 border-[#17130E] pb-1 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#E8412C]">
                    Who is out
                  </p>
                  <MobileConceptPlanFeature
                    session={featuredSession}
                    source="mobile_concept_crews_feature"
                    onJoin={onJoin}
                    onLeave={onLeave}
                    onPreviewAttendees={onPreviewAttendees}
                    rsvpLoading={rsvpLoadingId === featuredSession.id}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'plans' ? (
            <div className="py-4">
              <div className="border-b-[6px] border-[#17130E] pb-4">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#E8412C]">
                  Week of {todayDateString.slice(5).replace('-', ' / ')}
                </p>
                <h1 className="mt-1 max-w-[330px] font-sans text-[34px] font-black uppercase leading-[0.96] tracking-normal">
                  You&apos;re free.
                  <span className="block text-[#0B4BA8]">Here&apos;s who&apos;s out.</span>
                </h1>
              </div>

              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {dateOptions.map((option) => {
                  const active = dateFilter ? dateFilter === option.date : option.date === todayDateString
                  return (
                    <button
                      key={option.date}
                      type="button"
                      onClick={() => onDateChange(option.date)}
                      className={`grid min-h-[54px] min-w-[44px] place-items-center border-2 font-mono shadow-[2px_2px_0_#17130E] ${
                        active
                          ? 'border-[#17130E] bg-[#17130E] text-white'
                          : 'border-[#17130E] bg-[#F8F4EA] text-[#17130E]'
                      }`}
                    >
                      <span className="text-[8px] font-black uppercase">{option.label}</span>
                      <span className="text-lg font-black leading-none">{option.day}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 border-t-2 border-[#17130E]">
                <p className="py-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#E8412C]">
                  {activeDateLabel} - {visiblePlans.length} sessions
                </p>
                {searching ? (
                  <MobileConceptLoadingRows />
                ) : visiblePlans.length > 0 ? (
                  <div className="divide-y-2 divide-[#17130E] border-y-2 border-[#17130E]">
                    {visiblePlans.map((session) => (
                      <MobileConceptPlanRow key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <MobileConceptEmptyState
                    title="No one is out then"
                    body="Try another window or post the kind of plan you wish existed."
                    actionLabel="Post a plan"
                    onClick={onHostSession}
                  />
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'you' ? (
            <div className="py-4">
              <div className="border-b-[6px] border-[#17130E] pb-4">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#E8412C]">
                  Your windows
                </p>
                <h1 className="mt-1 font-sans text-[34px] font-black uppercase leading-[0.96] tracking-normal">
                  Make it easier
                  <span className="block text-[#0B4BA8]">to show up.</span>
                </h1>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="border-2 border-[#17130E] bg-[#F8F4EA] p-3 shadow-[3px_3px_0_#17130E]">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#0B4BA8]">
                    Next plan
                  </p>
                  {myPlansLoading ? (
                    <p className="mt-2 text-sm font-black">Checking...</p>
                  ) : myNextSession ? (
                    <>
                      <h2 className="mt-2 font-sans text-xl font-black uppercase leading-tight">
                        {myNextSession.title}
                      </h2>
                      <p className="mt-2 font-serif text-sm italic text-[#17130E]/70">
                        {myNextSession.startTime ? getRelativeTime(myNextSession.startTime) : 'Time TBA'}
                        {myNextSession.address ? ` - ${myNextSession.address.split(',')[0]}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 font-serif text-sm italic text-[#17130E]/70">
                      No saved plan yet. Pick a crew first, then save a spot.
                    </p>
                  )}
                </div>

                <div className="border-2 border-dashed border-[#0B4BA8] bg-[#F8F4EA] p-3">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#E8412C]">
                    Availability v1
                  </p>
                  <p className="mt-2 font-serif text-sm italic leading-5 text-[#17130E]/70">
                    We are using date filters today. Saved free windows can become a real matching
                    layer once the schema is added.
                  </p>
                </div>

                {signedIn ? (
                  <Link
                    href="/my-sessions"
                    className="inline-flex min-h-12 items-center justify-center border-2 border-[#17130E] bg-[#E8412C] font-mono text-[11px] font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#17130E]"
                  >
                    Open my plans
                  </Link>
                ) : (
                  <Link
                    href="/sign-in?redirect_url=%2Fbuddy"
                    className="inline-flex min-h-12 items-center justify-center border-2 border-[#17130E] bg-[#E8412C] font-mono text-[11px] font-black uppercase tracking-wide text-white shadow-[3px_3px_0_#17130E]"
                  >
                    Sign in to save plans
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <MobileConceptBottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </section>
  )
}

function MobileConceptTypeRail({
  activeType,
  onTypeChange,
}: {
  activeType: string
  onTypeChange: (type: string) => void
}) {
  return (
    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
      {TYPE_FILTERS.slice(0, 6).map((filter) => {
        const active = activeType === filter.value
        return (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => onTypeChange(filter.value)}
            className={`min-h-10 shrink-0 border-2 px-3 font-mono text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#17130E] ${
              active
                ? 'border-[#17130E] bg-[#17130E] text-white'
                : 'border-[#17130E] bg-[#F8F4EA] text-[#17130E]'
            }`}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}

function MobileConceptCrewCard({
  community,
  index,
  citySlug,
}: {
  community: DirectoryCommunityPreview
  index: number
  citySlug: string
}) {
  const imageUrl = getCommunityImage(community)
  const joinHref = getCommunityJoinHref(community)
  const rank = String(index + 1).padStart(2, '0')

  return (
    <article className="border-2 border-[#17130E] bg-[#F8F4EA] shadow-[3px_3px_0_#17130E]">
      <Link href={`/communities/${community.slug}`} className="block">
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 p-3">
          <div className="relative h-[86px] overflow-hidden border-2 border-[#17130E] bg-[#0B4BA8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover mix-blend-multiply" />
            <span className="absolute bottom-1 left-1 bg-[#17130E] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase text-white">
              {formatCommunityCategory(community.category)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 font-mono text-[9px] font-black uppercase tracking-[0.18em]">
              <span className="text-[#0B4BA8]"># {rank}</span>
              <span>{community.usualArea || community.city?.name || citySlug}</span>
            </div>
            <h2 className="mt-1 line-clamp-2 font-sans text-xl font-black uppercase leading-tight">
              {community.name}
            </h2>
            <p className="mt-2 line-clamp-2 font-serif text-[13px] italic leading-5 text-[#17130E]/70">
              {community.bestFor || community.usualSchedule || community.description || 'Community-led sessions vary.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {community.beginnerFriendly ? <MobilePaperTag label="First-timers" tone="blue" /> : null}
              {community.soloFriendly ? <MobilePaperTag label="Solo OK" tone="red" /> : null}
              <MobilePaperTag label={formatCommunityPrice(community.priceType)} />
            </div>
          </div>
        </div>
      </Link>
      <div className="grid grid-cols-[minmax(0,1fr)_44px] border-t-2 border-[#17130E]">
        <Link
          href={`/communities/${community.slug}`}
          className="flex min-h-11 items-center justify-center bg-[#E8412C] font-mono text-[10px] font-black uppercase tracking-wide text-white"
        >
          See what happens
        </Link>
        <a
          href={joinHref || `/communities/${community.slug}`}
          target={joinHref ? '_blank' : undefined}
          rel={joinHref ? 'noopener noreferrer' : undefined}
          className="flex min-h-11 items-center justify-center border-l-2 border-[#17130E] bg-[#F8F4EA]"
          aria-label={`Open ${community.name}`}
        >
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  )
}

function MobileConceptPlanFeature({
  session,
  source,
  onJoin,
  onLeave,
  onPreviewAttendees,
  rsvpLoading,
}: {
  session: Session
  source: string
  onJoin: (session: Session, source: string) => void
  onLeave: (session: Session, source: string) => void
  onPreviewAttendees: (session: Session) => void
  rsvpLoading: boolean
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'
  const timeLabel = session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'
  const priceLabel = session.price === 0 ? 'Free' : formatBuddyMapPrice(session.price, session.currency)

  return (
    <article className="mt-3 overflow-hidden border-2 border-[#17130E] bg-[#F8F4EA] shadow-[3px_3px_0_#17130E]">
      <Link href={`/activities/${session.id}`} className="block">
        <div className="relative h-44 border-b-2 border-[#17130E] bg-[#0B4BA8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getSessionListingImage(session)} alt="" className="h-full w-full object-cover opacity-75 mix-blend-multiply" />
          <span className="absolute bottom-0 left-0 bg-[#17130E] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-white">
            {timeLabel}
          </span>
          <span className="absolute right-2 top-2 rotate-[-4deg] border-2 border-[#17130E] bg-[#F8F4EA] px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0_#17130E]">
            {priceLabel}
          </span>
        </div>
        <div className="p-3">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#0B4BA8]">
            {formatCommunityCategory(session.categorySlug || 'fitness')} - {session.city}
          </p>
          <h2 className="mt-1 font-sans text-[24px] font-black uppercase leading-tight">
            {session.title}
          </h2>
          <p className="mt-2 font-serif text-sm italic leading-5 text-[#17130E]/72">
            Hosted by {hostLabel}. {getShowUpConfidence(session).reason}
          </p>
        </div>
      </Link>
      <div className="grid grid-cols-[1fr_44px] border-t-2 border-[#17130E]">
        <button
          type="button"
          disabled={rsvpLoading}
          onClick={() => (isJoined ? onLeave(session, source) : onJoin(session, source))}
          className="min-h-12 bg-[#E8412C] font-mono text-[11px] font-black uppercase tracking-wide text-white disabled:opacity-60"
        >
          {rsvpLoading ? 'Saving...' : isJoined ? "You're in" : 'Save my spot'}
        </button>
        <button
          type="button"
          onClick={() => onPreviewAttendees(session)}
          className="flex min-h-12 items-center justify-center border-l-2 border-[#17130E]"
          aria-label="Preview attendees"
        >
          <Users className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}

function MobileConceptPlanRow({ session }: { session: Session }) {
  const timeLabel = session.startTime
    ? new Date(session.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBA'

  return (
    <Link href={`/activities/${session.id}`} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 bg-[#F8F4EA] py-3">
      <div className="text-center font-mono">
        <p className="text-[20px] font-black leading-none">{timeLabel.replace(/\s?[AP]M$/, '')}</p>
        <p className="mt-0.5 text-[8px] font-black uppercase text-[#17130E]/52">
          {timeLabel.match(/[AP]M$/)?.[0] ?? ''}
        </p>
      </div>
      <div className="min-w-0 pr-2">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#0B4BA8]">
          {formatCommunityCategory(session.categorySlug || 'fitness')} - {session.address?.split(',')[0] || session.city}
        </p>
        <h3 className="mt-1 line-clamp-2 font-sans text-lg font-black uppercase leading-tight">
          {session.title}
        </h3>
        <p className="mt-1 line-clamp-1 font-serif text-[12px] italic text-[#17130E]/66">
          {session.attendeeCount} going
          {(session.goingSoloCount ?? 0) > 0 ? ` - ${session.goingSoloCount} solo` : ''}
        </p>
      </div>
    </Link>
  )
}

function MobileConceptSelectedPlanCard({
  session,
  onClose,
  onJoin,
  onLeave,
  rsvpLoading,
}: {
  session: Session
  onClose: () => void
  onJoin: (session: Session, source: string) => void
  onLeave: (session: Session, source: string) => void
  rsvpLoading: boolean
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'

  return (
    <div className="border-2 border-[#17130E] bg-[#F8F4EA] shadow-[4px_4px_0_#17130E]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center border-2 border-[#17130E] bg-[#F8F4EA]"
        aria-label="Close selected plan"
      >
        <X className="h-4 w-4" />
      </button>
      <Link href={`/activities/${session.id}`} className="block p-3 pr-12">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#0B4BA8]">
          {session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'} - {session.price === 0 ? 'Free' : formatBuddyMapPrice(session.price, session.currency)}
        </p>
        <h2 className="mt-1 line-clamp-2 font-sans text-xl font-black uppercase leading-tight">
          {session.title}
        </h2>
        <p className="mt-2 line-clamp-2 font-serif text-[13px] italic text-[#17130E]/72">
          {getShowUpConfidence(session).reason}
        </p>
      </Link>
      <button
        type="button"
        disabled={rsvpLoading}
        onClick={() => (isJoined ? onLeave(session, 'mobile_concept_map') : onJoin(session, 'mobile_concept_map'))}
        className="min-h-11 w-full border-t-2 border-[#17130E] bg-[#E8412C] font-mono text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-60"
      >
        {rsvpLoading ? 'Saving...' : isJoined ? "You're in" : 'Save my spot'}
      </button>
    </div>
  )
}

function MobilePaperTag({ label, tone }: { label: string; tone?: 'blue' | 'red' }) {
  return (
    <span
      className={`border px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wide ${
        tone === 'blue'
          ? 'border-[#0B4BA8] text-[#0B4BA8]'
          : tone === 'red'
            ? 'border-[#E8412C] text-[#E8412C]'
            : 'border-[#17130E]/45 text-[#17130E]/66'
      }`}
    >
      {label}
    </span>
  )
}

function MobileConceptLoadingRows() {
  return (
    <div className="mt-4 space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-2 border-[#17130E] bg-[#F8F4EA] p-3">
          <div className="h-20 bg-[#17130E]/12" />
          <div className="py-1">
            <div className="h-3 w-20 bg-[#17130E]/12" />
            <div className="mt-3 h-5 w-4/5 bg-[#17130E]/12" />
            <div className="mt-2 h-3 w-3/5 bg-[#17130E]/12" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MobileConceptEmptyState({
  title,
  body,
  actionLabel,
  href,
  onClick,
}: {
  title: string
  body: string
  actionLabel: string
  href?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <h2 className="font-sans text-xl font-black uppercase leading-tight">{title}</h2>
      <p className="mt-2 font-serif text-sm italic leading-5 text-[#17130E]/70">{body}</p>
      <span className="mt-4 inline-flex min-h-11 items-center justify-center bg-[#E8412C] px-4 font-mono text-[10px] font-black uppercase tracking-wide text-white">
        {actionLabel}
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="mt-4 block border-2 border-dashed border-[#17130E] bg-[#F8F4EA] p-4">
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 w-full border-2 border-dashed border-[#17130E] bg-[#F8F4EA] p-4 text-left"
    >
      {content}
    </button>
  )
}

function MobileConceptBottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: MobileBuddyTab
  onTabChange: (tab: MobileBuddyTab) => void
}) {
  const items: Array<{ tab: MobileBuddyTab; label: string; icon: ReactNode }> = [
    { tab: 'crews', label: 'Crews', icon: <Users className="h-3.5 w-3.5" /> },
    { tab: 'plans', label: 'Plans', icon: <List className="h-3.5 w-3.5" /> },
    { tab: 'map', label: 'Map', icon: <Map className="h-3.5 w-3.5" /> },
    { tab: 'you', label: 'You', icon: <UserPlus className="h-3.5 w-3.5" /> },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-2 border-[#17130E] bg-[#F4EFE3] pb-[env(safe-area-inset-bottom)] font-mono">
      {items.map((item) => {
        const active = activeTab === item.tab
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onTabChange(item.tab)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 border-r-2 border-[#17130E] text-[9px] font-black uppercase tracking-wide last:border-r-0 ${
              active ? 'bg-[#17130E] text-white' : 'bg-[#F4EFE3] text-[#17130E]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

function AttendeePreviewSheet({
  session,
  rsvpLoading,
  onClose,
  onJoin,
}: {
  session: Session
  rsvpLoading: boolean
  onClose: () => void
  onJoin: (session: Session, source: string) => void
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const isPaid = session.activityMode === 'P2P_PAID'
  const canQuickRsvp = !isPaid && !session.requiresApproval && !session.isFull
  const visibleAttendees = session.attendees.slice(0, 8)
  const soloCount = session.goingSoloCount ?? 0
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 mx-auto max-w-md rounded-2xl border border-white/[0.10] bg-[#111412]/97 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur md:left-auto md:right-5 md:mx-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#C6E76A]">
            Going to this
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-black leading-tight text-white">
            {session.title}
          </h3>
          <p className="mt-1 truncate text-xs font-semibold text-white/56">
            Hosted by {hostLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/56 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Close attendees"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/[0.10] bg-[#151816] px-3 py-2">
          <p className="text-lg font-black text-white">{session.attendeeCount}</p>
          <p className="font-mono text-[9px] font-black uppercase tracking-wide text-white/56">
            Going
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.10] bg-[#151816] px-3 py-2">
          <p className="text-lg font-black text-[#C6E76A]">{soloCount}</p>
          <p className="font-mono text-[9px] font-black uppercase tracking-wide text-white/56">
            Solo
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.10] bg-[#151816] px-3 py-2">
          <p className="text-lg font-black text-[#C6E76A]">
            {session.maxPeople ? Math.max(session.maxPeople - session.attendeeCount, 0) : 'Open'}
          </p>
          <p className="font-mono text-[9px] font-black uppercase tracking-wide text-white/56">
            Spots
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {visibleAttendees.length > 0 ? (
          visibleAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/[0.10] bg-[#151816] px-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B1F1C] text-xs font-black text-white">
                  {attendee.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attendee.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (attendee.name?.[0]?.toUpperCase() ?? '?')
                  )}
                </span>
                <span className="truncate text-sm font-bold text-white">
                  {attendee.name?.split(' ')[0] ?? 'Someone'}
                </span>
              </div>
              {attendee.goingSolo ? (
                <span className="shrink-0 rounded-full border border-[#C6E76A]/25 bg-[#C6E76A]/10 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-[#C6E76A]">
                  Solo
                </span>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.14] bg-[#151816] px-4 py-5 text-center">
            <p className="text-sm font-bold text-white">No one has joined yet.</p>
            <p className="mt-1 text-xs text-white/56">Be first in.</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {canQuickRsvp && !isJoined ? (
          <button
            type="button"
            disabled={rsvpLoading}
            onClick={() => onJoin(session, 'attendee_preview_sheet')}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-neutral-200 disabled:cursor-wait disabled:bg-[#1B1F1C] disabled:text-white/40"
          >
            {rsvpLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            I&apos;m going
          </button>
        ) : null}
        <Link
          href={`/activities/${session.id}`}
          onClick={() => trackSessionClick(session, 'attendee_preview_sheet', 0)}
          className={`inline-flex min-h-10 items-center justify-center rounded-full border border-white/[0.14] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white/70 transition-colors hover:border-[#C6E76A]/55 hover:text-white ${canQuickRsvp && !isJoined ? '' : 'col-span-2'}`}
        >
          Details
        </Link>
      </div>
    </motion.div>
  )
}

function GoingSoloAfterRsvpPrompt({
  session,
  loading,
  onAnswer,
  onDismiss,
}: {
  session: Session
  loading: boolean
  onAnswer: (goingSolo: boolean) => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md rounded-2xl border border-[#C6E76A]/20 bg-[#101010]/96 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur md:left-auto md:right-5 md:mx-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C6E76A]/12">
          <Users className="h-5 w-5 text-[#C6E76A]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Going solo?</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#999999]">
            Let others know you are open to meeting people at {session.title}.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#C6E76A] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A] disabled:cursor-wait disabled:bg-neutral-300"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              Yes, open
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/[0.10] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white/74 transition-colors hover:border-white/25 hover:text-white disabled:cursor-wait disabled:text-white/35"
            >
              Not today
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Dismiss going solo prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function FollowAfterRsvpPrompt({
  session,
  loading,
  onFollow,
  onDismiss,
}: {
  session: Session
  loading: boolean
  onFollow: () => void
  onDismiss: () => void
}) {
  if (!session.community) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 mx-auto max-w-md rounded-2xl border border-white/[0.12] bg-[#101010]/96 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur md:left-auto md:right-5 md:mx-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#242424]">
          {session.community.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.community.logoImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserPlus className="h-5 w-5 text-[#C6E76A]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-bold text-white">
            Follow {session.community.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#999999]">
            Get updates after {session.title}.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onFollow}
              disabled={loading}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-neutral-200 disabled:cursor-wait disabled:bg-neutral-300"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Follow host
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/[0.10] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white/70 transition-colors hover:border-white/25 hover:text-white"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Dismiss follow prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface FilterOption {
  value: string
  label: string
}

function FilterMenu({
  label,
  displayValue,
  value,
  options,
  onChange,
}: {
  label: string
  displayValue: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  return (
    <details className="group relative min-w-0">
      <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-2 rounded-md border-2 border-white/70 bg-[#0B0D0C] px-3 py-2 font-mono shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:border-[#C6E76A] group-open:border-[#C6E76A] [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/44">
            {label}
          </span>
          <span className="mt-1 block truncate text-[13px] font-black text-white">
            {displayValue}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/56 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[360px] overflow-y-auto rounded-md border border-white/14 bg-[#151816]/94 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              key={`${label}-${option.value || 'all'}`}
              type="button"
              onClick={(event) => {
                onChange(option.value)
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded px-3 text-left text-sm font-bold transition-colors ${
                active
                  ? 'bg-[#C6E76A] text-black'
                  : 'text-white/76 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {active && <Check className="h-4 w-4 shrink-0" />}
            </button>
          )
        })}
      </div>
    </details>
  )
}

function FilterOptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </p>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              key={`${label}-${option.value || 'all'}`}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-11 shrink-0 rounded-md border px-3 font-mono text-[11px] font-black uppercase tracking-wide transition-colors ${
                active
                  ? 'border-[#C6E76A] bg-[#C6E76A] text-black'
                  : 'border-white/[0.10] bg-[#171A18] text-white/66 hover:border-white/24 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuickIntentRail({
  ideas,
  activeType,
  onSelect,
}: {
  ideas: readonly StarterSessionIdea[]
  activeType: string
  onSelect: (idea: StarterSessionIdea) => void
}) {
  return (
    <section className="border-b border-white/[0.08] py-3">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
            I want to...
          </p>
          <p className="mt-1 text-xs font-semibold text-white/48">
            Start from intent, then join or post the missing plan.
          </p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {ideas.map((idea) => {
          const active = activeType === idea.type

          return (
            <button
              key={idea.label}
              type="button"
              onClick={() => onSelect(idea)}
              className={`grid min-h-[86px] w-[168px] shrink-0 content-between rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-[#C6E76A]/45 bg-[#C6E76A]/10'
                  : 'border-white/[0.10] bg-[#121212] hover:border-white/25'
              }`}
            >
              <span>
                <span className="block text-sm font-black text-white">{idea.label}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-4 text-white/48">
                  {idea.note}
                </span>
              </span>
              <span className={`mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full ${
                active ? 'bg-[#C6E76A] text-black' : 'bg-white text-black'
              }`}>
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CityEmptyState({
  cityName,
  citySlug,
  hasFilters,
  onClearFilters,
  onCreate,
  onStarterSelect,
  showMarketSwitch,
  onOpenMap,
}: {
  cityName: string
  citySlug: string
  hasFilters: boolean
  onClearFilters: () => void
  onCreate: () => void
  onStarterSelect: (type: string) => void
  showMarketSwitch: boolean
  onOpenMap: () => void
}) {
  const otherCity =
    citySlug === 'bangkok'
      ? { name: 'Singapore', href: '/buddy?view=list&city=singapore' }
      : { name: 'Bangkok', href: '/buddy?view=list&city=bangkok' }
  const cityImage = getCityFallbackImage(citySlug || cityName)

  return (
    <div className="grid gap-4 py-5 sm:py-6">
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151816] sm:grid sm:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[190px] bg-[#222222] sm:min-h-full">
          <Image
            src={cityImage}
            alt={`${cityName} fitness discovery`}
            fill
            sizes="(min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151816] via-black/10 to-transparent sm:bg-gradient-to-r" />
        </div>
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
            No solo-friendly plans yet
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
            Help map an easy plan to show up to.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#999999]">
            SweatBuddies should make the first step obvious: what is happening, where to go, and how
            to join. Suggest a community/source for review, post a specific session if you run one, or
            clear filters if this search is too narrow.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/communities/nominate"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black uppercase tracking-wide text-black hover:bg-neutral-200"
            >
              Suggest a community
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onCreate}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-[#1B1F1C] px-4 text-xs font-black uppercase tracking-wide text-white hover:border-[#C6E76A] hover:text-[#C6E76A]"
            >
              <Zap className="h-3.5 w-3.5" />
              Post a session
            </button>
            {hasFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex min-h-11 items-center rounded-full border border-white/[0.12] px-4 text-xs font-black uppercase tracking-wide text-[#999999] hover:border-white/30 hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[#101010] p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#666666]">
              Good first plans
            </p>
            <h3 className="mt-1 text-base font-bold text-white">
              Low-pressure plans people understand
            </h3>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {STARTER_SESSION_IDEAS.map((idea) => (
            <button
              key={idea.label}
              onClick={() => onStarterSelect(idea.type)}
              className="min-h-[74px] rounded-xl border border-white/[0.08] bg-[#1A1E1B] p-3 text-left transition-colors hover:border-[#C6E76A]"
            >
              <p className="text-sm font-bold text-white">{idea.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#777777]">{idea.note}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/communities"
          className="rounded-xl border border-white/[0.08] bg-[#111412] p-4 hover:border-white/18"
        >
          <p className="text-sm font-bold text-white">Browse communities</p>
          <p className="mt-1 text-xs leading-5 text-[#777777]">
            Find communities already listed, even before their next session is live.
          </p>
        </Link>
        {showMarketSwitch ? (
          <Link
            href={otherCity.href}
            className="rounded-xl border border-white/[0.08] bg-[#111412] p-4 hover:border-white/18"
          >
            <p className="text-sm font-bold text-white">Browse {otherCity.name}</p>
            <p className="mt-1 text-xs leading-5 text-[#777777]">
              Switch markets intentionally. Your current city remains {cityName}.
            </p>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpenMap}
            className="rounded-xl border border-white/[0.08] bg-[#111412] p-4 text-left hover:border-white/18"
          >
            <p className="text-sm font-bold text-white">Open community map</p>
            <p className="mt-1 text-xs leading-5 text-[#777777]">
              See active communities and workouts near this city.
            </p>
          </button>
        )}
      </section>
    </div>
  )
}

function MapEmptyOverlay({ cityName, onCreate }: { cityName: string; onCreate: () => void }) {
  return (
    <div className="absolute inset-x-4 top-4 z-20 max-w-sm rounded-2xl border border-white/[0.10] bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
        No solo-friendly pins
      </p>
      <h3 className="mt-2 text-lg font-bold leading-tight text-white">
        Start the first easy plan in {cityName}.
      </h3>
      <p className="mt-2 text-xs leading-5 text-[#999999]">
        The map prioritizes workouts people can confidently join, with reviewed communities as the
        trust layer.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black uppercase tracking-wide text-black hover:bg-neutral-200"
      >
        <Zap className="h-3.5 w-3.5" />
        Post a session
      </button>
    </div>
  )
}

function MapActivityDrawer({
  activeLocationLabel,
  activeDateLabel,
  sessions,
  communities,
  loading,
  communityHref,
  onShowList,
  onCreate,
}: {
  activeLocationLabel: string
  activeDateLabel: string
  sessions: Session[]
  communities: DirectoryCommunityPreview[]
  loading: boolean
  communityHref: string
  onShowList: () => void
  onCreate: () => void
}) {
  const visibleSessions = sessions.slice(0, 3)
  const visibleCommunities = communities.slice(0, visibleSessions.length >= 2 ? 1 : 2)
  const hasRows = visibleSessions.length > 0 || visibleCommunities.length > 0
  const activityCount = communities.length + sessions.length
  const heading = loading
    ? 'Finding activity nearby'
    : communities.length > 0
      ? `${communities.length} communit${communities.length === 1 ? 'y' : 'ies'} nearby`
      : sessions.length > 0
        ? `${sessions.length} plan${sessions.length === 1 ? '' : 's'} today`
        : 'No verified communities yet'

  return (
    <section
      data-testid="buddy-map-activity-drawer"
      className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.6rem)] z-20 rounded-xl border border-white/[0.12] bg-black/78 p-2.5 text-white shadow-[0_14px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl md:left-auto md:right-4 md:w-[390px] md:bg-[#F8F8F4] md:p-4 md:text-black"
    >
      <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-white/20 md:hidden md:bg-black/18" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/48 md:text-black/62">
            Activity map
          </p>
          <h2 className="mt-1 truncate text-base font-black leading-tight text-white md:text-xl md:text-black">
            {heading}
          </h2>
          {!loading && activityCount > 0 ? (
            <p className="mt-0.5 truncate text-xs font-medium text-white/56 md:text-black/68">
              {activeLocationLabel} · {activeDateLabel} · {sessions.length} plan{sessions.length !== 1 ? 's' : ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onShowList}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border-2 border-[#17130E] bg-[#F8F4EA] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-[#17130E] shadow-[2px_2px_0_#17130E] transition-colors hover:bg-white"
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border-2 border-[#17130E] bg-[#E8412C] px-2 font-mono text-[10px] font-black uppercase tracking-wide text-white shadow-[2px_2px_0_#17130E] transition-colors hover:bg-[#F0523E]"
        >
          <Plus className="h-3.5 w-3.5" />
          Post
        </button>
        <Link
          href={communityHref}
          onClick={() =>
            trackBrowserEvent('buddy_map_list_item_clicked', {
              kind: 'communities_link',
              source: 'map_activity_drawer',
              city: activeLocationLabel,
              position: 0,
            })
          }
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/16 bg-white/10 px-2 font-mono text-[10px] font-black uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-white/16 md:border-black/18 md:bg-white/72 md:text-black md:hover:bg-white"
        >
          <Users className="h-3.5 w-3.5" />
          Communities
        </Link>
        <button
          type="button"
          onClick={onShowList}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/16 bg-white/10 px-2 font-mono text-[10px] font-black uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-white/16 md:border-black/18 md:bg-white/72 md:text-black md:hover:bg-white"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Plans
        </button>
      </div>

      <div className="mt-3 hidden max-h-[29dvh] space-y-2 overflow-y-auto pr-1 md:block">
        {loading ? (
          [0, 1, 2].map((item) => (
            <div key={item} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-xl bg-black/[0.04] p-2">
              <div className="h-11 w-11 rounded-full bg-black/10" />
              <div className="py-1">
                <div className="h-3 w-24 rounded bg-black/10" />
                <div className="mt-2 h-3 w-40 rounded bg-black/10" />
              </div>
            </div>
          ))
        ) : hasRows ? (
          <>
            {visibleSessions.map((session, index) => (
              <MapDrawerSessionRow
                key={session.id}
                session={session}
                position={index}
              />
            ))}
            {visibleCommunities.map((community, index) => (
              <MapDrawerCommunityRow
                key={community.id}
                community={community}
                position={visibleSessions.length + index}
              />
            ))}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.03] p-4 text-center">
            <p className="text-sm font-black">Nothing live here yet.</p>
            <p className="mt-1 text-xs leading-5 text-black/50">
              Post the first low-pressure plan or browse known communities nearby.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function MapDrawerSessionRow({
  session,
  position,
}: {
  session: Session
  position: number
}) {
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'
  const priceLabel = session.price === 0 ? 'Free' : formatBuddyMapPrice(session.price, session.currency)
  const timeLabel = session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'

  return (
    <Link
      href={`/activities/${session.id}`}
      onClick={() => {
        trackSessionClick(session, 'map_activity_drawer', position)
        trackBrowserEvent('buddy_map_list_item_clicked', {
          kind: 'session',
          sessionId: session.id,
          source: 'map_activity_drawer',
          position,
          city: session.city,
        })
      }}
      className="grid min-h-[64px] grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-black/[0.04] p-2 transition-colors hover:bg-black/[0.08]"
    >
      <span className="relative h-12 w-12 overflow-hidden rounded-full bg-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getSessionListingImage(session)} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-1 text-sm font-black">{session.title}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-black/50">
          {timeLabel} · {hostLabel}
        </span>
      </span>
      <span className="rounded-full bg-black px-2 py-1 font-mono text-[10px] font-black uppercase text-white">
        {priceLabel}
      </span>
    </Link>
  )
}

function MapDrawerCommunityRow({
  community,
  position,
}: {
  community: DirectoryCommunityPreview
  position: number
}) {
  const imageUrl = community.logoImage || community.coverImage || getCategoryFallbackImage(community.category)
  const cityLabel = community.city?.name ?? community.usualArea ?? 'Local'

  return (
    <Link
      href={`/communities/${community.slug}`}
      onClick={() =>
        trackBrowserEvent('buddy_map_list_item_clicked', {
          kind: 'community',
          communityId: community.id,
          communitySlug: community.slug,
          source: 'map_activity_drawer',
          position,
          city: cityLabel,
        })
      }
      className="grid min-h-[64px] grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-black/[0.04] p-2 transition-colors hover:bg-black/[0.08]"
    >
      <span className="relative h-12 w-12 overflow-hidden rounded-full bg-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-1 text-sm font-black">{community.name}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-black/50">
          {getActivityEmoji(community.category)} {community.usualSchedule || cityLabel}
        </span>
      </span>
      <span className="rounded-full border border-black/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-black/62">
        Community
      </span>
    </Link>
  )
}

function MapQuietTodayBanner({
  sessionCount,
  onViewUpcoming,
}: {
  sessionCount: number
  onViewUpcoming: () => void
}) {
  return (
    <div className="absolute left-3 right-3 top-[13rem] z-20 hidden rounded-2xl border border-white/[0.10] bg-black/70 p-3 shadow-2xl shadow-black/30 backdrop-blur md:left-4 md:right-auto md:block md:w-[320px]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#C6E76A]">
            Communities active
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-white/80">
            {sessionCount} plan{sessionCount !== 1 ? 's' : ''} today. Browse active communities nearby.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewUpcoming}
          className="min-h-11 shrink-0 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-neutral-200"
        >
          <span className="min-[380px]:hidden">Upcoming</span>
          <span className="hidden min-[380px]:inline">View upcoming</span>
        </button>
      </div>
    </div>
  )
}

function MapCommandOverlay({
  activeLocationLabel,
  activeDateLabel,
  sessionCount,
  communityCount,
  communityHref,
  onShowList,
}: {
  activeLocationLabel: string
  activeDateLabel: string
  sessionCount: number
  communityCount: number | null
  communityHref: string
  onShowList: () => void
}) {
  const listedCommunityCount = communityCount ?? 0

  return (
    <div className="absolute left-3 top-3 z-20 hidden w-[min(350px,calc(100%-24px))] rounded-lg border border-white/[0.12] bg-black/68 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#C6E76A]">
            Activity map
          </p>
          <h2 className="mt-1 truncate text-sm font-black text-white">
            {listedCommunityCount > 0
              ? `${listedCommunityCount} communities nearby`
              : 'Community activity nearby'}
          </h2>
          <p className="mt-0.5 truncate text-xs font-semibold text-white/48">
            {activeDateLabel} · {sessionCount} plan{sessionCount !== 1 ? 's' : ''} · source-checked
          </p>
        </div>
        <button
          type="button"
          onClick={onShowList}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-neutral-200"
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <MiniSignal label="Communities" value={listedCommunityCount} active={listedCommunityCount > 0} />
        <MiniSignal label="Plans" value={sessionCount} active={sessionCount > 0} />
      </div>
      <Link
        href={communityHref}
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/12 font-mono text-[10px] font-black uppercase tracking-wide text-white/70 transition-colors hover:border-[#C6E76A] hover:text-[#C6E76A]"
      >
        Browse communities
        <Users className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function SessionCard({
  session,
  isHosting = false,
  index = 0,
  source = 'list',
  rsvpLoading = false,
  onJoin,
  onLeave,
  onPreviewAttendees,
}: {
  session: Session
  isHosting?: boolean
  index?: number
  source?: string
  rsvpLoading?: boolean
  onJoin?: (session: Session, source: string) => void
  onLeave?: (session: Session, source: string) => void
  onPreviewAttendees?: (session: Session) => void
}) {
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const isPaid = session.activityMode === 'P2P_PAID'
  const priceDisplay = isPaid ? `$${(session.price / 100).toFixed(0)}` : 'Free'
  const canQuickRsvp = !isPaid && !session.requiresApproval
  const showQuickRsvp = !isHosting && (canQuickRsvp || isJoined)
  const rsvpDisabled = rsvpLoading || (session.isFull && !isJoined)
  const rsvpLabel = isJoined ? "You're going" : session.isFull ? 'Full' : "I'm going"

  const displayName = session.title
  const hostLabel = session.community?.name ?? session.host?.name ?? 'Local host'
  const communityLogo = session.community?.logoImage
  const hostAvatar = session.host?.imageUrl
  const hostIsReal =
    session.host?.name &&
    session.host.name !== 'sweatbuddies' &&
    session.host.name !== 'SweatBuddies'
  const avatarSrc = communityLogo || (hostIsReal ? hostAvatar : null)

  const emoji = pinEmoji(session.categorySlug ?? 'other')
  const activityLabel = (session.categorySlug ?? 'fitness').replace(/[-_]/g, ' ')
  const officialJoinUrl = session.officialJoinUrl ?? null
  const officialJoinLabel = getOfficialJoinLabel(session)
  const freshnessLabel = getFreshnessLabel(session)
  const showUpConfidence = getShowUpConfidence(session)
  const confidenceBadges = showUpConfidence.badges.slice(0, 3)
  const confidenceLabel = `${showUpConfidence.level} confidence`
  const soloCount = session.goingSoloCount ?? 0
  const isFirstTimerFriendly = session.fitnessLevel === 'ALL' || soloCount > 0
  const levelLabel = session.fitnessLevel
    ? (LEVEL_FILTERS.find((filter) => filter.value === session.fitnessLevel)?.label ??
      session.fitnessLevel.toLowerCase().replace(/[_-]/g, ' '))
    : null
  const timeLabel = session.startTime
    ? format(new Date(session.startTime), 'EEE, MMM d · h:mm a')
    : 'Time TBA'
  const areaLabel = session.address?.split(',')[0] ?? session.city
  const trustLabel = session.community
    ? 'Verified host page'
    : hostIsReal
      ? 'Host profile'
      : 'Local listing'
  const imageSrc = getSessionListingImage(session)
  const decisionSignals: Array<{
    key: string
    label: string
    tone: 'gold' | 'teal' | 'neutral' | 'hot'
    icon?: 'shield'
  }> = [
    ...confidenceBadges.slice(0, 2).map((badge) => ({
      key: `confidence-${badge}`,
      label: badge,
      tone: 'gold' as const,
    })),
  ]

  if (soloCount > 0) {
    decisionSignals.push({
      key: 'solo',
      label: `${soloCount} solo`,
      tone: 'teal',
    })
  }
  if (isFirstTimerFriendly) {
    decisionSignals.push({
      key: 'first-timers',
      label: 'First-timers',
      tone: 'neutral',
    })
  }
  if (session.community) {
    decisionSignals.push({
      key: 'verified-host',
      label: 'Verified host',
      tone: 'neutral',
      icon: 'shield',
    })
  }
  if (officialJoinUrl) {
    decisionSignals.push({
      key: 'official-link',
      label: 'Official link',
      tone: 'hot',
    })
  }
  if (freshnessLabel) {
    decisionSignals.push({
      key: 'freshness',
      label: freshnessLabel,
      tone: 'neutral',
    })
  }
  if (levelLabel) {
    decisionSignals.push({
      key: 'level',
      label: levelLabel,
      tone: 'gold',
    })
  }
  const visibleDecisionSignals = decisionSignals.slice(0, 3)

  return (
    <motion.div
      id={`session-${session.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <div className="group flex w-[286px] min-h-[420px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/[0.10] bg-[#111412] shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-colors hover:border-[#C6E76A]/35 hover:bg-[#151816] sm:w-auto sm:flex-shrink">
        <Link
          href={`/activities/${session.id}`}
          onClick={() => trackSessionClick(session, source, index)}
          className="relative block aspect-[16/10] overflow-hidden bg-[#151816]"
        >
          <Image
            src={imageSrc}
            alt={displayName}
            fill
            sizes="(min-width: 1024px) 360px, 286px"
            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            unoptimized={imageSrc.startsWith('/api/') || imageSrc.startsWith('http')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C]/90 via-[#0B0D0C]/20 to-black/10" />
          <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
            {activityLabel}
          </span>
          <span className="absolute right-3 top-3 rounded-md bg-[#C6E76A] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-black shadow-md">
            {priceDisplay}
          </span>
          <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur">
            {timeLabel}
          </span>
          {isJoined && !isHosting ? (
            <span className="absolute bottom-3 right-3 rounded-md bg-[#C6E76A] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-black">
              Going
            </span>
          ) : session.imageSourceLabel ? (
            <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-white/80 backdrop-blur">
              {session.imageSourceLabel}
            </span>
          ) : null}
        </Link>

        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#C6E76A]">
                {timeLabel}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold capitalize text-white/56">
                {areaLabel} · {activityLabel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {isJoined && !isHosting ? (
                <span className="rounded-full bg-[#C6E76A] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-black">
                  Going
                </span>
              ) : null}
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-[#1B1F1C] text-xl">
                {emoji}
              </span>
            </div>
          </div>

          <Link
            href={`/activities/${session.id}`}
            onClick={() => trackSessionClick(session, source, index)}
            className="mt-3 block"
          >
            <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-black leading-tight text-white transition-colors group-hover:text-[#C6E76A]">
              {displayName}
            </h3>
          </Link>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.10] bg-[#1B1F1C] text-[11px] font-black text-white">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                (hostLabel[0]?.toUpperCase() ?? 'S')
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-white">Hosted by {hostLabel}</p>
              <p className="truncate text-[10px] font-semibold text-white/50">{trustLabel}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/[0.10] bg-[#151816] px-3 py-2">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <AttendeePreview
                attendees={session.attendees}
                attendeeCount={session.attendeeCount}
                onClick={onPreviewAttendees ? () => onPreviewAttendees(session) : undefined}
              />
              <span className="shrink-0 rounded-full bg-[#C6E76A]/10 px-2 py-1 text-right text-[10px] font-black uppercase tracking-wide text-[#C6E76A]">
                {confidenceLabel}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/56">
              {showUpConfidence.reason}
            </p>
          </div>

          <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
            {visibleDecisionSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {visibleDecisionSignals.map((signal) => (
                  <span
                    key={signal.key}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wide ${
                      signal.tone === 'teal'
                        ? 'border-[#C6E76A]/25 bg-[#C6E76A]/10 text-[#C6E76A]'
                        : signal.tone === 'hot'
                          ? 'border-[#C6E76A]/25 bg-[#C6E76A]/10 text-[#C6E76A]'
                          : signal.tone === 'gold'
                            ? 'border-[#C6E76A]/25 bg-[#C6E76A]/10 text-[#C6E76A]'
                            : 'border-white/[0.10] bg-white/[0.06] text-white/70'
                    }`}
                  >
                    {signal.icon === 'shield' ? <ShieldCheck className="h-3 w-3" /> : null}
                    {signal.label}
                  </span>
                ))}
              </div>
            )}

            <div className="grid min-w-0 grid-cols-2 gap-2">
              {showQuickRsvp ? (
                <button
                  type="button"
                  disabled={rsvpDisabled}
                  onClick={() => {
                    if (isJoined) {
                      onLeave?.(session, source)
                    } else {
                      onJoin?.(session, source)
                    }
                  }}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 font-mono text-[10px] font-black uppercase tracking-wide transition-colors ${
                    isJoined
                      ? 'border border-[#C6E76A]/30 bg-[#C6E76A]/10 text-[#C6E76A] hover:bg-[#C6E76A]/15'
                      : 'bg-white text-black hover:bg-neutral-200'
                  } disabled:cursor-not-allowed disabled:bg-[#1B1F1C] disabled:text-white/40`}
                >
                  {rsvpLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isJoined ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Users className="h-3.5 w-3.5" />
                  )}
                  {rsvpLabel}
                </button>
              ) : officialJoinUrl ? (
                <a
                  href={officialJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOfficialJoinClick(session, source)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#C6E76A] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-[#D8F18A]"
                >
                  {officialJoinLabel}
                </a>
              ) : null}
              <Link
                href={`/activities/${session.id}`}
                onClick={() => trackSessionClick(session, source, index)}
                className={`inline-flex min-h-10 items-center justify-center rounded-full border border-white/[0.14] px-3 font-mono text-[10px] font-black uppercase tracking-wide text-white/70 transition-colors hover:border-[#C6E76A]/55 hover:text-white ${showQuickRsvp || officialJoinUrl ? '' : 'col-span-2'}`}
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AttendeePreview({
  attendees,
  attendeeCount,
  onClick,
}: {
  attendees: Attendee[]
  attendeeCount: number
  onClick?: () => void
}) {
  if (attendeeCount === 0) {
    return (
      <div className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-[#777777]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/[0.16] bg-[#171A18] text-[10px]">
          +
        </span>
        <span className="truncate">Be first in</span>
      </div>
    )
  }

  const content = (
    <>
      <div className="flex -space-x-2">
        {attendees.slice(0, 4).map((attendee) => (
          <span
            key={attendee.id}
            className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[#111412] bg-[#1B1F1C] text-[10px] font-bold text-white"
            title={attendee.name ?? 'Attendee'}
          >
            {attendee.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attendee.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (attendee.name?.[0]?.toUpperCase() ?? '?')
            )}
          </span>
        ))}
      </div>
      <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold text-white/70">
        <Users className="h-3 w-3 shrink-0 text-[#C6E76A]" />
        {attendeeCount} going
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 items-center gap-2 rounded-full pr-1 text-left transition-opacity hover:opacity-85"
      >
        {content}
      </button>
    )
  }

  return <div className="flex min-w-0 items-center gap-2">{content}</div>
}

function MapSelectedSessionCard({
  session,
  onClose,
  source,
  rsvpLoading = false,
  onJoin,
  onLeave,
  onPreviewAttendees,
}: {
  session: Session
  onClose: () => void
  source: string
  rsvpLoading?: boolean
  onJoin?: (session: Session, source: string) => void
  onLeave?: (session: Session, source: string) => void
  onPreviewAttendees?: (session: Session) => void
}) {
  const isPaid = session.activityMode === 'P2P_PAID'
  const priceDisplay = isPaid ? `$${(session.price / 100).toFixed(0)}` : 'Free'
  const displayName = session.community?.name ?? session.host?.name ?? 'Someone'
  const communityLogo = session.community?.logoImage
  const hostAvatar = session.host?.imageUrl
  const hostIsReal =
    session.host?.name &&
    session.host.name !== 'sweatbuddies' &&
    session.host.name !== 'SweatBuddies'
  const avatarSrc = communityLogo || (hostIsReal ? hostAvatar : null)
  const emoji = pinEmoji(session.categorySlug ?? 'other')
  const activityLabel = (session.categorySlug ?? 'fitness').replace(/[-_]/g, ' ')
  const attendeeLabel =
    session.attendeeCount > 0 ? `${session.attendeeCount} going` : 'Be first to join'
  const spotsRemaining =
    typeof session.maxPeople === 'number' && session.maxPeople > 0
      ? Math.max(session.maxPeople - session.attendeeCount, 0)
      : null
  const capacityLabel = session.isFull
    ? 'Full'
    : spotsRemaining !== null
      ? `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`
      : null
  const isJoined = session.userStatus === 'JOINED' || session.userStatus === 'COMPLETED'
  const officialJoinUrl = session.officialJoinUrl ?? null
  const ctaLabel = officialJoinUrl
    ? getOfficialJoinLabel(session)
    : isJoined || session.isFull
      ? 'View details'
      : 'Join'
  const freshnessLabel = getFreshnessLabel(session)
  const canQuickRsvp = !isPaid && !session.requiresApproval
  const showQuickRsvp = canQuickRsvp || isJoined
  const rsvpDisabled = rsvpLoading || (session.isFull && !isJoined)
  const rsvpLabel = isJoined ? "You're going" : session.isFull ? 'Full' : "I'm going"
  const soloCount = session.goingSoloCount ?? 0
  const isFirstTimerFriendly = session.fitnessLevel === 'ALL' || soloCount > 0
  const showUpConfidence = getShowUpConfidence(session)
  const confidenceBadges = showUpConfidence.badges.slice(0, 3)
  const levelLabel = session.fitnessLevel
    ? (LEVEL_FILTERS.find((filter) => filter.value === session.fitnessLevel)?.label ??
      session.fitnessLevel.toLowerCase().replace(/[_-]/g, ' '))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative max-h-[42dvh] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#111412]/96 shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur"
      data-selected-pin-card
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/65 text-white/70 shadow-lg shadow-black/20 transition-colors hover:text-white"
        aria-label="Close selected session"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="grid min-h-[132px] grid-cols-[112px_minmax(0,1fr)] gap-3 p-3 pr-12">
        <Link
          href={`/activities/${session.id}`}
          onClick={() => trackSessionClick(session, source, 0)}
          className="relative min-h-[118px] overflow-hidden rounded-xl bg-[#151816]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getSessionListingImage(session)} alt="" className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-md bg-[#C6E76A] px-2 py-1 font-mono text-[10px] font-black uppercase text-black">
            {priceDisplay}
          </span>
          {session.imageSourceLabel ? (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase text-white/80 backdrop-blur">
              {session.imageSourceLabel}
            </span>
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
            ) : null}
            <span className="truncate text-[11px] capitalize text-white/56">
              {activityLabel} · {session.city}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-black leading-tight text-white">
            {displayName}
          </h3>
          <p className="line-clamp-2 text-xs leading-snug text-white/56">
            {showUpConfidence.reason}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#C6E76A]">
            {session.startTime ? getRelativeTime(session.startTime) : 'Time TBA'}
            {session.address ? ` · ${session.address.split(',')[0]}` : ''}
          </p>
          <AttendeePreview
            attendees={session.attendees}
            attendeeCount={session.attendeeCount}
            onClick={onPreviewAttendees ? () => onPreviewAttendees(session) : undefined}
          />
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <span className="rounded-full border border-[#C6E76A]/25 bg-[#C6E76A]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#C6E76A]">
              {showUpConfidence.level} confidence
            </span>
            {confidenceBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75"
              >
                {badge}
              </span>
            ))}
            {soloCount > 0 ? (
              <span className="rounded-full border border-[#C6E76A]/25 bg-[#C6E76A]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#C6E76A]">
                {soloCount} solo
              </span>
            ) : null}
            {isFirstTimerFriendly ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
                First-timers
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
              {attendeeLabel}
            </span>
            {capacityLabel ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
                {capacityLabel}
              </span>
            ) : null}
            {levelLabel ? (
              <span className="rounded-full border border-[#C6E76A]/25 bg-[#C6E76A]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#C6E76A]">
                {levelLabel}
              </span>
            ) : null}
            {officialJoinUrl ? (
              <span className="rounded-full border border-[#C6E76A]/25 bg-[#C6E76A]/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-[#C6E76A]">
                Official link
              </span>
            ) : null}
            {freshnessLabel ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] font-black uppercase text-white/75">
                {freshnessLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {showQuickRsvp ? (
              <button
                type="button"
                disabled={rsvpDisabled}
                onClick={() => {
                  if (isJoined) {
                    onLeave?.(session, source)
                  } else {
                    onJoin?.(session, source)
                  }
                }}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[10px] font-black uppercase transition-colors ${
                  isJoined
                    ? 'border border-[#C6E76A]/30 bg-[#C6E76A]/10 text-[#C6E76A]'
                    : 'bg-white text-black hover:bg-neutral-200'
                } disabled:cursor-not-allowed disabled:bg-[#222222] disabled:text-[#666666]`}
              >
                {rsvpLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isJoined ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                {rsvpLabel}
              </button>
            ) : null}
            {officialJoinUrl ? (
              <a
                href={officialJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOfficialJoinClick(session, source)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#C6E76A] px-3 font-mono text-[10px] font-black uppercase text-black transition-colors hover:bg-[#D8F18A]"
              >
                {ctaLabel}
                <ArrowRight className="h-3 w-3" />
              </a>
            ) : null}
            <Link
              href={`/activities/${session.id}`}
              onClick={() => trackSessionClick(session, source, 0)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 font-mono text-[10px] font-black uppercase text-black transition-colors hover:bg-neutral-200"
            >
              Details
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function getOfficialJoinLabel(session: Session) {
  const platform = session.officialJoinPlatform?.trim()
  if (platform) return `Join on ${platform}`
  return 'Official link'
}

function getFreshnessLabel(session: Session) {
  if (!session.lastVerifiedAt) return null
  const verifiedAt = new Date(session.lastVerifiedAt)
  if (Number.isNaN(verifiedAt.getTime())) return null
  const daysAgo = Math.floor((Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo <= 30) return 'Verified recently'
  return null
}

function trackSessionClick(session: Session, source: string, position: number) {
  trackBrowserEvent('buddy_session_clicked', {
    sessionId: session.id,
    source,
    category: session.categorySlug ?? 'unknown',
    price: session.price,
    isPaid: session.activityMode === 'P2P_PAID',
    attendeeCount: session.attendeeCount,
    position,
  })
}

function trackOfficialJoinClick(session: Session, source: string) {
  trackBrowserEvent('official_join_clicked', {
    sessionId: session.id,
    communityId: session.community?.id ?? null,
    communitySlug: session.community?.slug ?? null,
    source,
    city: session.city,
    category: session.categorySlug ?? 'unknown',
    platform: session.officialJoinPlatform ?? null,
    hasVerifiedAt: Boolean(session.lastVerifiedAt),
  })
}

function trackBrowserEvent(
  event: string,
  metadata: Record<string, string | number | boolean | null>,
) {
  const body = JSON.stringify({ event, metadata })

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
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
