'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DollarSign, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import { StatCard } from '@/components/host/StatCard'
import { UpcomingEventRow } from '@/components/host/UpcomingEventRow'
import { PastEventRow } from '@/components/host/PastEventRow'
import { EmptyState } from '@/components/host/EmptyState'

interface DashboardEvent {
  id: string
  name: string
  day: string
  date: string | null
  time: string
  location: string
  imageUrl: string | null
  category: string
  recurring: boolean
  goingCount: number
  organizer: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  slug?: string | null
}

interface TopRegular {
  email: string
  name: string | null
  attendanceCount: number
}

interface RecentActivity {
  id: string
  eventId: string
  eventName: string
  attendeeName: string | null
  attendeeEmail: string
  timestamp: string
  type: 'rsvp' | 'paid'
  amount?: number | null
}

interface AtRiskMember {
  email: string
  name: string | null
  totalAttendance: number
  lastAttendedDate: string
  daysSinceLastAttended: number
  missedEventCount: number
}

interface DashboardData {
  stats: {
    activeEvents: number
    pendingEvents: number
    totalSignups: number
    totalEarnings?: number
    totalRevenue?: number
    paidAttendees?: number
    atRiskCount?: number
  }
  upcoming: DashboardEvent[]
  past: DashboardEvent[]
  pending: DashboardEvent[]
  rejected: DashboardEvent[]
  recentActivity: RecentActivity[]
  topRegulars?: TopRegular[]
  atRiskMembers?: AtRiskMember[]
}

type TabType = 'live' | 'pending' | 'rejected' | 'past'

