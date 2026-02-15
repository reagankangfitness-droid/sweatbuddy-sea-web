import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface Event {
  id: string
  name: string
  date: string | null
  goingCount: number
  showUpRate?: number | null
  attendedCount?: number
}

interface PastEventRowProps {
  event: Event
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function getShowUpBadge(rate: number): { color: string; text: string } {
  if (rate >= 80) return { color: 'bg-green-100 text-green-700', text: 'Great' }
  if (rate >= 60) return { color: 'bg-blue-100 text-blue-700', text: 'Good' }
  if (rate >= 40) return { color: 'bg-amber-100 text-amber-700', text: 'Fair' }
  return { color: 'bg-red-100 text-red-600', text: 'Low' }
}

export function PastEventRow({ event }: PastEventRowProps) {
  const showUpBadge = event.showUpRate !== null && event.showUpRate !== undefined
    ? getShowUpBadge(event.showUpRate)
    : null

  return (
    <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors gap-3">
      <Link
        href={`/host/events/${event.id}/attendees`}
        className="flex items-center gap-2 min-w-0 flex-1"
      >
        <span className="font-medium text-neutral-900 text-sm sm:text-base truncate">{event.name}</span>
        {event.date && (
          <>
            <span className="text-neutral-300 hidden sm:inline">·</span>
            <span className="text-neutral-500 text-xs sm:text-sm hidden sm:inline">{formatDate(event.date)}</span>
          </>
        )}
      </Link>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link
          href={`/host/events/${event.id}/summary`}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Summary</span>
        </Link>
        {showUpBadge && (
          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${showUpBadge.color}`}>
            <span className="hidden sm:inline">{event.showUpRate}% showed</span>
            <span className="sm:hidden">{event.showUpRate}%</span>
          </span>
        )}
        <span className="text-xs sm:text-sm text-neutral-500">
          <span className="hidden sm:inline">
            {event.goingCount === 0 ? 'No one joined' : event.goingCount === 1 ? '1 person' : `${event.goingCount} people`}
          </span>
          <span className="sm:hidden">{event.goingCount}</span>
        </span>
      </div>
    </div>
  )
}
