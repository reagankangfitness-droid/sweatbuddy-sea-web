'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, DollarSign, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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

interface DashboardData {
  stats: {
    activeEvents: number
    pendingEvents: number
    totalSignups: number
    totalEarnings?: number
    totalRevenue?: number
    paidAttendees?: number
  }
  upcoming: DashboardEvent[]
  past: DashboardEvent[]
  pending: DashboardEvent[]
  rejected: DashboardEvent[]
  recentActivity: RecentActivity[]
  topRegulars?: TopRegular[]
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
        // First verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        // Fetch dashboard data
        const dashboardRes = await fetch('/api/host/dashboard')
        if (!dashboardRes.ok) {
          if (dashboardRes.status === 401) {
            router.push('/organizer')
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
      <div className="min-h-screen flex items-center justify-center bg-white">
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

  const tabs: { id: TabType; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'live', label: 'Live', count: data.upcoming.length, icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending', count: data.pending.length, icon: <Clock className="w-4 h-4" /> },
    { id: 'rejected', label: 'Rejected', count: data.rejected.length, icon: <XCircle className="w-4 h-4" /> },
    { id: 'past', label: 'Past', count: data.past.length, icon: <AlertCircle className="w-4 h-4" /> },
  ]

  const getEventsForTab = () => {
    switch (activeTab) {
      case 'live':
        return data.upcoming
      case 'pending':
        return data.pending
      case 'rejected':
        return data.rejected
      case 'past':
        return data.past
      default:
        return data.upcoming
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome */}
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Hey! Here&apos;s how things are going.
        </h1>
        {data.stats.totalSignups > 0 ? (
          <p className="text-neutral-500 mb-8">Your events are bringing people together.</p>
        ) : (
          <p className="text-neutral-500 mb-8">Ready to bring people together? Create your first event.</p>
        )}

        {/* Earnings Banner */}
        {data.stats.totalEarnings && data.stats.totalEarnings > 0 && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">
                  ${(data.stats.totalEarnings / 100).toFixed(2)} earned
                </p>
                <p className="text-sm text-green-700">
                  From {data.stats.paidAttendees || 0} paid attendee{(data.stats.paidAttendees || 0) !== 1 ? 's' : ''} via PayNow
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <StatCard value={data.stats.activeEvents || 'None yet'} label="Events Live" />
          <StatCard value={data.stats.totalSignups || 'Post your first event!'} label="People Joined" />
          <StatCard
            value={data.stats.totalEarnings ? `$${(data.stats.totalEarnings / 100).toFixed(0)}` : '—'}
            label="Earnings"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-neutral-100 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
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

            {/* Events List */}
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {getEventsForTab().length === 0 ? (
                <div className="p-8 text-center">
                  {activeTab === 'live' && <EmptyState />}
                  {activeTab === 'pending' && (
                    <div className="text-neutral-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p>No pending events</p>
                    </div>
                  )}
                  {activeTab === 'rejected' && (
                    <div className="text-neutral-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                      <p>No rejected events - nice!</p>
                    </div>
                  )}
                  {activeTab === 'past' && (
                    <div className="text-neutral-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p>No past events yet</p>
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

          {/* Sidebar - Recent Activity */}
          <div className="lg:col-span-1 space-y-8">
            {/* Recent Activity */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Recent Activity
              </h2>
              {data.recentActivity.length === 0 ? (
                <div className="border border-neutral-200 rounded-xl p-6 text-center text-neutral-500">
                  <p>No recent signups yet</p>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                  {data.recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="p-3 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'paid' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {activity.type === 'paid' ? (
                            <DollarSign className="w-4 h-4 text-green-600" />
                          ) : (
                            <Users className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-900 truncate">
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
              )}
            </section>

            {/* Top Regulars */}
            {data.topRegulars && data.topRegulars.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Your Regulars</h2>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-amber-50 border border-purple-100 rounded-xl p-4">
                  <div className="grid gap-3">
                    {data.topRegulars.map((regular, index) => (
                      <div key={regular.email} className="flex items-center gap-3 bg-white/80 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          {index === 0 ? (
                            <span className="text-lg">💎</span>
                          ) : index === 1 ? (
                            <span className="text-lg">🔥</span>
                          ) : (
                            <span className="text-lg">⭐</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {regular.name || regular.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-neutral-500 truncate">{regular.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                            {regular.attendanceCount}x
                          </span>
                        </div>
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
          </div>
        </div>
      </main>
    </div>
  )
}

// Component for pending events
function PendingEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 truncate">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              Pending Review
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            {event.day} · {event.time}
          </p>
          <p className="text-sm text-neutral-400 truncate">{event.location}</p>
          <p className="text-xs text-neutral-400 mt-2">
            Submitted for review. We&apos;ll notify you once approved.
          </p>
        </div>
      </div>
    </div>
  )
}

// Component for rejected events
function RejectedEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 truncate">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
              Rejected
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
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
            href="/#submit-desktop"
            className="inline-block mt-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Resubmit Event →
          </Link>
        </div>
      </div>
    </div>
  )
}
