'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Activity,
  Calendar,
  TrendingUp,
  Loader2,
  RefreshCw,
  MapPin,
  AlertTriangle,
  ImageIcon,
  ArrowRight,
  CheckCircle2,
  Target,
  ListChecks,
  UserCheck,
  Link2,
  MousePointerClick,
  Eye,
  UserPlus,
  Search,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'

interface TopHost {
  name: string | null
  email: string
  imageUrl: string | null
  sessionsHostedCount: number
  sessionsAttendedCount: number
}

interface DiscoveryMarket {
  slug: string
  name: string
  timezone: string
  localToday: string
  localTomorrow: string
  visibleToday: number
  mappedToday: number
  tomorrowVisible: number
  nextSevenDaysVisible: number
  weeklyCreated: number
  weeklyVisible: number
  freeUpcoming: number
  paidUpcoming: number
  missingImage: number
  likelyFallbackLocation: number
  openSpotSessions: number
  beginnerFriendly: number
  withAttendees: number
  withCommunity: number
  noCommunity: number
  requiresApprovalCount: number
  lowFrictionSessions: number
  activityMix: Array<{ label: string; count: number }>
  topCommunities: Array<{ id: string; name: string; slug: string; count: number }>
  needsFirstAttendee: Array<{
    id: string
    title: string
    startTime: string | null
    categorySlug: string | null
  }>
  readinessScore: number
  readinessStatus: 'HEALTHY' | 'WATCH' | 'NEEDS_SUPPLY'
  quietToday: boolean
}

interface ImpactAction {
  id: string
  market: string
  priority: number
  title: string
  detail: string
  href: string
}

interface ConversionRow {
  visibleSupply: number
  pinClicks: number
  sessionClicks: number
  detailViews: number
  officialJoinClicks?: number
  joins: number
  interest: number
  clickToJoinRate: number
  officialClickRate?: number
}

interface ActivityConversion extends ConversionRow {
  label: string
}

interface CityConversion extends ConversionRow {
  city: string
}

interface DemandGapSession {
  id: string
  title: string
  city: string
  categorySlug: string
  startTime: string | null
  activityMode: string
  price: number
  communityName: string | null
  pinClicks: number
  sessionClicks: number
  detailViews: number
  recentJoins: number
  attendeeCount: number
  interest: number
  conversionRate: number
  reason: string
  href: string
}

interface DiscoveryFunnel {
  windowDays: number
  mapViews: number
  filterUses: number
  searches: number
  pinClicks: number
  sessionClicks: number
  detailViews: number
  officialJoinClicks: number
  successfulJoins: number
  pinToDetailRate: number
  detailToJoinRate: number
  clickToJoinRate: number
  demandGapSessions: DemandGapSession[]
  activityConversion: ActivityConversion[]
  cityConversion: CityConversion[]
}

interface CurationQueueItem {
  id: string
  name: string
  slug: string
  city: string
  category: string
  reason: string
  lastVerifiedAt: string | null
  href: string
  publicHref: string
}

interface CurationQueues {
  staleCutoff: string
  counts: {
    totalLiveCommunities: number
    withOfficialLink: number
    verifiedRecently: number
    officialLinkCoverage: number
    recentVerificationCoverage: number
    missingOfficialLink: number
    needsVerification: number
    missingImage: number
    noUpcomingSessions: number
  }
  missingOfficialLink: CurationQueueItem[]
  needsVerification: CurationQueueItem[]
  missingImage: CurationQueueItem[]
  noUpcomingSessions: CurationQueueItem[]
}

