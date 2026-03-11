'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Activity, Calendar, TrendingUp, Loader2, RefreshCw } from 'lucide-react'

interface TopHost {
  name: string | null
  email: string
  imageUrl: string | null
  sessionsHostedCount: number
  sessionsAttendedCount: number
}

interface P2PStats {
  totalUsers: number
  usersOnboarded: number
  totalP2PSessions: number
  p2pFreeSessions: number
  p2pPaidSessions: number
  marketplaceSessions: number
  upcomingSessions: number
  totalAttendances: number
  avgAttendeesPerSession: number
  topHosts: TopHost[]
}

const RANK_ICONS = ['🥇', '🥈', '🥉', '4', '5']

export default function AdminStatsPage() {
  const [stats, setStats] = useState<P2PStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/p2p-stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Stats error:', err)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-blue-400',
      border: 'border-blue-800/50',
    },
    {
      label: 'Onboarded',
      value: stats?.usersOnboarded ?? 0,
      sub: stats && stats.totalUsers > 0
        ? `${Math.round((stats.usersOnboarded / stats.totalUsers) * 100)}% of users`
        : undefined,
      icon: TrendingUp,
      color: 'text-emerald-400',
      border: 'border-emerald-800/50',
    },
    {
      label: 'Total P2P Sessions',
      value: stats?.totalP2PSessions ?? 0,
      icon: Activity,
      color: 'text-purple-400',
      border: 'border-purple-800/50',
    },
    {
      label: 'Upcoming Sessions',
      value: stats?.upcomingSessions ?? 0,
      icon: Calendar,
      color: 'text-amber-400',
      border: 'border-amber-800/50',
    },
    {
      label: 'Total Attendances',
      value: stats?.totalAttendances ?? 0,
      icon: Users,
      color: 'text-pink-400',
      border: 'border-pink-800/50',
    },
    {
      label: 'Avg Attendees / Session',
      value: stats?.avgAttendeesPerSession ?? 0,
      icon: TrendingUp,
      color: 'text-sky-400',
      border: 'border-sky-800/50',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100">P2P Dashboard</h1>
          <p className="text-neutral-500 mt-1">SweatBuddies platform metrics</p>
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

      {/* Main stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((card) => (
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
          <p className="text-sm text-neutral-500 mb-1">Avg Attendees (P2P)</p>
          <p className="text-4xl font-bold text-sky-400">{stats?.avgAttendeesPerSession ?? 0}</p>
        </div>
      </div>

      {/* Top hosts leaderboard */}
      {stats?.topHosts && stats.topHosts.length > 0 && (
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 mb-8">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="font-semibold text-neutral-100">Top Hosts</h2>
          </div>
          <table className="w-full">
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
                        <img src={host.imageUrl} alt={host.name ?? ''} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
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
      )}

      {/* Kill metric */}
      <div className="bg-neutral-950 border border-amber-700/60 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-100 mb-1">Kill Metric</h2>
        <p className="text-neutral-400 text-sm mb-3">
          Goal: <span className="font-bold text-white">100 P2P sessions/week by Day 90</span>
        </p>
        <p className="text-4xl font-bold text-amber-400">
          {(stats?.p2pFreeSessions ?? 0) + (stats?.p2pPaidSessions ?? 0)}
        </p>
        <p className="text-sm text-neutral-500 mt-1">total P2P sessions created</p>
        <p className="text-xs text-neutral-600 mt-2">{stats?.upcomingSessions ?? 0} upcoming · weekly rate tracking TBD</p>
      </div>
    </div>
  )
}
