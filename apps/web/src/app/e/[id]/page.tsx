import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getEventById, getEventGoingCount } from '@/lib/events'
import { Logo } from '@/components/logo'
import { EventPageClient } from './EventPageClient'
import { EventAttendees } from '@/components/EventAttendees'

// Use ISR - revalidate every 30 seconds for fresh data with caching
export const revalidate = 30

interface Props {
  params: Promise<{ id: string }>
}

const BASE_URL = 'https://www.sweatbuddies.co'

// Category emojis for OG images
const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

// Format date for display (e.g., "Sat, Dec 14")
function formatEventDate(dateStr: string | null | undefined, dayName: string): string {
  if (!dateStr) {
    // For recurring events, show the next occurrence day
    const dayMap: Record<string, number> = {
      'Sundays': 0, 'Mondays': 1, 'Tuesdays': 2, 'Wednesdays': 3,
      'Thursdays': 4, 'Fridays': 5, 'Saturdays': 6
    }
    const dayNum = dayMap[dayName]
    if (dayNum !== undefined) {
      const today = new Date()
      const daysUntil = (dayNum - today.getDay() + 7) % 7 || 7
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysUntil)
      return nextDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
    return dayName
  }

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dayName

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dayName
  }
}

// Format date for OG description (e.g., "Fri 20 Dec, 10AM")
function formatOGDate(dateStr: string | null | undefined, dayName: string, time: string): string {
  if (!dateStr) {
    return `${dayName}, ${time}`
  }

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return `${dayName}, ${time}`

    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    return `${formatted}, ${time}`
  } catch {
    return `${dayName}, ${time}`
  }
}

// Truncate text to a specific length with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEventById(id)

  // Fallback metadata if event not found
  if (!event) {
    return {
      title: 'Event Not Found | SweatBuddies',
      description: 'This event could not be found on SweatBuddies.',
      openGraph: {
        title: 'Event Not Found | SweatBuddies',
        description: 'This event could not be found on SweatBuddies.',
        url: `${BASE_URL}/e/${id}`,
        siteName: 'SweatBuddies',
        type: 'website',
      },
    }
  }

  // Format: "Event Name — Host Name"
  const hostName = event.organizer ? `@${event.organizer}` : 'SweatBuddies'
  const ogTitle = `${event.name} — ${hostName}`
  const pageTitle = `${event.name} | SweatBuddies`

  // Format date/time for description
  const formattedDateTime = formatOGDate(event.eventDate, event.day, event.time)

  // Build description: truncated event description + date/time @ location
  const locationShort = event.location.length > 50
    ? event.location.split(',')[0]
    : event.location
  const suffix = ` ${formattedDateTime} @ ${locationShort}`

  let ogDescription: string
  if (event.description) {
    // Truncate description to leave room for date/time/location
    const maxDescLength = 150 - suffix.length
    const truncatedDesc = truncateText(event.description, Math.max(50, maxDescLength))
    ogDescription = `${truncatedDesc}${suffix}`
  } else {
    const emoji = categoryEmojis[event.category] || '✨'
    ogDescription = `${emoji} ${event.category} event.${suffix}`
  }

  // Use event image directly if available, otherwise generate dynamic OG image
  let ogImageUrl: string
  if (event.imageUrl) {
    // Use the actual event image for better social previews
    ogImageUrl = event.imageUrl
  } else {
    // Generate dynamic OG image
    const dynamicOgUrl = new URL('/api/og', BASE_URL)
    dynamicOgUrl.searchParams.set('title', event.name)
    dynamicOgUrl.searchParams.set('category', event.category)
    dynamicOgUrl.searchParams.set('day', event.day)
    dynamicOgUrl.searchParams.set('time', event.time)
    dynamicOgUrl.searchParams.set('location', event.location)
    dynamicOgUrl.searchParams.set('organizer', event.organizer || '')
    ogImageUrl = dynamicOgUrl.toString()
  }

  // Use slug for canonical URL if available, otherwise use ID
  const canonicalPath = event.slug || id

  return {
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${BASE_URL}/e/${canonicalPath}`,
      siteName: 'SweatBuddies',
      type: 'website',
      locale: 'en_SG',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${event.name} - ${event.category} event on SweatBuddies`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
    },
  }
}

