import Link from 'next/link'

interface Event {
  id: string
  name: string
  date: string | null
  goingCount: number
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

export function PastEventRow({ event }: PastEventRowProps) {
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
      <span className="text-sm text-neutral-500">
        {event.goingCount === 0 ? 'No one joined' : event.goingCount === 1 ? '1 person joined' : `${event.goingCount} people joined`}
      </span>
    </Link>
  )
}
