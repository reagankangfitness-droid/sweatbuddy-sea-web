'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Target,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
} from 'lucide-react'

interface Summary {
  totalEvents: number
  totalRSVPs: number
  totalAttended: number
  avgShowUpRate: number
  totalRevenue: number
  uniqueAttendees: number
}

interface MonthlyTrend {
  month: string
  rsvps: number
  attended: number
  showUpRate: number
  revenue: number
}

interface DayDistribution {
  day: string
  rsvps: number
  attended: number
}

interface TimeDistribution {
  hour: string
  rsvps: number
}

interface RetentionData {
  month: string
  newMembers: number
  returningMembers: number
}

interface TopEvent {
  id: string
  name: string
  date: string | null
  rsvps: number
  attended: number
  showUpRate: number
  revenue: number
}

interface Insights {
  bestDay: string | null
  bestTime: string | null
  growthRate: number
  avgAttendeesPerEvent: number
}

interface UpcomingEventPrediction {
  id: string
  name: string
  date: string | null
  day: string | null
  time: string | null
  currentRSVPs: number
  predictedShowUpRate: number
  predictedAttendance: number
}

interface RevenueForecast {
  month: string
  predictedRevenue: number
  confidence: 'high' | 'medium' | 'low'
}

interface Recommendation {
  type: 'success' | 'warning' | 'info'
  title: string
  description: string
}

interface AnalyticsData {
  summary: Summary
  monthlyTrends: MonthlyTrend[]
  dayDistribution: DayDistribution[]
  timeDistribution: TimeDistribution[]
  retentionData: RetentionData[]
  topEvents: TopEvent[]
  insights: Insights | null
  upcomingEventPredictions: UpcomingEventPrediction[]
  revenueForecast: RevenueForecast[]
  recommendations: Recommendation[]
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
          router.push('/sign-in?intent=host')
          return
        }

        const res = await fetch('/api/host/analytics')
        if (!res.ok) throw new Error('Failed to load analytics')

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
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-500">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <DashboardHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-red-600">{error}</p>
        </main>
      </div>
    )
  }

  if (!data) return null

  const hasData = data.summary.totalRSVPs > 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Track your event performance and community growth
          </p>
        </div>

        {!hasData ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              No data yet
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Once people start RSVPing to your events, you&apos;ll see detailed analytics here.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              <StatCard
                icon={<Calendar className="w-5 h-5" />}
                value={data.summary.totalEvents}
                label="Total Events"
                color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={data.summary.totalRSVPs}
                label="Total RSVPs"
                color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                value={`${data.summary.avgShowUpRate}%`}
                label="Show-up Rate"
                color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                value={`$${data.summary.totalRevenue.toFixed(0)}`}
                label="Total Revenue"
                color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={data.summary.uniqueAttendees}
                label="Unique People"
                color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
              />
              <StatCard
                icon={data.insights && data.insights.growthRate >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                value={`${data.insights?.growthRate || 0}%`}
                label="Growth (3mo)"
                color={data.insights && data.insights.growthRate >= 0
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }
              />
            </div>

            {/* Insights Banner */}
            {data.insights && (data.insights.bestDay || data.insights.bestTime) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Insights</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      Your events perform best on <span className="font-semibold">{data.insights.bestDay || 'weekends'}</span>
                      {data.insights.bestTime && (
                        <> at <span className="font-semibold">{data.insights.bestTime}</span></>
                      )}.
                      {data.insights.avgAttendeesPerEvent > 0 && (
                        <> You average <span className="font-semibold">{data.insights.avgAttendeesPerEvent}</span> attendees per event.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {data.recommendations && data.recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {data.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      rec.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : rec.type === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        rec.type === 'success'
                          ? 'bg-green-100 dark:bg-green-800'
                          : rec.type === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-800'
                          : 'bg-blue-100 dark:bg-blue-800'
                      }`}>
                        {rec.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
                        {rec.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                        {rec.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{rec.title}</h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Predictions Section */}
            {(data.upcomingEventPredictions?.length > 0 || data.revenueForecast?.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Predictions</h2>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">AI Powered</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming Events Predictions */}
                  {data.upcomingEventPredictions && data.upcomingEventPredictions.length > 0 && (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">Upcoming Events Forecast</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Predicted attendance based on historical data</p>
                      </div>
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {data.upcomingEventPredictions.map((event) => (
                          <div key={event.id} className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-neutral-900 dark:text-white truncate">{event.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {event.date && new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {event.time && ` • ${event.time}`}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                  {event.predictedAttendance} <span className="text-xs font-normal text-neutral-500">/ {event.currentRSVPs} RSVPs</span>
                                </p>
                                <p className={`text-xs ${
                                  event.predictedShowUpRate >= 80 ? 'text-green-600 dark:text-green-400' :
                                  event.predictedShowUpRate >= 60 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {event.predictedShowUpRate}% predicted show-up
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue Forecast */}
                  {data.revenueForecast && data.revenueForecast.length > 0 && data.summary.totalRevenue > 0 && (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">Revenue Forecast</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Projected earnings next 3 months</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-end justify-between gap-4">
                          {data.revenueForecast.map((forecast, idx) => (
                            <div key={forecast.month} className="flex-1 text-center">
                              <div className="relative h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden mb-2">
                                <div
                                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-amber-400 rounded-lg transition-all"
                                  style={{
                                    height: `${Math.min(100, (forecast.predictedRevenue / Math.max(...data.revenueForecast.map(f => f.predictedRevenue), 1)) * 100)}%`
                                  }}
                                />
                              </div>
                              <p className="text-lg font-bold text-neutral-900 dark:text-white">${forecast.predictedRevenue.toFixed(0)}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{forecast.month}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                forecast.confidence === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                forecast.confidence === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                              }`}>
                                {forecast.confidence}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Attendance Trends */}
              <ChartCard title="Attendance Trends" subtitle="RSVPs vs Actual Attendance (12 months)">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="rsvps"
                      name="RSVPs"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="attended"
                      name="Attended"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Show-up Rate Over Time */}
              <ChartCard title="Show-up Rate" subtitle="Percentage who actually attended">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`${value}%`, 'Show-up Rate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="showUpRate"
                      name="Show-up Rate"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Day Distribution */}
              <ChartCard title="Best Days" subtitle="RSVPs by day of week">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.dayDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="rsvps" name="RSVPs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attended" name="Attended" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Member Retention */}
              <ChartCard title="Member Retention" subtitle="New vs returning members">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.retentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="newMembers" name="New" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="returningMembers" name="Returning" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Revenue Chart (if has revenue) */}
            {data.summary.totalRevenue > 0 && (
              <div className="mb-8">
                <ChartCard title="Revenue Trends" subtitle="Monthly earnings from paid events">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* Top Events Table */}
            {data.topEvents.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Top Performing Events</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Ranked by number of RSVPs</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          RSVPs
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
                          Attended
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Show-up
                        </th>
                        {data.summary.totalRevenue > 0 && (
                          <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
                            Revenue
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {data.topEvents.map((event, index) => (
                        <tr key={event.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                                  {event.name}
                                </p>
                                {event.date && (
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">
                            {event.rsvps}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">
                            {event.attended}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              event.showUpRate >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              event.showUpRate >= 60 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {event.showUpRate}%
                            </span>
                          </td>
                          {data.summary.totalRevenue > 0 && (
                            <td className="px-4 sm:px-6 py-4 text-right text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">
                              {event.revenue > 0 ? `$${event.revenue.toFixed(0)}` : '—'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
