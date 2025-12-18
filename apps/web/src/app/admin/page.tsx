'use client'

import { useState, useEffect } from 'react'
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns'
import {
  Calendar,
  Users,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const ADMIN_SECRET = 'sweatbuddies-admin-2024'

interface Attendee {
  id: string
  eventId: string
  eventName: string
  email: string
  name: string | null
  subscribe: boolean
  timestamp: string
  confirmed: boolean
}

interface NewsletterSubscriber {
  email: string
  name: string | null
  subscribedAt: string
  source: string
}

interface Stats {
  totalEvents: number
  pendingEvents: number
  totalAttendees: number
  totalSubscribers: number
  attendeesThisWeek: number
  subscribersThisWeek: number
  optInRate: number
}

// Warm dusk color palette for charts
const COLORS = ['#E07A5F', '#2A9D8F', '#F4A261', '#264653', '#A84A36']

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    pendingEvents: 0,
    totalAttendees: 0,
    totalSubscribers: 0,
    attendeesThisWeek: 0,
    subscribersThisWeek: 0,
    optInRate: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [attendeesRes, subscribersRes] = await Promise.all([
        fetch('/api/attendance', { headers: { 'x-admin-secret': ADMIN_SECRET } }),
        fetch('/api/newsletter/subscribers', { headers: { 'x-admin-secret': ADMIN_SECRET } }),
      ])

      const attendeesData = attendeesRes.ok ? await attendeesRes.json() : { attendees: [] }
      const subscribersData = subscribersRes.ok ? await subscribersRes.json() : { subscribers: [] }

      const attendeesList = attendeesData.attendees || []
      const subscribersList = subscribersData.subscribers || []

      setAttendees(attendeesList)
      setSubscribers(subscribersList)

      // Calculate stats
      const weekAgo = startOfDay(subDays(new Date(), 7))
      const attendeesThisWeek = attendeesList.filter(
        (a: Attendee) => new Date(a.timestamp) >= weekAgo
      ).length
      const subscribersThisWeek = subscribersList.filter(
        (s: NewsletterSubscriber) => new Date(s.subscribedAt) >= weekAgo
      ).length
      const uniqueEvents = new Set(attendeesList.map((a: Attendee) => a.eventId)).size
      const optInRate = attendeesList.length > 0
        ? Math.round((attendeesList.filter((a: Attendee) => a.subscribe).length / attendeesList.length) * 100)
        : 0

      setStats({
        totalEvents: uniqueEvents,
        pendingEvents: 0,
        totalAttendees: attendeesList.length,
        totalSubscribers: subscribersList.length,
        attendeesThisWeek,
        subscribersThisWeek,
        optInRate,
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  // Generate chart data for last 7 days
  const generateChartData = () => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    })

    return days.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayAttendees = attendees.filter((a) => {
        const date = new Date(a.timestamp)
        return date >= dayStart && date < dayEnd
      }).length

      const daySubscribers = subscribers.filter((s) => {
        const date = new Date(s.subscribedAt)
        return date >= dayStart && date < dayEnd
      }).length

      return {
        date: format(day, 'EEE'),
        attendees: dayAttendees,
        subscribers: daySubscribers,
      }
    })
  }

  // Generate event distribution data
  const generateEventData = () => {
    const eventCounts: Record<string, number> = {}
    attendees.forEach((a) => {
      eventCounts[a.eventName] = (eventCounts[a.eventName] || 0) + 1
    })

    return Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }))
  }

  // Generate source distribution data
  const generateSourceData = () => {
    const sourceCounts: Record<string, number> = {}
    subscribers.forEach((s) => {
      const source = s.source || 'unknown'
      sourceCounts[source] = (sourceCounts[source] || 0) + 1
    })

    return Object.entries(sourceCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-coral animate-spin" />
      </div>
    )
  }

  const chartData = generateChartData()
  const eventData = generateEventData()
  const sourceData = generateSourceData()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-display-section text-cream">Dashboard</h1>
          <p className="text-body-small text-forest-400 mt-1">Overview of your SweatBuddies platform</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-forest-800 text-cream rounded-xl hover:bg-forest-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-ui">Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Attendees"
          value={stats.totalAttendees}
          change={stats.attendeesThisWeek}
          changeLabel="this week"
          icon={Users}
          iconBg="bg-coral/20"
          iconColor="text-coral"
        />
        <StatCard
          title="Newsletter Subscribers"
          value={stats.totalSubscribers}
          change={stats.subscribersThisWeek}
          changeLabel="this week"
          icon={Mail}
          iconBg="bg-teal/20"
          iconColor="text-teal"
        />
        <StatCard
          title="Events with RSVPs"
          value={stats.totalEvents}
          icon={Calendar}
          iconBg="bg-ocean/20"
          iconColor="text-ocean-light"
        />
        <StatCard
          title="Newsletter Opt-in Rate"
          value={`${stats.optInRate}%`}
          icon={TrendingUp}
          iconBg="bg-amber/20"
          iconColor="text-amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Chart */}
        <div className="bg-forest-900/50 backdrop-blur-lg rounded-2xl border border-forest-800 p-4 sm:p-6">
          <h3 className="font-display text-display-card text-cream mb-4">Activity (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="attendeeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E07A5F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 197, 190, 0.15)" />
                <XAxis dataKey="date" stroke="#8AADA5" fontSize={12} />
                <YAxis stroke="#8AADA5" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B2B27',
                    border: '1px solid #3D5A54',
                    borderRadius: '12px',
                    color: '#FFFDFB',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attendees"
                  stroke="#E07A5F"
                  strokeWidth={2}
                  fill="url(#attendeeGradient)"
                  name="Attendees"
                />
                <Area
                  type="monotone"
                  dataKey="subscribers"
                  stroke="#2A9D8F"
                  strokeWidth={2}
                  fill="url(#subscriberGradient)"
                  name="Subscribers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-coral rounded-full" />
              <span className="text-forest-400 text-body-small">Attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal rounded-full" />
              <span className="text-forest-400 text-body-small">Subscribers</span>
            </div>
          </div>
        </div>

        {/* Event Distribution */}
        <div className="bg-forest-900/50 backdrop-blur-lg rounded-2xl border border-forest-800 p-4 sm:p-6">
          <h3 className="font-display text-display-card text-cream mb-4">Top Events by RSVPs</h3>
          {eventData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 197, 190, 0.15)" />
                  <XAxis type="number" stroke="#8AADA5" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#8AADA5"
                    fontSize={11}
                    width={100}
                    tick={{ fill: '#A8C5BE' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B2B27',
                      border: '1px solid #3D5A54',
                      borderRadius: '12px',
                      color: '#FFFDFB',
                    }}
                  />
                  <Bar dataKey="value" name="RSVPs" radius={[0, 6, 6, 0]}>
                    {eventData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-forest-400">
              No event data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriber Sources */}
        <div className="bg-forest-900/50 backdrop-blur-lg rounded-2xl border border-forest-800 p-4 sm:p-6">
          <h3 className="font-display text-display-card text-cream mb-4">Subscriber Sources</h3>
          {sourceData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B2B27',
                      border: '1px solid #3D5A54',
                      borderRadius: '12px',
                      color: '#FFFDFB',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-forest-400">
              No source data yet
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {sourceData.map((source, index) => (
              <div key={source.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-forest-400 text-body-xs capitalize">{source.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendees */}
        <div className="lg:col-span-2 bg-forest-900/50 backdrop-blur-lg rounded-2xl border border-forest-800 p-4 sm:p-6">
          <h3 className="font-display text-display-card text-cream mb-4">Recent Attendees</h3>
          {attendees.length > 0 ? (
            <div className="space-y-3">
              {attendees.slice(0, 5).map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-3 bg-forest-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(attendee.name || attendee.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-cream text-ui font-medium">
                        {attendee.name || attendee.email}
                      </p>
                      <p className="text-forest-400 text-body-xs">{attendee.eventName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attendee.subscribe && (
                      <span className="text-teal text-body-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Subscribed</span>
                      </span>
                    )}
                    <span className="text-forest-500 text-body-xs">
                      {format(new Date(attendee.timestamp), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-forest-400">
              No attendees yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-forest-900/50 backdrop-blur-lg rounded-2xl border border-forest-800 p-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-teal text-body-xs">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{change}</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-stat-sm text-cream">{value}</p>
        <p className="text-body-xs text-forest-400 mt-1">
          {title}
          {changeLabel && change !== undefined && (
            <span className="text-forest-500"> ({change} {changeLabel})</span>
          )}
        </p>
      </div>
    </div>
  )
}
