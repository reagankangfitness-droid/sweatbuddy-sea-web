'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle, Lightbulb, ArrowRight, RefreshCw, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface WeeklyPulseData {
  id: string
  weekStart: string
  weekEnd: string
  summary: string
  highlights: string[]
  insights: string[]
  suggestions: string[]
  metrics: {
    thisWeekRsvps: number
    lastWeekRsvps: number
    totalAttendees: number
    totalEvents: number
    avgAttendeesPerEvent: number
  }
  generatedAt: string
}

interface WeeklyPulseCardProps {
  pulse: WeeklyPulseData
  onRefresh: () => Promise<void>
  isRefreshing?: boolean
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart)
  const end = new Date(weekEnd)

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
}

function getTrendIcon(thisWeek: number, lastWeek: number) {
  if (thisWeek > lastWeek) {
    return <TrendingUp className="w-3 h-3 text-emerald-600" />
  } else if (thisWeek < lastWeek) {
    return <TrendingDown className="w-3 h-3 text-orange-500" />
  }
  return <Minus className="w-3 h-3 text-neutral-400" />
}

export function WeeklyPulseCard({ pulse, onRefresh, isRefreshing = false }: WeeklyPulseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const weekRange = formatWeekRange(pulse.weekStart, pulse.weekEnd)
  const rsvpChange = pulse.metrics.thisWeekRsvps - pulse.metrics.lastWeekRsvps

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl border border-violet-200 dark:border-violet-800 overflow-hidden mb-6 sm:mb-8">
      {/* Header - Always visible */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base">
                Your Weekly Pulse
              </h3>
              <p className="text-xs text-violet-600 dark:text-violet-400">{weekRange}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 disabled:opacity-50 p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
            title="Refresh pulse"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {pulse.summary}
        </p>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            {getTrendIcon(pulse.metrics.thisWeekRsvps, pulse.metrics.lastWeekRsvps)}
            <span className="text-neutral-600 dark:text-neutral-400">
              {pulse.metrics.thisWeekRsvps} RSVPs this week
              {rsvpChange !== 0 && (
                <span className={rsvpChange > 0 ? 'text-emerald-600' : 'text-orange-500'}>
                  {' '}({rsvpChange > 0 ? '+' : ''}{rsvpChange})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 mt-3 font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              See highlights & suggestions
            </>
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-violet-200 dark:border-violet-800 bg-white/50 dark:bg-neutral-900/50 p-4 sm:p-5 space-y-4">
          {/* Highlights */}
          {pulse.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Highlights
              </h4>
              <ul className="space-y-1.5">
                {pulse.highlights.map((highlight, i) => (
                  <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Insights */}
          {pulse.insights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Insights
              </h4>
              <ul className="space-y-1.5">
                {pulse.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {pulse.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                Try This Week
              </h4>
              <ul className="space-y-1.5">
                {pulse.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                    <span className="text-violet-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function WeeklyPulseCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl border border-violet-200 dark:border-violet-800 p-4 sm:p-5 mb-6 sm:mb-8 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-200 dark:bg-violet-800 rounded-lg" />
          <div>
            <div className="h-4 w-32 bg-violet-200 dark:bg-violet-800 rounded mb-1" />
            <div className="h-3 w-20 bg-violet-100 dark:bg-violet-900 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-violet-100 dark:bg-violet-900 rounded w-full" />
        <div className="h-4 bg-violet-100 dark:bg-violet-900 rounded w-4/5" />
      </div>
      <div className="h-3 bg-violet-100 dark:bg-violet-900 rounded w-32 mt-3" />
    </div>
  )
}
