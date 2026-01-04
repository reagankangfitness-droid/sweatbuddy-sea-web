'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, TrendingUp, Calendar, Users, Clock, ArrowLeft } from 'lucide-react'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsData {
  attendeesOverTime: Array<{ month: string; attendees: number }>
  eventsByDay: Array<{ day: string; events: number }>
  eventPerformance: Array<{
    name: string
    fullName: string
    attendees: number
    maxSpots: number | null
    fillRate: number | null
  }>
  insights: {
    totalAttendees: number
    totalEvents: number
    avgAttendeesPerEvent: number
    bestDay: string | null
    bestTime: string | null
  } | null
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        const res = await fetch('/api/host/analytics')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/organizer')
            return
          }
          throw new Error('Failed to load analytics')
        }

        const analyticsData = await res.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
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
          <p className="text-neutral-400">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-red-600">{error}</p>
        </main>
      </div>
    )
  }

  const hasData = data?.insights && data.insights.totalEvents > 0

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/host/dashboard"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
            <p className="text-neutral-500">See how your events are performing</p>
          </div>
        </div>

        {!hasData ? (
          <div className="p-12 bg-neutral-50 rounded-xl text-center">
            <span className="text-5xl mb-4 block">📈</span>
            <p className="font-medium text-neutral-900 mb-2">No data yet</p>
            <p className="text-sm text-neutral-500 mb-4">
              Host some events to see your analytics here!
            </p>
            <Link
              href="/host"
              className="inline-flex px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
            >
              Create an Event
            </Link>
          </div>
        ) : (
          <>
            {/* Key Insights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Total Signups</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">
                  {data.insights?.totalAttendees || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Events Hosted</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">
                  {data.insights?.totalEvents || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Avg per Event</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">
                  {data.insights?.avgAttendeesPerEvent || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Best Day</span>
                </div>
                <p className="text-lg font-bold text-neutral-900">
                  {data.insights?.bestDay?.slice(0, -1) || '—'}
                </p>
              </div>
            </div>

            {/* Best Time Insight */}
            {data.insights?.bestTime && (
              <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">Pro tip:</span> Your events at{' '}
                  <span className="font-bold">{data.insights.bestTime}</span> on{' '}
                  <span className="font-bold">{data.insights.bestDay}</span> get the most signups!
                </p>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Attendees Over Time */}
              <div className="border border-neutral-200 rounded-xl p-6">
                <h2 className="font-semibold text-neutral-900 mb-4">Signups Over Time</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.attendeesOverTime}>
                      <defs>
                        <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="attendees"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#colorAttendees)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Events by Day */}
              <div className="border border-neutral-200 rounded-xl p-6">
                <h2 className="font-semibold text-neutral-900 mb-4">Events by Day</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.eventsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="events" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Events */}
            {data.eventPerformance.length > 0 && (
              <div className="border border-neutral-200 rounded-xl p-6">
                <h2 className="font-semibold text-neutral-900 mb-4">Top Events by Signups</h2>
                <div className="space-y-3">
                  {data.eventPerformance.map((event, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate" title={event.fullName}>
                          {event.fullName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <span>{event.attendees} signups</span>
                          {event.fillRate !== null && (
                            <>
                              <span>•</span>
                              <span className={event.fillRate >= 80 ? 'text-green-600 font-medium' : ''}>
                                {event.fillRate}% filled
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min((event.attendees / (data.eventPerformance[0]?.attendees || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
