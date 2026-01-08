'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
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
  const { getToken } = useAuth()
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
      const token = await getToken()
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      const [attendeesRes, subscribersRes] = await Promise.all([
        fetch('/api/attendance', { headers }),
        fetch('/api/newsletter/subscribers', { headers }),
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
      <div className="flex items-center justify-center min-h-[60vh] bg-neutral-50">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  const chartData = generateChartData()
  const eventData = generateEventData()
  const sourceData = generateSourceData()

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">Overview of your SweatBuddies platform</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-sm font-medium">Refresh</span>
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
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Newsletter Subscribers"
          value={stats.totalSubscribers}
          change={stats.subscribersThisWeek}
          changeLabel="this week"
          icon={Mail}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Events with RSVPs"
          value={stats.totalEvents}
          icon={Calendar}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Newsletter Opt-in Rate"
          value={`${stats.optInRate}%`}
          icon={TrendingUp}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Activity (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="attendeeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#171717',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attendees"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#attendeeGradient)"
                  name="Attendees"
                />
                <Area
                  type="monotone"
                  dataKey="subscribers"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#subscriberGradient)"
                  name="Subscribers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-neutral-600 text-sm">Attendees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-neutral-600 text-sm">Subscribers</span>
            </div>
          </div>
        </div>

        {/* Event Distribution */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Top Events by RSVPs</h3>
          {eventData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#6B7280"
                    fontSize={11}
                    width={100}
                    tick={{ fill: '#525252' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#171717',
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
            <div className="h-64 flex items-center justify-center text-neutral-500">
              No event data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriber Sources */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Subscriber Sources</h3>
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
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#171717',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-neutral-500">
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
                <span className="text-neutral-600 text-xs capitalize">{source.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendees */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-neutral-900 mb-4">Recent Attendees</h3>
          {attendees.length > 0 ? (
            <div className="space-y-3">
              {attendees.slice(0, 5).map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(attendee.name || attendee.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-neutral-900 text-sm font-medium">
                        {attendee.name || attendee.email}
                      </p>
                      <p className="text-neutral-500 text-xs">{attendee.eventName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attendee.subscribe && (
                      <span className="text-emerald-600 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Subscribed</span>
                      </span>
                    )}
                    <span className="text-neutral-400 text-xs">
                      {format(new Date(attendee.timestamp), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-neutral-500">
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
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{change}</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-500 mt-1">
          {title}
          {changeLabel && change !== undefined && (
            <span className="text-neutral-400"> ({change} {changeLabel})</span>
          )}
        </p>
      </div>
    </div>
  )
}