interface P2PStats {
  totalUsers: number
  usersOnboarded: number
  totalP2PSessions: number
  p2pFreeSessions: number
  p2pPaidSessions: number
  marketplaceSessions: number
  upcomingSessions: number
  weeklyP2PSessions: number
  weeklyVisibleP2PSessions: number
  todayMapSessions: number
  visibleTodayAcrossMarkets: number
  mappedTodayAcrossMarkets: number
  nextSevenDayMapSessions: number
  nextSevenDaysAcrossMarkets: number
  liveMapListings: number
  missingImageAcrossMarkets: number
  likelyFallbackLocationAcrossMarkets: number
  quietMarkets: number
  northStarScore: number
  northStarStatus: 'HEALTHY' | 'WATCH' | 'NEEDS_SUPPLY'
  impactActions: ImpactAction[]
  pendingActivityApprovals: number
  pendingCommunityNominations: number
  pendingDiscoverySessions: number
  totalAttendances: number
  avgAttendeesPerSession: number
  discoveryMarkets: DiscoveryMarket[]
  discoveryFunnel: DiscoveryFunnel
  curationQueues: CurationQueues
  topHosts: TopHost[]
}

const RANK_ICONS = ['🥇', '🥈', '🥉', '4', '5']

function formatLocalDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusLabel(status: DiscoveryMarket['readinessStatus'] | P2PStats['northStarStatus']) {
  if (status === 'HEALTHY') return 'Healthy'
  if (status === 'WATCH') return 'Watch'
  return 'Needs supply'
}

function statusClasses(status: DiscoveryMarket['readinessStatus'] | P2PStats['northStarStatus']) {
  if (status === 'HEALTHY') return 'border-lime-700/60 bg-lime-950/25 text-lime-300'
  if (status === 'WATCH') return 'border-amber-700/60 bg-amber-950/30 text-amber-300'
  return 'border-red-900/70 bg-red-950/40 text-red-300'
}

function scoreBarClass(score: number) {
  if (score >= 80) return 'bg-lime-400'
  if (score >= 55) return 'bg-amber-300'
  return 'bg-red-400'
}

