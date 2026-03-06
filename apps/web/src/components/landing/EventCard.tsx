import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock } from 'lucide-react'

export interface UpcomingEvent {
  id: string
  slug: string | null
  eventName: string
  category: string
  eventDate: string | null
  time: string
  location: string
  imageUrl: string | null
  organizerName: string
  isFree: boolean
  price: number | null
  currency: string | null
}

const categoryEmojis: Record<string, string> = {
  running: '\u{1F3C3}',
  yoga: '\u{1F9D8}',
  bootcamp: '\u{1F525}',
  hiit: '\u{1F525}',
  cycling: '\u{1F6B4}',
  swimming: '\u{1F3CA}',
  dance: '\u{1F483}',
  strength: '\u{1F3CB}',
  pilates: '\u{1F9D8}',
  calisthenics: '\u{1F4AA}',
  social: '\u{1F389}',
}

function getCategoryEmoji(category: string): string {
  return categoryEmojis[category.toLowerCase()] || '\u{1F4AA}'
}

export function EventCard({ event }: { event: UpcomingEvent }) {
  const href = event.slug ? `/e/${event.slug}` : `/e/${event.id}`
  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-SG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Singapore',
      })
    : null

  const priceLabel = event.isFree
    ? 'Free'
    : event.price
      ? `$${(event.price / 100).toFixed(0)}`
      : null

  return (
    <Link
      href={href}
      className="group block bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden hover:border-neutral-600 hover:shadow-md transition-all"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.eventName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
            <span className="text-4xl">{getCategoryEmoji(event.category)}</span>
          </div>
        )}

        {/* Category tag */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 bg-neutral-950/90 backdrop-blur-sm rounded-md text-xs font-medium text-neutral-300 capitalize">
            {event.category}
          </span>
        </div>

        {/* Price badge */}
        {priceLabel && (
          <div className="absolute top-2.5 right-2.5">
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
              event.isFree
                ? 'bg-green-950 text-green-400'
                : 'bg-neutral-950/90 backdrop-blur-sm text-neutral-100'
            }`}>
              {priceLabel}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-semibold text-sm text-neutral-100 line-clamp-2 leading-snug">
          {event.eventName}
        </h3>

        {eventDate && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{eventDate} at {event.time}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>

        <p className="text-xs text-neutral-400 mt-2 truncate">
          by {event.organizerName}
        </p>
      </div>
    </Link>
  )
}
