import Link from 'next/link'

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
    <Link
      href={`/host/events/${event.id}/attendees`}
      className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-neutral-900">{event.name}</span>
        {event.date && (
          <>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500">{formatDate(event.date)}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showUpBadge && (
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${showUpBadge.color}`}>
            {event.showUpRate}% showed
          </span>
        )}
        <span className="text-sm text-neutral-500">
          {event.goingCount === 0 ? 'No one joined' : event.goingCount === 1 ? '1 person' : `${event.goingCount} people`}
        </span>
      </div>
    </Link>
  )
}
