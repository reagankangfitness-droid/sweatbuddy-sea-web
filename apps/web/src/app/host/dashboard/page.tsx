'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DollarSign, Users, Clock, CheckCircle, AlertCircle, CreditCard, ChevronRight, XCircle, Ban, AlertTriangle, Star, BarChart3, Wallet, Sparkles, TrendingUp, MessageSquare, ArrowRight } from 'lucide-react'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import { StatCard } from '@/components/host/StatCard'
import { UpcomingEventRow } from '@/components/host/UpcomingEventRow'
import { PastEventRow } from '@/components/host/PastEventRow'
import { EmptyState } from '@/components/host/EmptyState'
import { WeeklyPulseCard, WeeklyPulseCardSkeleton, type WeeklyPulseData } from '@/components/host/WeeklyPulseCard'
import { AgentChatWidget } from '@/components/host/AgentChatWidget'
import { DashboardSkeleton } from '@/components/host/DashboardSkeleton'
import { HostOnboarding } from '@/components/host/HostOnboarding'

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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  rejectionReason?: string | null
  slug?: string | null
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

interface TopRegular {
  email: string
  name: string | null
  attendanceCount: number
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
    paidAttendees?: number
    pendingPayments?: number
    atRiskCount?: number
  }
  upcoming: DashboardEvent[]
  past: DashboardEvent[]
  pending: DashboardEvent[]
  rejected: DashboardEvent[]
  cancelled: DashboardEvent[]
  recentActivity: RecentActivity[]
  topRegulars: TopRegular[]
  atRiskMembers: AtRiskMember[]
}

type TabType = 'live' | 'pending' | 'past' | 'rejected' | 'cancelled'