export default function HostDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('live')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          // Not authenticated or not a host - redirect to sign-in with host intent
          router.push('/sign-in?intent=host')
          return
        }

        const dashboardRes = await fetch('/api/host/dashboard')
        if (!dashboardRes.ok) {
          if (dashboardRes.status === 401) {
            router.push('/sign-in?intent=host')
            return
          }
          throw new Error('Couldn\'t load your dashboard')
        }

        const dashboardData = await dashboardRes.json()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again?')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center animate-pulse">
          <span className="text-4xl mb-4 block">📊</span>
          <p className="text-neutral-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const tabs: { id: TabType; label: string; shortLabel: string; count: number; icon: React.ReactNode }[] = [
    { id: 'live', label: 'Live', shortLabel: 'Live', count: data.upcoming.length, icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending', shortLabel: 'Pending', count: data.pending.length, icon: <Clock className="w-4 h-4" /> },
    { id: 'rejected', label: 'Rejected', shortLabel: 'Rej.', count: data.rejected.length, icon: <XCircle className="w-4 h-4" /> },
    { id: 'past', label: 'Past', shortLabel: 'Past', count: data.past.length, icon: <AlertCircle className="w-4 h-4" /> },
  ]

  const getEventsForTab = () => {
    switch (activeTab) {
      case 'live': return data.upcoming
      case 'pending': return data.pending
      case 'rejected': return data.rejected
      case 'past': return data.past
      default: return data.upcoming
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1d'
    if (diffInDays < 7) return `${diffInDays}d`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Welcome */}
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
          Hey! Here&apos;s how things are going.
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 mb-6 sm:mb-8">
          {data.stats.totalSignups > 0
            ? 'Your events are bringing people together.'
            : 'Ready to bring people together? Create your first event.'}
        </p>

        {/* Earnings Banner - more compact on mobile */}
        {data.stats.totalEarnings && data.stats.totalEarnings > 0 && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-green-900 text-sm sm:text-base">
                  ${(data.stats.totalEarnings / 100).toFixed(2)} earned
                </p>
                <p className="text-xs sm:text-sm text-green-700">
                  From {data.stats.paidAttendees || 0} paid attendee{(data.stats.paidAttendees || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats - 2 cols on very small screens, 3 cols on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-10">
          <StatCard value={data.stats.activeEvents || 0} label="Events Live" />
          <StatCard value={data.stats.totalSignups || 0} label="People Joined" />
          <StatCard
            value={data.stats.totalEarnings ? `$${(data.stats.totalEarnings / 100).toFixed(0)}` : '—'}
            label="Earnings"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Main Content - stack on mobile, grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Events Section */}
          <div className="lg:col-span-2 order-1">
            {/* Tabs - horizontally scrollable on mobile with fade indicator */}
            <div className="relative mb-4 sm:mb-6">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    {tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Fade indicator for mobile scroll */}
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
            </div>

            {/* Events List */}
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {getEventsForTab().length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  {activeTab === 'live' && <EmptyState />}
                  {activeTab === 'pending' && (
                    <div className="text-neutral-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">No pending events</p>
                    </div>
                  )}
                  {activeTab === 'rejected' && (
                    <div className="text-neutral-500">
                      <XCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">No rejected events</p>
                    </div>
                  )}
                  {activeTab === 'past' && (
                    <div className="text-neutral-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">No past events yet</p>
                    </div>
                  )}
                </div>
              ) : (
                getEventsForTab().map((event) => (
                  activeTab === 'past' ? (
                    <PastEventRow key={event.id} event={event} />
                  ) : activeTab === 'pending' ? (
                    <PendingEventRow key={event.id} event={event} />
                  ) : activeTab === 'rejected' ? (
                    <RejectedEventRow key={event.id} event={event} />
                  ) : (
                    <UpcomingEventRow key={event.id} event={event} />
                  )
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Recent Activity & Regulars */}
          <div className="lg:col-span-1 space-y-6 order-2">
            {/* Recent Activity */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span>⚡</span>
                Recent Activity
              </h2>
              {data.recentActivity.length === 0 ? (
                <div className="border border-neutral-200 rounded-xl p-4 sm:p-6 text-center text-neutral-500">
                  <p className="text-sm">No recent signups yet</p>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-neutral-100">
                    {data.recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="p-2.5 sm:p-3 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activity.type === 'paid' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {activity.type === 'paid' ? (
                              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                            ) : (
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-neutral-900 truncate">
                              <span className="font-medium">
                                {activity.attendeeName || activity.attendeeEmail.split('@')[0]}
                              </span>
                              {activity.type === 'paid' ? ' paid' : ' joined'}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{activity.eventName}</p>
                          </div>
                          <span className="text-xs text-neutral-400 whitespace-nowrap">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.recentActivity.length > 6 && (
                    <Link
                      href="/host/community"
                      className="block text-xs text-neutral-600 hover:text-neutral-900 py-2.5 text-center font-medium border-t border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      View all activity →
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Top Regulars */}
            {data.topRegulars && data.topRegulars.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Your Regulars</h2>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-amber-50 border border-purple-100 rounded-xl p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {data.topRegulars.slice(0, 3).map((regular, index) => (
                      <div key={regular.email} className="flex items-center gap-2.5 sm:gap-3 bg-white/80 rounded-lg p-2.5 sm:p-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          {index === 0 ? (
                            <span className="text-base sm:text-lg">💎</span>
                          ) : index === 1 ? (
                            <span className="text-base sm:text-lg">🔥</span>
                          ) : (
                            <span className="text-base sm:text-lg">⭐</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 text-sm truncate">
                            {regular.name || regular.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">{regular.email}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold rounded-full">
                          {regular.attendanceCount}x
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/host/community"
                    className="block text-xs text-purple-600 hover:text-purple-700 mt-3 text-center font-medium"
                  >
                    View all in Community →
                  </Link>
                </div>
              </section>
            )}

            {/* At-Risk Members */}
            {data.atRiskMembers && data.atRiskMembers.length > 0 && (
              <AtRiskSection members={data.atRiskMembers} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Pending event row - compact for mobile
function PendingEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-900 text-sm sm:text-base truncate">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
              Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
            {event.day} · {event.time}
          </p>
          <p className="text-xs text-neutral-400 mt-1 hidden sm:block">
            Submitted for review. We&apos;ll notify you once approved.
          </p>
        </div>
      </div>
    </div>
  )
}

// Rejected event row - compact for mobile
function RejectedEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-900 text-sm sm:text-base truncate">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 flex-shrink-0">
              Rejected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
            {event.day} · {event.time}
          </p>
          {event.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>Reason:</strong> {event.rejectionReason}
              </p>
            </div>
          )}
          <Link
            href="/host"
            className="inline-block mt-2 text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Resubmit →
          </Link>
        </div>
      </div>
    </div>
  )
}

// At-Risk Members Section
function AtRiskSection({ members }: { members: AtRiskMember[] }) {
  const handleReachOut = (member: AtRiskMember) => {
    const name = member.name || member.email.split('@')[0]
    const message = encodeURIComponent(
      `Hey ${name}! 👋\n\nI noticed you haven't been to one of my events in a while (${member.daysSinceLastAttended} days). No pressure at all - just wanted to check in and see how you're doing!\n\nWould love to have you back. Any feedback on the events? Anything I could do better?\n\nHope to see you soon!`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900">At-Risk Regulars</h2>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3 sm:p-4">
        <p className="text-xs text-orange-700 mb-3">
          These regulars haven&apos;t attended in 30+ days. A quick message could bring them back!
        </p>
        <div className="space-y-2 sm:space-y-3">
          {members.slice(0, 3).map((member) => (
            <div key={member.email} className="flex items-center gap-2.5 sm:gap-3 bg-white/80 rounded-lg p-2.5 sm:p-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-lg">⚠️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm truncate">
                  {member.name || member.email.split('@')[0]}
                </p>
                <p className="text-xs text-neutral-500">
                  {member.totalAttendance}x attendee · {member.daysSinceLastAttended}d ago
                </p>
              </div>
              <button
                onClick={() => handleReachOut(member)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors flex-shrink-0"
              >
                Reach Out
              </button>
            </div>
          ))}
        </div>
        {members.length > 3 && (
          <Link
            href="/host/community"
            className="block text-xs text-orange-600 hover:text-orange-700 mt-3 text-center font-medium"
          >
            View all {members.length} at-risk members →
          </Link>
        )}
      </div>
    </section>
  )
}
