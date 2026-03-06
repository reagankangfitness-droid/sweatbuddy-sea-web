import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EventCard, type UpcomingEvent } from './EventCard'
import { ScrollAnimator } from './ScrollAnimator'

interface HappeningSectionProps {
  events: UpcomingEvent[]
}

export function HappeningSection({ events }: HappeningSectionProps) {
  if (events.length < 3) return null

  return (
    <section className="py-20 sm:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollAnimator>
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <span className="inline-block px-2.5 py-1 bg-neutral-100 rounded-md text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                Happening Soon
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                This week in Singapore
              </h2>
            </div>
            <Link
              href="/events"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              See all events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollAnimator>

        {/* Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.slice(0, 4).map((event, i) => (
            <ScrollAnimator key={event.id} delay={i * 80}>
              <EventCard event={event} />
            </ScrollAnimator>
          ))}
        </div>

        {/* Mobile "See all" link */}
        <div className="text-center mt-8 sm:hidden">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            See all events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