export default function HostDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('live')
  const [pulse, setPulse] = useState<WeeklyPulseData | null>(null)
  const [isPulseLoading, setIsPulseLoading] = useState(true)
  const [isRefreshingPulse, setIsRefreshingPulse] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          // Not authenticated or not a host - redirect to sign-in with host intent
          router.push('/sign-in?intent=host')
          return
        }

        const sessionData = await sessionRes.json()
        setUserName(sessionData.user?.name || null)

        // Check onboarding status
        const onboardingRes = await fetch('/api/host/onboarding')
        if (onboardingRes.ok) {
          const onboardingData = await onboardingRes.json()
          if (!onboardingData.hasCompletedOnboarding) {
            setShowOnboarding(true)
            setIsCheckingOnboarding(false)
            setIsLoading(false)
            return
          }
        }
        setIsCheckingOnboarding(false)

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

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false)
    setIsLoading(true)
    // Reload dashboard data after onboarding
    window.location.reload()
  }, [])

  // Fetch weekly pulse
  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const res = await fetch('/api/host/pulse')
        if (res.ok) {
          const data = await res.json()
          setPulse(data.pulse)
        }
      } catch (err) {
        console.error('Failed to fetch pulse:', err)
      } finally {
        setIsPulseLoading(false)
      }
    }

    if (!isLoading && data) {
      fetchPulse()
    }
  }, [isLoading, data])

  // Refresh pulse handler
  const handleRefreshPulse = useCallback(async () => {
    setIsRefreshingPulse(true)
    try {
      const res = await fetch('/api/host/pulse', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setPulse(data.pulse)
      } else if (res.status === 429) {
        const data = await res.json()
        alert(data.error || 'Please wait before refreshing again.')
      }
    } catch (err) {
      console.error('Failed to refresh pulse:', err)
    } finally {
      setIsRefreshingPulse(false)
    }
  }, [])

  // Show onboarding if not completed
  if (showOnboarding) {
    return <HostOnboarding onComplete={handleOnboardingComplete} userName={userName} />
  }

  if (isLoading || isCheckingOnboarding) {
    return <DashboardSkeleton />
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

  const tabs: { id: TabType; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'live', label: 'Live', count: data.upcoming.length, icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending', count: data.pending.length, icon: <Clock className="w-4 h-4" /> },
    { id: 'past', label: 'Past', count: data.past.length, icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'rejected', label: 'Rejected', count: data.rejected?.length || 0, icon: <XCircle className="w-4 h-4" /> },
    { id: 'cancelled', label: 'Cancelled', count: data.cancelled?.length || 0, icon: <Ban className="w-4 h-4" /> },
  ]

  const getEventsForTab = () => {
    switch (activeTab) {
      case 'live': return data.upcoming
      case 'pending': return data.pending
      case 'past': return data.past
      case 'rejected': return data.rejected || []
      case 'cancelled': return data.cancelled || []
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
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Welcome */}
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-1 sm:mb-2">
          Hey! Here&apos;s how things are going.
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-6 sm:mb-8">
          {data.stats.totalSignups > 0
            ? 'Your events are bringing people together.'
            : 'Ready to bring people together? Create your first event.'}
        </p>

        {/* Weekly Pulse */}
        {isPulseLoading ? (
          <WeeklyPulseCardSkeleton />
        ) : pulse ? (
          <WeeklyPulseCard
            pulse={pulse}
            onRefresh={handleRefreshPulse}
            isRefreshing={isRefreshingPulse}
          />
        ) : null}

        {/* Pending Payments Alert Banner */}
        {data.stats.pendingPayments && data.stats.pendingPayments > 0 && (
          <Link href="/host/payments" className="block mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-amber-50 border border-amber-300 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-900 text-sm sm:text-base">
                      {data.stats.pendingPayments} payment{data.stats.pendingPayments !== 1 ? 's' : ''} need{data.stats.pendingPayments === 1 ? 's' : ''} verification
                    </p>
                    <p className="text-xs sm:text-sm text-amber-700">
                      Review PayNow payments to confirm attendees
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-600 flex-shrink-0" />
              </div>
            </div>
          </Link>
        )}

        {/* Stats - 2 cols on very small screens, 3 cols on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatCard value={data.stats.activeEvents || 0} label="Events Live" />
          <StatCard value={data.stats.totalSignups || 0} label="People Joined" />
          <StatCard
            value={data.stats.totalEarnings ? `$${(data.stats.totalEarnings / 100).toFixed(0)}` : '—'}
            label="Earnings"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* AI Tools Showcase */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
              Your AI Assistant
            </h2>
            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full">
              NEW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* AI Chat Card */}
            <button
              onClick={() => {
                // Find and click the chat widget button
                const chatButton = document.querySelector('[aria-label="Open AI assistant"]') as HTMLButtonElement
                if (chatButton) chatButton.click()
              }}
              className="group p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-left hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-white mb-1">AI Chat</h3>
              <p className="text-xs text-white/80">
                Ask anything about your community, get instant answers
              </p>
            </button>

            {/* Content Generator Card */}
            <Link
              href="/host/content"
              className="group p-4 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl text-left hover:from-violet-600 hover:to-pink-600 transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-white mb-1">Content Generator</h3>
              <p className="text-xs text-white/80">
                Create Instagram captions, WhatsApp messages & more
              </p>
            </Link>

            {/* Growth Insights Card */}
            <Link
              href="/host/growth"
              className="group p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-left hover:from-emerald-600 hover:to-teal-600 transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-white mb-1">Growth Insights</h3>
              <p className="text-xs text-white/80">
                AI-powered recommendations to grow your community
              </p>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2 mb-6 sm:mb-10 overflow-x-auto pb-1">
          <Link
            href="/host/community"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            Community
          </Link>
          <Link
            href="/host/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link
            href="/host/earnings"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap"
          >
            <Wallet className="w-4 h-4" />
            Earnings
          </Link>
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
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        activeTab === tab.id ? 'bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-900' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
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
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {getEventsForTab().length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  {activeTab === 'live' && <EmptyState />}
                  {activeTab === 'pending' && (
                    <div className="text-neutral-500 dark:text-neutral-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-sm">No pending events</p>
                    </div>
                  )}
                  {activeTab === 'past' && (
                    <div className="text-neutral-500 dark:text-neutral-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-sm">No past events yet</p>
                    </div>
                  )}
                  {activeTab === 'rejected' && (
                    <div className="text-neutral-500 dark:text-neutral-400">
                      <XCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-sm">No rejected events</p>
                    </div>
                  )}
                  {activeTab === 'cancelled' && (
                    <div className="text-neutral-500 dark:text-neutral-400">
                      <Ban className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-sm">No cancelled events</p>
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
                  ) : activeTab === 'cancelled' ? (
                    <CancelledEventRow key={event.id} event={event} />
                  ) : (
                    <UpcomingEventRow key={event.id} event={event} onCancelled={() => window.location.reload()} />
                  )
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Recent Activity, Top Regulars, At-Risk */}
          <div className="lg:col-span-1 space-y-6 order-2">
            {/* Recent Activity */}
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span>⚡</span>
                Recent Activity
              </h2>
              {data.recentActivity.length === 0 ? (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 text-center text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900">
                  <p className="text-sm">No recent signups yet</p>
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="p-2.5 sm:p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activity.type === 'paid' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            {activity.type === 'paid' ? (
                              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                              <span className="font-medium">
                                {activity.attendeeName || activity.attendeeEmail.split('@')[0]}
                              </span>
                              {activity.type === 'paid' ? ' paid' : ' joined'}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{activity.eventName}</p>
                          </div>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.recentActivity.length > 6 && (
                    <Link
                      href="/host/community"
                      className="block text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white py-2.5 text-center font-medium border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
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
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Top Regulars
                </h2>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.topRegulars.slice(0, 5).map((regular, index) => (
                      <div key={regular.email} className="p-2.5 sm:p-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {regular.name || regular.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {regular.attendanceCount} events attended
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* At-Risk Members */}
            {data.atRiskMembers && data.atRiskMembers.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  At-Risk Members
                </h2>
                <div className="border border-orange-200 dark:border-orange-900/50 rounded-xl overflow-hidden bg-orange-50 dark:bg-orange-900/20">
                  <div className="divide-y divide-orange-100 dark:divide-orange-900/30">
                    {data.atRiskMembers.slice(0, 3).map((member) => (
                      <div key={member.email} className="p-2.5 sm:p-3">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {member.name || member.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-400">
                              {member.daysSinceLastAttended} days since last event · Missed {member.missedEventCount} events
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border-t border-orange-200 dark:border-orange-900/50">
                    <p className="text-xs text-orange-800 dark:text-orange-300">
                      These regulars haven&apos;t attended recently. Consider reaching out!
                    </p>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      {/* AI Chat Widget */}
      <AgentChatWidget />
    </div>
  )
}

// Pending event row - compact for mobile
function PendingEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
              Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1">
            {event.day} · {event.time}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 hidden sm:block">
            Submitted for review. We&apos;ll notify you once approved.
          </p>
        </div>
      </div>
    </div>
  )
}

// Rejected event row
function RejectedEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex-shrink-0">
              Rejected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1">
            {event.day} · {event.time}
          </p>
          {event.rejectionReason && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Reason: {event.rejectionReason}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Cancelled event row
function CancelledEventRow({ event }: { event: DashboardEvent }) {
  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
          <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 dark:text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-neutral-500 dark:text-neutral-400 text-sm sm:text-base truncate line-through">{event.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 flex-shrink-0">
              Cancelled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 mt-0.5 sm:mt-1">
            {event.day} · {event.time}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            {event.goingCount} attendee{event.goingCount !== 1 ? 's were' : ' was'} registered
          </p>
        </div>
      </div>
    </div>
  )
}