// Dedicated Event Detail Page
export default async function EventDetailPage({ params }: Props) {
  const { id } = await params

  // Fetch event and going count in parallel with caching
  const [event, goingCount] = await Promise.all([
    getEventById(id),
    getEventGoingCount(id)
  ])

  if (!event) {
    notFound()
  }

  const emoji = categoryEmojis[event.category] || '✨'
  const formattedDate = formatEventDate(event.eventDate, event.day)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-semibold text-lg text-neutral-900">SweatBuddies</span>
          </Link>
          <Link
            href="/#events"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Event Image */}
          {event.imageUrl ? (
            <div className="relative aspect-[2/1] md:aspect-[3/1] rounded-2xl overflow-hidden mb-8">
              <Image
                src={event.imageUrl}
                alt={event.name}
                fill
                className="object-cover"
                priority
              />
              {/* Category badge on image */}
              <span className="absolute top-4 left-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-medium text-neutral-700">
                {emoji} {event.category}
              </span>
              {/* Recurring badge */}
              {event.recurring && (
                <span className="absolute top-4 right-4 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-sm font-medium">
                  Weekly
                </span>
              )}
              {/* FULL badge */}
              {event.isFull && (
                <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold">
                  FULL
                </span>
              )}
            </div>
          ) : (
            <div className="aspect-[2/1] md:aspect-[3/1] rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 mb-8 flex items-center justify-center">
              <span className="text-8xl">{emoji}</span>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Title and basic info */}
              <div>
                {!event.imageUrl && (
                  <span className="inline-flex px-3 py-1 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700 mb-3">
                    {emoji} {event.category}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                  {event.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🕐</span>
                    <span>{event.time}</span>
                  </span>
                  {event.recurring && (
                    <span className="flex items-center gap-2 text-neutral-900 font-medium">
                      <span className="text-lg">🔄</span>
                      <span>Every {event.day}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>📝</span> About
                </h2>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Join us for an amazing fitness session! All levels welcome.'}
                </p>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>📍</span> Location
                </h2>
                <p className="text-neutral-600 mb-3">{event.location}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Open in Google Maps
                  <span>→</span>
                </a>
              </div>

              {/* Organizer */}
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>👤</span> Organizer
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center text-white font-semibold text-xl">
                    {event.organizer?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">@{event.organizer}</p>
                    <a
                      href={`https://instagram.com/${event.organizer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View on Instagram →
                    </a>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <EventAttendees eventId={event.id} />
            </div>

            {/* Sidebar - Actions */}
            <div className="md:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
                {/* Going count */}
                <div className="text-center pb-4 border-b border-neutral-100">
                  {goingCount === 0 ? (
                    <>
                      <p className="text-lg font-medium text-neutral-500">Be the first to join!</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-neutral-900">{goingCount}</p>
                      <p className="text-sm text-neutral-500">
                        {goingCount === 1 ? 'person going' : 'people going'}
                      </p>
                    </>
                  )}
                </div>

                {/* Price display for paid events */}
                {!event.isFree && event.price && (() => {
                  const basePrice = event.price
                  const platformFee = Math.round(basePrice * 0.05)
                  const total = basePrice + platformFee
                  return (
                    <div className="text-center pb-4 border-b border-neutral-100">
                      <p className="text-sm text-neutral-500 mb-1">Price</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        ${(total / 100).toFixed(2)} <span className="text-sm font-normal text-neutral-500">SGD</span>
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Ticket ${(basePrice / 100).toFixed(2)} + ${(platformFee / 100).toFixed(2)} fee
                      </p>
                    </div>
                  )
                })()}

                {/* Client-side interactive buttons */}
                <EventPageClient
                  event={{
                    id: event.id,
                    slug: event.slug,
                    name: event.name,
                    day: event.day,
                    time: event.time,
                    location: event.location,
                    organizer: event.organizer,
                    isFull: event.isFull,
                    communityLink: event.communityLink,
                    eventDate: event.eventDate,
                    // Pricing fields
                    isFree: event.isFree,
                    price: event.price,
                    stripeEnabled: event.stripeEnabled,
                  }}
                  initialGoingCount={goingCount}
                />

                {/* Back to events */}
                <Link
                  href="/#events"
                  className="block w-full text-center py-3 text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
                >
                  ← Browse all events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-500 mb-4">
            Discover community fitness events near you
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              Home
            </Link>
            <Link href="/#events" className="text-neutral-600 hover:text-neutral-900">
              Events
            </Link>
            <Link href="/organizer" className="text-neutral-600 hover:text-neutral-900">
              Host Login
            </Link>
            <a
              href="https://instagram.com/_sweatbuddies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-900"
            >
              Instagram
            </a>
          </div>
          <p className="text-xs text-neutral-400 mt-6">
            © {new Date().getFullYear()} SweatBuddies. Made with 💪 for the community.
          </p>
        </div>
      </footer>
    </div>
  )
}
