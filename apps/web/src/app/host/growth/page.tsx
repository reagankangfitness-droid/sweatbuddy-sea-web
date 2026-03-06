'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  Target,
  Zap,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Lightbulb,
} from 'lucide-react'

interface GrowthMetrics {
  totalMembers: number
  activeMembers: number
  newMembersLast30Days: number
  churnedMembersLast30Days: number
  growthRateLast30Days: number
  retentionRate: number
  avgAttendeesPerEvent: number
  totalEvents: number
}

interface Recommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'acquisition' | 'retention' | 'engagement' | 'monetization'
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
}

interface GrowthData {
  metrics: GrowthMetrics
  recommendations: Recommendation[]
  summary: string
  categoryTips: string[]
  communityType: string | null
}

function GrowthSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2" />
          <div className="h-4 bg-neutral-200 rounded w-72 mb-8" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 rounded-xl" />
            ))}
          </div>

          <div className="h-32 bg-neutral-200 rounded-xl mb-6" />

          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  acquisition: <UserPlus className="w-4 h-4" />,
  retention: <Users className="w-4 h-4" />,
  engagement: <Zap className="w-4 h-4" />,
  monetization: <Target className="w-4 h-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  acquisition: 'bg-green-100 text-green-700',
  retention: 'bg-blue-100 text-blue-700',
  engagement: 'bg-purple-100 text-purple-700',
  monetization: 'bg-amber-100 text-amber-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-neutral-100 text-neutral-600',
}

export default function GrowthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [data, setData] = useState<GrowthData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)

    try {
      const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
      if (!sessionRes.ok) {
        router.push('/sign-in?intent=host')
        return
      }

      const res = await fetch('/api/host/growth')
      if (res.ok) {
        const growthData = await res.json()
        setData(growthData)
      } else {
        throw new Error('Failed to load growth data')
      }
    } catch (err) {
      setError('Failed to load growth recommendations. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [router])

  if (isLoading) {
    return <GrowthSkeleton />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <p className="text-neutral-500 mb-4">{error || 'Something went wrong'}</p>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    )
  }

  const { metrics, recommendations, summary, categoryTips, communityType } = data

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              Growth Insights
            </h1>
            <p className="text-sm text-neutral-500">
              AI-powered recommendations to grow your community
            </p>
          </div>
          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Total Members</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {metrics.totalMembers}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Active (30d)</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {metrics.activeMembers}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs">New Members</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              +{metrics.newMembersLast30Days}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-1">
              {metrics.growthRateLast30Days >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-neutral-500">Growth Rate</span>
            </div>
            <p className={`text-2xl font-bold ${
              metrics.growthRateLast30Days >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {metrics.growthRateLast30Days > 0 ? '+' : ''}{metrics.growthRateLast30Days}%
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">AI Summary</h3>
              <p className="text-sm text-neutral-700">{summary}</p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{metrics.retentionRate}%</p>
            <p className="text-xs text-blue-600">Retention Rate</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{metrics.avgAttendeesPerEvent}</p>
            <p className="text-xs text-purple-600">Avg per Event</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{metrics.totalEvents}</p>
            <p className="text-xs text-amber-600">Total Events</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            Growth Recommendations
          </h2>

          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-violet-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[rec.category]}`}>
                        {CATEGORY_ICONS[rec.category]}
                        {rec.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[rec.priority]}`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.effort} effort
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {rec.impact} impact
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Tips */}
        {categoryTips.length > 0 && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {communityType ? `Tips for ${communityType.toLowerCase()} communities` : 'General Tips'}
            </h3>
            <ul className="space-y-2">
              {categoryTips.slice(0, 4).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
