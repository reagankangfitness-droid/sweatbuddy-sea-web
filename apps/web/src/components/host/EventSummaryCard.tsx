'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, DollarSign, BarChart3, Star, Lightbulb, TrendingUp, RefreshCw, ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface SummaryData {
  id: string
  summary: string
  highlights: string[]
  metrics: {
    attendance: number
    revenue: number
    fillRate: number
    rating: number
    showUpRate: number
    noShows: number
  }
  insights: string[]
  suggestions: string[]
  comparedToAverage: {
    attendanceVsAvg: string
    difference: number
  } | null
  regeneratedCount: number
}

interface EventSummaryCardProps {
  eventId: string
}

export function EventSummaryCard({ eventId }: EventSummaryCardProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/host/events/${eventId}/summary`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/host/events/${eventId}/summary`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate')
    } finally {
      setRegenerating(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-neutral-100 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-100 rounded w-full" />
          <div className="h-4 bg-neutral-100 rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-neutral-600 mb-3">{error}</p>
        <button onClick={fetchSummary} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">
          Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  const metrics = data.metrics

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-neutral-900">AI Event Summary</h3>
          </div>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-amber-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-blue-700">{metrics.attendance}</div>
          <div className="text-xs text-blue-500">Attendees</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">${(metrics.revenue / 100).toFixed(0)}</div>
          <div className="text-xs text-green-500">Revenue</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <BarChart3 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-purple-700">{metrics.fillRate}%</div>
          <div className="text-xs text-purple-500">Fill Rate</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <Star className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-amber-700">{metrics.rating || 'N/A'}</div>
          <div className="text-xs text-amber-500">Rating</div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="px-6 pb-4">
        <p className="text-neutral-700 text-sm leading-relaxed">{data.summary}</p>
      </div>

      {/* Expandable Sections */}
      <div className="border-t">
        {/* Highlights */}
        <button
          onClick={() => toggleSection('highlights')}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-neutral-50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <TrendingUp className="w-4 h-4 text-green-500" /> Highlights
          </span>
          {expandedSection === 'highlights' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        {expandedSection === 'highlights' && (
          <ul className="px-6 pb-4 space-y-2">
            {(data.highlights || []).map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <span className="text-green-500 mt-0.5">+</span> {h}
              </li>
            ))}
          </ul>
        )}

        {/* Insights */}
        <button
          onClick={() => toggleSection('insights')}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-neutral-50 transition-colors border-t"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Insights
          </span>
          {expandedSection === 'insights' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        {expandedSection === 'insights' && (
          <ul className="px-6 pb-4 space-y-2">
            {(data.insights || []).map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <span className="text-amber-500 mt-0.5">*</span> {ins}
              </li>
            ))}
          </ul>
        )}

        {/* Suggestions */}
        <button
          onClick={() => toggleSection('suggestions')}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-neutral-50 transition-colors border-t"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <ArrowRight className="w-4 h-4 text-blue-500" /> Suggestions for Next Time
          </span>
          {expandedSection === 'suggestions' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        {expandedSection === 'suggestions' && (
          <ul className="px-6 pb-4 space-y-2">
            {(data.suggestions || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <span className="text-blue-500 mt-0.5">{i + 1}.</span> {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Plan Next Event CTA */}
      <div className="p-4 border-t bg-gradient-to-r from-amber-50 to-orange-50">
        <Link
          href="/host/plan"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <Sparkles className="w-4 h-4" /> Plan Your Next Event
        </Link>
      </div>
    </div>
  )
}
