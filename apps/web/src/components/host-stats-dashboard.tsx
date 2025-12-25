'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Star,
  Repeat,
  Eye,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HostStatsData {
  stats: {
    totalEvents: number
    eventsThisMonth: number
    eventsThisYear: number
    upcomingEvents: number
    completedEvents: number
    cancelledEvents: number
    totalBookings: number
    bookingsThisMonth: number
    totalUniqueAttendees: number
    uniqueAttendeesThisMonth: number
    averageAttendanceRate: number
    averageAttendeesPerEvent: number
    repeatAttendees: number
    repeatAttendeeRate: number
    totalRevenue: number
    revenueThisMonth: number
    revenueThisYear: number
    averageRevenuePerEvent: number
    totalActivityViews: number
    conversionRate: number
    lastUpdated: string | null
  }
  trends: {
    monthly: Array<{
      year: number
      month: number
      eventsHosted: number
      totalBookings: number
      uniqueAttendees: number
      totalRevenue: number
      averageFillRate: number
    }>
  }
  topActivities: Array<{
    id: string
    title: string
    date: string | null
    fillRate: number
    confirmedBookings: number
    totalRevenue: number
    viewCount: number
  }>
  recentAttendees: Array<{
    id: string
    name: string | null
    imageUrl: string | null
    totalEventsAttended: number
    lastEventDate: string | null
    totalSpent: number
  }>
  topAttendees: Array<{
    id: string
    name: string | null
    imageUrl: string | null
    totalEventsAttended: number
    totalSpent: number
  }>
}

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  subtext?: string
  color: string
}

function StatCard({ icon, value, label, subtext, color }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <span className="[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">{value}</div>
        <div className="text-xs sm:text-sm font-medium text-neutral-600 mt-0.5">{label}</div>
        {subtext && (
          <div className="text-[10px] sm:text-xs text-neutral-400 mt-1 line-clamp-1">{subtext}</div>
        )}
      </div>
    </div>
  )
}

export function HostStatsDashboard() {
  const [data, setData] = useState<HostStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/host/stats')
      if (!res.ok) {
        throw new Error('Failed to fetch stats')
      }
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="text-neutral-500 text-sm sm:text-base">Loading statistics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-red-500 text-sm sm:text-base">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8 sm:py-12 text-neutral-500 text-sm sm:text-base px-4">
        No statistics available yet. Host your first activity!
      </div>
    )
  }

  const { stats, trends, topActivities, recentAttendees, topAttendees } = data

  // Check if user has any hosting activity
  const hasStats = stats.totalEvents > 0 || stats.totalBookings > 0

  if (!hasStats) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-neutral-300" />
        <h3 className="text-base sm:text-lg font-semibold text-neutral-700 mb-2">
          No Statistics Yet
        </h3>
        <p className="text-neutral-500 max-w-md mx-auto text-sm sm:text-base">
          Start hosting activities to see your statistics here. Track your
          events, attendees, and revenue all in one place.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          value={stats.totalEvents}
          label="Total Events"
          subtext={`${stats.upcomingEvents} upcoming • ${stats.completedEvents} completed`}
          color="#6366F1"
        />

        <StatCard
          icon={<Users className="w-6 h-6" />}
          value={stats.totalUniqueAttendees}
          label="Unique Attendees"
          subtext={`${stats.totalBookings} total bookings`}
          color="#10B981"
        />

        <StatCard
          icon={<Repeat className="w-6 h-6" />}
          value={stats.repeatAttendees}
          label="Repeat Attendees"
          subtext={`${stats.repeatAttendeeRate}% return rate`}
          color="#F59E0B"
        />

        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          value={`${stats.averageAttendanceRate}%`}
          label="Fill Rate"
          subtext={`~${stats.averageAttendeesPerEvent.toFixed(1)} per event`}
          color="#EC4899"
        />

        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          value={`SGD ${stats.totalRevenue.toFixed(0)}`}
          label="Total Revenue"
          subtext={`~SGD ${stats.averageRevenuePerEvent.toFixed(0)} per event`}
          color="#8B5CF6"
        />

        <StatCard
          icon={<Eye className="w-6 h-6" />}
          value={stats.totalActivityViews}
          label="Activity Views"
          subtext={`${stats.conversionRate}% conversion rate`}
          color="#14B8A6"
        />
      </div>

      {/* This Month Highlights */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">This Month</h3>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {stats.eventsThisMonth}
            </div>
            <div className="text-[10px] sm:text-sm text-neutral-600">Events</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {stats.bookingsThisMonth}
            </div>
            <div className="text-[10px] sm:text-sm text-neutral-600">Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {stats.uniqueAttendeesThisMonth}
            </div>
            <div className="text-[10px] sm:text-sm text-neutral-600">Attendees</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              <span className="hidden sm:inline">SGD </span>${stats.revenueThisMonth.toFixed(0)}
            </div>
            <div className="text-[10px] sm:text-sm text-neutral-600">Revenue</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Activities */}
        <div className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">
            Top Performing Activities
          </h3>
          {topActivities.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-neutral-400 text-sm">
              No activities yet
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {topActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-neutral-50 rounded-lg sm:rounded-xl"
                >
                  <div className="text-xs sm:text-sm font-semibold text-neutral-400 w-5 sm:w-6">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
                      {activity.title}
                    </div>
                    <div className="text-[10px] sm:text-xs text-neutral-500">
                      {activity.confirmedBookings} bookings •{' '}
                      {activity.fillRate}% filled
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {activity.totalRevenue > 0 && (
                      <div className="text-xs sm:text-sm font-medium text-emerald-600">
                        ${activity.totalRevenue.toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Repeat Attendees */}
        <div className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Your Loyal Crew</h3>
          {topAttendees.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-neutral-400 text-sm">
              No repeat attendees yet
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {topAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
                    {attendee.imageUrl ? (
                      <img
                        src={attendee.imageUrl}
                        alt={attendee.name || 'Attendee'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 text-white font-semibold text-xs sm:text-sm">
                        {attendee.name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
                      {attendee.name || 'Anonymous'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-neutral-500">
                      {attendee.totalEventsAttended} events
                    </div>
                  </div>
                  {attendee.totalSpent > 0 && (
                    <div className="text-xs sm:text-sm font-medium text-emerald-600 flex-shrink-0">
                      ${attendee.totalSpent.toFixed(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {trends.monthly.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold text-neutral-800 mb-3 sm:mb-4 text-sm sm:text-base">Monthly Trend</h3>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40 min-w-[300px]">
              {trends.monthly.map((month, index) => {
                const maxBookings = Math.max(
                  ...trends.monthly.map((m) => m.totalBookings),
                  1
                )
                const height =
                  maxBookings > 0
                    ? (month.totalBookings / maxBookings) * 100
                    : 0

                const monthLabel = new Date(
                  month.year,
                  month.month - 1
                ).toLocaleDateString('en-US', { month: 'short' })

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-[36px] sm:min-w-[40px]"
                  >
                    <div className="text-[10px] sm:text-xs font-semibold text-neutral-700">
                      {month.totalBookings}
                    </div>
                    <div
                      className="w-full max-w-[28px] sm:max-w-[40px] bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-md transition-all"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                      }}
                    />
                    <div className="text-[10px] sm:text-xs text-neutral-500">{monthLabel}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {stats.lastUpdated && (
        <div className="text-center text-[10px] sm:text-xs text-neutral-400 px-4">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}
