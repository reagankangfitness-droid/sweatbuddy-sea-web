'use client'

import Link from 'next/link'
import { X, Calendar, Sparkles, AlertTriangle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NudgeData {
  id: string
  title: string
  content: string
  link: string | null
  metadata?: Record<string, unknown>
  createdAt: string
}

const NUDGE_STYLES: Record<
  string,
  { gradient: string; iconBg: string; icon: React.ReactNode }
> = {
  EVENT_RECOMMENDATION: {
    gradient: 'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    icon: <Calendar className="w-4 h-4" />,
  },
  INACTIVITY_REENGAGEMENT: {
    gradient: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    icon: <Sparkles className="w-4 h-4" />,
  },
  LOW_FILL_RATE: {
    gradient: 'from-rose-500/10 to-rose-600/5 border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  REGULARS_NOT_SIGNED_UP: {
    gradient: 'from-violet-500/10 to-violet-600/5 border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    icon: <Users className="w-4 h-4" />,
  },
}

const DEFAULT_STYLE = NUDGE_STYLES.EVENT_RECOMMENDATION

export function NudgeCard({
  nudge,
  onDismiss,
}: {
  nudge: NudgeData
  onDismiss: (id: string) => void
}) {
  const nudgeType = (nudge.metadata?.nudgeType as string) || ''
  const style = NUDGE_STYLES[nudgeType] || DEFAULT_STYLE

  const cardContent = (
    <div
      className={cn(
        'relative p-4 rounded-xl border bg-gradient-to-r transition-colors',
        style.gradient,
        nudge.link && 'hover:shadow-md cursor-pointer'
      )}
    >
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDismiss(nudge.id)
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            style.iconBg
          )}
        >
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">
            {nudge.title}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
            {nudge.content}
          </p>
        </div>
      </div>
    </div>
  )

  if (nudge.link) {
    return (
      <Link href={nudge.link} onClick={() => onDismiss(nudge.id)}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