function formatSessionTime(date: string | null) {
  if (!date) return 'No time'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'No time'
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function CurationQueueCard({
  title,
  count,
  items,
  empty,
  actioningId,
  primaryActionLabel,
  onPrimaryAction,
  onMarkInactive,
}: {
  title: string
  count: number
  items: CurationQueueItem[]
  empty: string
  actioningId: string | null
  primaryActionLabel?: string
  onPrimaryAction?: (item: CurationQueueItem) => void
  onMarkInactive?: (item: CurationQueueItem) => void
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${count > 0 ? 'border-amber-800/70 text-amber-300' : 'border-neutral-700 text-neutral-500'}`}>
          {count}
        </span>
      </div>
      <div className="divide-y divide-neutral-800">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <div key={`${title}-${item.id}`} className="px-4 py-3">
              <p className="truncate text-sm font-semibold text-neutral-200">{item.name}</p>
              <p className="mt-1 truncate text-xs text-neutral-500">
                {item.city} · {item.category}
              </p>
              <p className="mt-1 text-xs text-amber-300">{item.reason}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {primaryActionLabel && onPrimaryAction && (
                  <button
                    type="button"
                    onClick={() => onPrimaryAction(item)}
                    disabled={Boolean(actioningId)}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-neutral-950 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actioningId === `${item.id}:primary` ? 'Saving...' : primaryActionLabel}
                  </button>
                )}
                {onMarkInactive && (
                  <button
                    type="button"
                    onClick={() => onMarkInactive(item)}
                    disabled={Boolean(actioningId)}
                    className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-400 transition-colors hover:border-red-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actioningId === `${item.id}:inactive` ? 'Saving...' : 'Inactive'}
                  </button>
                )}
                <Link
                  href={item.href}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-100"
                >
                  Edit
                </Link>
                <Link
                  href={item.publicHref}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-100"
                >
                  Public
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="px-4 py-6 text-sm text-neutral-500">{empty}</p>
        )}
      </div>
      {count > items.length && (
        <Link
          href="/admin/communities"
          className="block border-t border-neutral-800 px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500 hover:text-neutral-200"
        >
          View all {count}
        </Link>
      )}
    </div>
  )
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<P2PStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/admin/p2p-stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Stats error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const runCurationAction = useCallback(async (
    item: CurationQueueItem,
    action: string,
    payload: Record<string, unknown>,
    actionKey: 'primary' | 'inactive',
    successMessage: string
  ) => {
    try {
      setError(null)
      setNotice(null)
      setActioningId(`${item.id}:${actionKey}`)
      const res = await fetch(`/api/admin/communities/${item.id}/curation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to update community')
      }
      setNotice(successMessage)
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update community')
    } finally {
      setActioningId(null)
    }
  }, [fetchStats])

  const markVerified = useCallback((item: CurationQueueItem) => {
    void runCurationAction(
      item,
      'mark_verified',
      {},
      'primary',
      `${item.name} is marked verified.`
    )
  }, [runCurationAction])

  const addOfficialLink = useCallback((item: CurationQueueItem) => {
    const url = window.prompt(`Official join/source link for ${item.name}`)
    if (!url) return
    const joinPlatform = window.prompt('Platform label, e.g. Instagram, WhatsApp, Website') ?? ''
    void runCurationAction(
      item,
      'update_official_link',
      { field: 'communityLink', url, joinPlatform },
      'primary',
      `${item.name} now has an official link.`
    )
  }, [runCurationAction])

  const markInactive = useCallback((item: CurationQueueItem) => {
    if (!window.confirm(`Mark ${item.name} inactive and remove it from public discovery?`)) return
    void runCurationAction(
      item,
      'mark_inactive',
      { note: 'Marked inactive from curation queue' },
      'inactive',
      `${item.name} is now inactive.`
    )
  }, [runCurationAction])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  const pendingReviewTotal =
    (stats?.pendingActivityApprovals ?? 0) +
    (stats?.pendingCommunityNominations ?? 0) +
    (stats?.pendingDiscoverySessions ?? 0)
  const discoveryFunnel = stats?.discoveryFunnel
  const curationQueues = stats?.curationQueues
  const qualityQueueTotal =
    (stats?.missingImageAcrossMarkets ?? 0) +
    (stats?.likelyFallbackLocationAcrossMarkets ?? 0) +
    (curationQueues?.counts.missingOfficialLink ?? 0) +
    (curationQueues?.counts.needsVerification ?? 0)
  const northStarScore = stats?.northStarScore ?? 0
  const northStarStatus = stats?.northStarStatus ?? 'NEEDS_SUPPLY'

  const discoveryCards = [
    {
      label: 'Visible Today',
      value: stats?.visibleTodayAcrossMarkets ?? stats?.todayMapSessions ?? 0,
      sub: 'public map, city-local today',
      icon: MapPin,
      color: 'text-lime-400',
      border: 'border-lime-800/50',
    },
    {
      label: 'Mapped Today',
      value: stats?.mappedTodayAcrossMarkets ?? stats?.todayMapSessions ?? 0,
      sub: 'visible pins users can inspect',
      icon: Calendar,
      color: 'text-lime-300',
      border: 'border-lime-800/40',
    },
    {
      label: 'Next 7 Days',
      value: stats?.nextSevenDaysAcrossMarkets ?? stats?.nextSevenDayMapSessions ?? 0,
      sub: 'upcoming visible supply',
      icon: Calendar,
      color: 'text-sky-400',
      border: 'border-sky-800/50',
    },
    {
      label: 'Weekly Visible',
      value: stats?.weeklyVisibleP2PSessions ?? 0,
      sub: `${stats?.weeklyP2PSessions ?? 0} created this week`,
      icon: Activity,
      color: 'text-white',
      border: 'border-neutral-700',
    },
    {
      label: 'Pending Review',
      value: pendingReviewTotal,
      sub: `${stats?.pendingActivityApprovals ?? 0} sessions · ${stats?.pendingCommunityNominations ?? 0} nominations · ${stats?.pendingDiscoverySessions ?? 0} discoveries`,
      icon: AlertTriangle,
      color: pendingReviewTotal > 0 ? 'text-amber-400' : 'text-neutral-400',
      border: pendingReviewTotal > 0 ? 'border-amber-800/60' : 'border-neutral-800',
    },
    {
      label: 'Quality Queue',
      value: qualityQueueTotal,
      sub: `${stats?.missingImageAcrossMarkets ?? 0} session images · ${curationQueues?.counts.missingOfficialLink ?? 0} missing links · ${curationQueues?.counts.needsVerification ?? 0} stale checks`,
      icon: ImageIcon,
      color: qualityQueueTotal > 0 ? 'text-red-300' : 'text-neutral-400',
      border: qualityQueueTotal > 0 ? 'border-red-900/70' : 'border-neutral-800',
    },
  ]

  const legacyCards = [
    {
      label: 'Total Attendances',
      value: stats?.totalAttendances ?? 0,
      icon: Users,
      color: 'text-neutral-300',
      border: 'border-neutral-800',
    },
    {
      label: 'Avg Attendees / Session',
      value: stats?.avgAttendeesPerSession ?? 0,
      icon: TrendingUp,
      color: 'text-neutral-300',
      border: 'border-neutral-800',
    },
    {
      label: 'Live Map Listings',
      value: stats?.liveMapListings ?? 0,
      sub: 'global upcoming live P2P',
      icon: Activity,
      color: 'text-neutral-300',
      border: 'border-neutral-800',
    },
  ]

  const funnelCards = [
    {
      label: 'Map Views',
      value: discoveryFunnel?.mapViews ?? 0,
      sub: `${discoveryFunnel?.filterUses ?? 0} filter uses · ${discoveryFunnel?.searches ?? 0} searches`,
      icon: MapPin,
      color: 'text-lime-300',
    },
    {
      label: 'Pin Clicks',
      value: discoveryFunnel?.pinClicks ?? 0,
      sub: `${discoveryFunnel?.pinToDetailRate ?? 0}% pin-to-detail`,
      icon: MousePointerClick,
      color: 'text-cyan-300',
    },
    {
      label: 'Detail Views',
      value: discoveryFunnel?.detailViews ?? 0,
      sub: `${discoveryFunnel?.detailToJoinRate ?? 0}% detail-to-join`,
      icon: Eye,
      color: 'text-sky-300',
    },
    {
      label: 'Official Clicks',
      value: discoveryFunnel?.officialJoinClicks ?? discoveryFunnel?.successfulJoins ?? 0,
      sub: `${discoveryFunnel?.successfulJoins ?? 0} internal joins · source-link intent`,
      icon: UserPlus,
      color: 'text-lime-300',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100">Discovery Ops</h1>
          <p className="text-neutral-500 mt-1">What users can see on the SweatBuddies map right now</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-6 rounded-xl border border-lime-800/70 bg-lime-950/30 p-4 text-sm text-lime-200">
          {notice}
        </div>
      )}

      {/* North star operating view */}
      <div className="grid gap-4 mb-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-lime-300">
                <Target className="h-4 w-4" />
                North star
              </p>
              <h2 className="mt-3 max-w-xl text-2xl font-bold leading-tight text-neutral-100">
                Users can find a real, joinable fitness plan near them.
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Composite of today supply, tomorrow supply, next-7-day coverage, open spots, beginner-friendly plans, social proof, and listing quality.
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClasses(northStarStatus)}`}>
              {statusLabel(northStarStatus)}
            </span>
          </div>
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <p className="text-6xl font-black text-white">{northStarScore}</p>
              <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Map health score</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full rounded-full ${scoreBarClass(northStarScore)}`}
                style={{ width: `${Math.max(4, Math.min(northStarScore, 100))}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <p className="text-2xl font-bold text-neutral-100">{stats?.visibleTodayAcrossMarkets ?? 0}</p>
                <p className="text-xs text-neutral-500">visible today</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <p className="text-2xl font-bold text-neutral-100">{stats?.nextSevenDaysAcrossMarkets ?? 0}</p>
                <p className="text-xs text-neutral-500">next 7 days</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <p className="text-2xl font-bold text-neutral-100">{stats?.quietMarkets ?? 0}</p>
                <p className="text-xs text-neutral-500">quiet markets</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <div>
              <h2 className="inline-flex items-center gap-2 font-semibold text-neutral-100">
                <ListChecks className="h-4 w-4 text-amber-300" />
                Impact Queue
              </h2>
              <p className="text-sm text-neutral-500">Ranked by what improves the public map fastest.</p>
            </div>
          </div>
          <div className="divide-y divide-neutral-800">
            {(stats?.impactActions ?? []).length > 0 ? (
              stats?.impactActions.map((action, index) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="block px-5 py-4 transition-colors hover:bg-neutral-900/60"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-neutral-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-neutral-100">{action.title}</p>
                        <span className="shrink-0 rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                          {action.market}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-neutral-500">{action.detail}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-neutral-500">
                No urgent operating gaps. Keep refreshing supply and quality checks.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Curation command center */}
      <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-950">
        <div className="flex flex-col gap-2 border-b border-neutral-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-neutral-100">Curation Command Center</h2>
            <p className="text-sm text-neutral-500">
              The one-person operating queue for keeping the map trustworthy and joinable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
              {curationQueues?.counts.officialLinkCoverage ?? 0}% linked
            </span>
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
              {curationQueues?.counts.recentVerificationCoverage ?? 0}% fresh
            </span>
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
              {curationQueues?.counts.totalLiveCommunities ?? 0} live communities
            </span>
          </div>
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-4">
          <CurationQueueCard
            title="Missing official link"
            count={curationQueues?.counts.missingOfficialLink ?? 0}
            items={curationQueues?.missingOfficialLink ?? []}
            empty="Every listed community has a source link."
            actioningId={actioningId}
            primaryActionLabel="Add link"
            onPrimaryAction={addOfficialLink}
            onMarkInactive={markInactive}
          />
          <CurationQueueCard
            title="Needs verification"
            count={curationQueues?.counts.needsVerification ?? 0}
            items={curationQueues?.needsVerification ?? []}
            empty="All communities are freshly checked."
            actioningId={actioningId}
            primaryActionLabel="Verified"
            onPrimaryAction={markVerified}
            onMarkInactive={markInactive}
          />
          <CurationQueueCard
            title="Missing imagery"
            count={curationQueues?.counts.missingImage ?? 0}
            items={curationQueues?.missingImage ?? []}
            empty="All communities have usable visuals."
            actioningId={actioningId}
            primaryActionLabel="Verified"
            onPrimaryAction={markVerified}
          />
          <CurationQueueCard
            title="No upcoming sessions"
            count={curationQueues?.counts.noUpcomingSessions ?? 0}
            items={curationQueues?.noUpcomingSessions ?? []}
            empty="Every community has visible next-7-day supply."
            actioningId={actioningId}
            primaryActionLabel="Verified"
            onPrimaryAction={markVerified}
            onMarkInactive={markInactive}
          />
        </div>
      </section>

      {/* Discovery funnel */}
      <div className="grid gap-4 mb-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
                <Search className="h-4 w-4" />
                Discovery funnel
              </p>
              <h2 className="mt-3 text-xl font-bold text-neutral-100">Where map intent turns into joins</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Last {discoveryFunnel?.windowDays ?? 7} days across public P2P sessions.
              </p>
            </div>
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
              Live demand
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {funnelCards.map((card) => (
              <div key={card.label} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <card.icon className={`mb-3 h-4 w-4 ${card.color}`} />
                <p className="text-2xl font-bold text-neutral-100">{card.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{card.label}</p>
                <p className="mt-1 text-xs text-neutral-600">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">City conversion</p>
            {(discoveryFunnel?.cityConversion ?? []).length > 0 ? (
              discoveryFunnel?.cityConversion.map((row) => (
                <div key={row.city} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-neutral-200">{row.city}</p>
                    <p className="text-sm font-bold text-neutral-100">{row.clickToJoinRate}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-800">
                    <div className="h-full rounded-full bg-lime-300" style={{ width: `${Math.min(row.clickToJoinRate, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    {row.visibleSupply} visible · {row.interest} intent signals · {row.officialJoinClicks ?? 0} official clicks
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-sm text-neutral-500">
                No city-level funnel data yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <div>
              <h2 className="font-semibold text-neutral-100">Demand Gap Queue</h2>
              <p className="text-sm text-neutral-500">Upcoming sessions with interest but weak join-through.</p>
            </div>
            <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs font-bold text-neutral-400">
              {discoveryFunnel?.demandGapSessions.length ?? 0}
            </span>
          </div>
          <div className="divide-y divide-neutral-800">
            {(discoveryFunnel?.demandGapSessions ?? []).length > 0 ? (
              discoveryFunnel?.demandGapSessions.map((session) => (
                <Link
                  key={session.id}
                  href={session.href}
                  className="block px-5 py-4 transition-colors hover:bg-neutral-900/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-100">{session.title}</p>
                        <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                          {session.categorySlug}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">
                        {session.city} · {formatSessionTime(session.startTime)} · {session.communityName ?? 'No community page'}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-amber-300">{session.reason}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-black text-white">{session.interest}</p>
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">signals</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-2 py-2">
                      <p className="text-sm font-bold text-neutral-200">{session.pinClicks}</p>
                      <p className="text-[10px] text-neutral-600">pins</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-2 py-2">
                      <p className="text-sm font-bold text-neutral-200">{session.sessionClicks}</p>
                      <p className="text-[10px] text-neutral-600">cards</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-2 py-2">
                      <p className="text-sm font-bold text-neutral-200">{session.detailViews}</p>
                      <p className="text-[10px] text-neutral-600">views</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-2 py-2">
                      <p className="text-sm font-bold text-neutral-200">{session.recentJoins}</p>
                      <p className="text-[10px] text-neutral-600">joins</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-neutral-500">
                No obvious demand gaps in the last {discoveryFunnel?.windowDays ?? 7} days.
              </div>
            )}
          </div>
        </section>
      </div>

      {(discoveryFunnel?.activityConversion ?? []).length > 0 && (
        <section className="mb-6 rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="font-semibold text-neutral-100">Activity Demand Mix</h2>
            <p className="text-sm text-neutral-500">Which activity categories are getting attention and converting.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Activity</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Supply</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Pin Clicks</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Card Clicks</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Detail Views</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Official Clicks</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Joins</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Official Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {discoveryFunnel?.activityConversion.map((row) => (
                  <tr key={row.label} className="hover:bg-neutral-900/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold capitalize text-neutral-100">{row.label.replace(/[-_]/g, ' ')}</p>
                      <p className="text-xs text-neutral-500">{row.interest} total intent signals</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-300">{row.visibleSupply}</td>
                    <td className="px-5 py-4 text-sm text-neutral-300">{row.pinClicks}</td>
                    <td className="px-5 py-4 text-sm text-neutral-300">{row.sessionClicks}</td>
                    <td className="px-5 py-4 text-sm text-neutral-300">{row.detailViews}</td>
                    <td className="px-5 py-4 text-sm font-bold text-lime-300">{row.officialJoinClicks ?? 0}</td>
                    <td className="px-5 py-4 text-sm font-bold text-neutral-100">{row.joins}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs font-bold text-neutral-300">
                        {row.officialClickRate ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* City drilldown */}
      <div className="grid gap-4 mb-6 xl:grid-cols-2">
        {(stats?.discoveryMarkets ?? []).map((market) => (
          <section key={market.slug} className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-100">{market.name}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClasses(market.readinessStatus)}`}>
                    {statusLabel(market.readinessStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{formatLocalDate(market.localToday)} · {market.timezone}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">{market.readinessScore}</p>
                <p className="text-xs text-neutral-500">health</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                ['Today', market.visibleToday],
                ['Tomorrow', market.tomorrowVisible],
                ['7 days', market.nextSevenDaysVisible],
                ['Open spots', market.openSpotSessions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <p className="text-xl font-bold text-neutral-100">{value}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <UserCheck className="h-3.5 w-3.5 text-lime-300" />
                  Joinability
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  {market.lowFrictionSessions} low-friction · {market.beginnerFriendly} beginner-friendly
                </p>
                <p className="mt-1 text-sm text-neutral-500">{market.withAttendees} with attendees</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                  <Link2 className="h-3.5 w-3.5 text-sky-300" />
                  Communities
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  {market.withCommunity} attached · {market.noCommunity} unattached
                </p>
                <p className="mt-1 text-sm text-neutral-500">{market.topCommunities.length} active crews</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                <p className="text-xs font-semibold text-neutral-300">Quality</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {market.missingImage} missing images · {market.likelyFallbackLocation} fallback locations
                </p>
                <p className="mt-1 text-sm text-neutral-500">{market.requiresApprovalCount} require approval</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Activity Mix</p>
                <div className="flex flex-wrap gap-1.5">
                  {market.activityMix.slice(0, 6).map((activity) => (
                    <span key={activity.label} className="rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300">
                      {activity.label} · {activity.count}
                    </span>
                  ))}
                  {market.activityMix.length === 0 && <span className="text-sm text-neutral-600">No upcoming activity mix.</span>}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Top Communities</p>
                <div className="space-y-1.5">
                  {market.topCommunities.slice(0, 3).map((community) => (
                    <Link
                      key={community.id}
                      href={`/communities/${community.slug}`}
                      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:border-neutral-700"
                    >
                      <span className="truncate text-neutral-300">{community.name}</span>
                      <span className="ml-3 shrink-0 text-xs text-neutral-500">{community.count}</span>
                    </Link>
                  ))}
                  {market.topCommunities.length === 0 && <span className="text-sm text-neutral-600">No community-linked sessions yet.</span>}
                </div>
              </div>
            </div>

            {market.needsFirstAttendee.length > 0 && (
              <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Needs first attendee</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {market.needsFirstAttendee.slice(0, 4).map((session) => (
                    <Link
                      key={session.id}
                      href={`/activities/${session.id}`}
                      className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-500"
                    >
                      {session.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Public-map health */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {discoveryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-neutral-950 rounded-xl border p-5 ${card.border}`}
          >
            <card.icon className={`w-5 h-5 mb-3 ${card.color}`} />
            <p className="text-3xl font-bold text-neutral-100">{card.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{card.label}</p>
            {card.sub && <p className="text-xs text-neutral-600 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Market breakdown */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 mb-6">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-neutral-100">User-Facing Map Supply</h2>
            <p className="text-sm text-neutral-500">City-local today, matching the public map visibility rules.</p>
          </div>
          <Link
            href="/buddy?view=map"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-300 hover:border-neutral-500 hover:text-white"
          >
            Open public map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Market</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Today</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Next 7d</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">This Week</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Mode Mix</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Ops State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {(stats?.discoveryMarkets ?? []).map((market) => {
                const needsQualityReview = market.missingImage > 0 || market.likelyFallbackLocation > 0
                return (
                  <tr key={market.slug} className="hover:bg-neutral-900/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-100">{market.name}</p>
                      <p className="text-xs text-neutral-500">{formatLocalDate(market.localToday)} · {market.timezone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-lg font-bold text-neutral-100">{market.visibleToday}</p>
                      <p className="text-xs text-neutral-500">{market.mappedToday} mapped today</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-lg font-bold text-neutral-100">{market.nextSevenDaysVisible}</p>
                      <p className="text-xs text-neutral-500">visible upcoming</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-neutral-200">{market.weeklyVisible} visible</p>
                      <p className="text-xs text-neutral-500">{market.weeklyCreated} created</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-neutral-300">{market.freeUpcoming} free</p>
                      <p className="text-xs text-neutral-500">{market.paidUpcoming} paid</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {market.quietToday ? (
                          <span className="rounded-full border border-amber-800/70 bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-300">
                            Quiet today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-lime-800/60 bg-lime-950/30 px-2.5 py-1 text-xs font-semibold text-lime-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Healthy
                          </span>
                        )}
                        {needsQualityReview && (
                          <span className="rounded-full border border-red-900/70 bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-300">
                            Quality review
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action queues */}
      <div className="grid gap-4 mb-8 lg:grid-cols-3">
        <Link href="/admin/activities" className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 hover:border-amber-700/70">
          <p className="text-sm font-semibold text-neutral-100">Review submitted sessions</p>
          <p className="mt-1 text-3xl font-bold text-amber-300">{stats?.pendingActivityApprovals ?? 0}</p>
          <p className="mt-2 text-xs text-neutral-500">Approve only events that should appear on the public map.</p>
        </Link>
        <Link href="/admin/nominations" className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 hover:border-amber-700/70">
          <p className="text-sm font-semibold text-neutral-100">Review community nominations</p>
          <p className="mt-1 text-3xl font-bold text-amber-300">{stats?.pendingCommunityNominations ?? 0}</p>
          <p className="mt-2 text-xs text-neutral-500">Add official links and guardrails before communities go live.</p>
        </Link>
        <Link href="/admin/discovery" className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 hover:border-amber-700/70">
          <p className="text-sm font-semibold text-neutral-100">Review discovered sessions</p>
          <p className="mt-1 text-3xl font-bold text-amber-300">{stats?.pendingDiscoverySessions ?? 0}</p>
          <p className="mt-2 text-xs text-neutral-500">Turn crawl/import candidates into clean map listings.</p>
        </Link>
      </div>

      {/* P2P mode breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-neutral-950 rounded-xl border border-emerald-800/50 p-5">
          <p className="text-sm text-neutral-500 mb-1">P2P Free Sessions</p>
          <p className="text-4xl font-bold text-emerald-400">{stats?.p2pFreeSessions ?? 0}</p>
        </div>
        <div className="bg-neutral-950 rounded-xl border border-amber-800/50 p-5">
          <p className="text-sm text-neutral-500 mb-1">P2P Paid Sessions</p>
          <p className="text-4xl font-bold text-amber-400">{stats?.p2pPaidSessions ?? 0}</p>
        </div>
        <div className="bg-neutral-950 rounded-xl border border-neutral-700/50 p-5">
          <p className="text-sm text-neutral-500 mb-1">Marketplace Sessions</p>
          <p className="text-4xl font-bold text-neutral-300">{stats?.marketplaceSessions ?? 0}</p>
        </div>
        <div className="bg-neutral-950 rounded-xl border border-sky-800/50 p-5">
          <p className="text-sm text-neutral-500 mb-1">Avg Attendees (All)</p>
          <p className="text-4xl font-bold text-sky-400">{stats?.avgAttendeesPerSession ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {legacyCards.map((card) => (
          <div
            key={card.label}
            className={`bg-neutral-950 rounded-xl border p-5 ${card.border}`}
          >
            <card.icon className={`w-5 h-5 mb-3 ${card.color}`} />
            <p className="text-3xl font-bold text-neutral-100">{card.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{card.label}</p>
            {card.sub && <p className="text-xs text-neutral-600 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Top hosts leaderboard */}
      {stats?.topHosts && stats.topHosts.length > 0 && (
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 mb-8">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="font-semibold text-neutral-100">Top Hosts (Lifetime)</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Host</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Hosted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Attended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {stats.topHosts.map((host, i) => (
                <tr key={host.email} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-6 py-4 text-xl">{RANK_ICONS[i] ?? i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {host.imageUrl ? (
                        <Image src={host.imageUrl} alt={host.name ?? ''} width={32} height={32} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-neutral-100">{host.name || 'Anonymous'}</p>
                        <p className="text-xs text-neutral-500">{host.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-200">{host.sessionsHostedCount}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">{host.sessionsAttendedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Kill metric */}
      <div className="bg-neutral-950 border border-amber-700/60 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-100 mb-1">Kill Metric</h2>
        <p className="text-neutral-400 text-sm mb-3">
          Goal: <span className="font-bold text-white">100 P2P sessions/week by Day 90</span>
        </p>
        <p className="text-4xl font-bold text-amber-400">
          {stats?.weeklyP2PSessions ?? 0}
        </p>
        <p className="text-sm text-neutral-500 mt-1">P2P sessions created in the last 7 days</p>
        <p className="text-xs text-neutral-600 mt-2">{stats?.nextSevenDaysAcrossMarkets ?? 0} visible in the next 7 days · {stats?.visibleTodayAcrossMarkets ?? 0} today</p>
      </div>
    </div>
  )
}
