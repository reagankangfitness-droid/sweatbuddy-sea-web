import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getEventById, getEventGoingCount } from '@/lib/events'
import { Header } from '@/components/header'
import { UnifiedEventClient } from './UnifiedEventClient'
import { EventAttendees } from '@/components/EventAttendees'
import { formatEventDate, isTodaySG, isThisWeekendSG } from '@/lib/event-dates'

// Use ISR - revalidate every 30 seconds for fresh data with caching
export const revalidate = 30

interface Props {
  params: Promise<{ id: string }>
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

// Category emojis
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
  'Pickleball': '🏓',
  'Tennis': '🎾',
  'Basketball': '🏀',
  'Football': '⚽',
  'Swim': '🏊',
  'Cycle': '🚴',
  'Climb': '🧗',
  'Boxing': '🥊',
  'Pilates': '🤸',
  'Walk': '🚶',
  'Ice Bath': '🧊',
  'Sauna': '🧖',
}

// Format date for OG description
function formatOGDate(dateStr: string | null | undefined, dayName: string, time: string, recurring: boolean): string {
  const formatted = formatEventDate(dateStr, dayName, recurring)
  return `${formatted}, ${time}`
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEventById(id)

  if (!event) {
    return {
      title: 'Event Not Found | SweatBuddies',
      description: 'This event could not be found on SweatBuddies.',
    }
  }

  const hostName = event.organizer ? `@${event.organizer}` : 'SweatBuddies'
  const ogTitle = `${event.name} — ${hostName}`
  const pageTitle = `${event.name} | SweatBuddies`
  const formattedDateTime = formatOGDate(event.eventDate, event.day, event.time, event.recurring)
  const locationShort = event.location.length > 50 ? event.location.split(',')[0] : event.location
  const suffix = ` ${formattedDateTime} @ ${locationShort}`

  let ogDescription: string
  if (event.description) {
    const maxDescLength = 150 - suffix.length
    const truncatedDesc = truncateText(event.description, Math.max(50, maxDescLength))
    ogDescription = `${truncatedDesc}${suffix}`
  } else {
    const emoji = categoryEmojis[event.category] || '✨'
    ogDescription = `${emoji} ${event.category} event.${suffix}`
  }

  const ogImageUrl = event.imageUrl || `${BASE_URL}/api/og?title=${encodeURIComponent(event.name)}&category=${encodeURIComponent(event.category)}`
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
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
  }
}

// Unified Event Detail Page
export default async function EventDetailPage({ params }: Props) {
  const { id } = await params

  const [event, goingCount] = await Promise.all([
    getEventById(id),
    getEventGoingCount(id)
  ])

  if (!event) {
    notFound()
  }

  const emoji = categoryEmojis[event.category] || '✨'
  const formattedDate = formatEventDate(event.eventDate, event.day, event.recurring)

  // Check engagement signals using Singapore timezone
  const eventDateObj = event.eventDate ? new Date(event.eventDate) : null
  const isToday = isTodaySG(eventDateObj)
  const isThisWeekend = isThisWeekendSG(eventDateObj)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      <main className="pt-20 pb-32 md:pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Event Image */}
          <div className="relative aspect-[2/1] md:aspect-[2.5/1] rounded-2xl overflow-hidden mb-6">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={event.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 dark:from-pink-500/10 dark:to-rose-500/10 flex items-center justify-center">
                <span className="text-7xl md:text-8xl">{emoji}</span>
              </div>
            )}

            {/* Badges on image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {isToday && (
                <span className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold">
                  TODAY
                </span>
              )}
              {isThisWeekend && !isToday && (
                <span className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold">
                  THIS WEEKEND
                </span>
              )}
              {event.recurring && (
                <span className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium">
                  Weekly
                </span>
              )}
              <span className="px-3 py-1.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-200">
                {emoji} {event.category}
              </span>
            </div>

            {event.isFull && (
              <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold">
                FULL
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                  {event.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span>📅</span>
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span>🕐</span>
                    <span>{event.time}</span>
                  </span>
                  {event.recurring && (
                    <span className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-white">
                      <span>🔄</span>
                      <span>Every {event.day}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* About */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
                  About
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Join us for an amazing fitness session! All levels welcome.'}
                </p>
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
                  Location
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {event.location}
                </p>
                {/* Get Directions Button */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get Directions
                </a>
              </div>

              {/* Organizer - No external links */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
                  Hosted by
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                    {event.organizer?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {event.organizer || 'Anonymous Host'}
                    </p>
                    <p className="text-xs text-neutral-500">Event Organizer</p>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <EventAttendees eventId={event.id} />
            </div>

            {/* Sidebar - Sticky CTA (desktop only, mobile uses fixed bottom bar) */}
            <div className="hidden md:block md:col-span-1">
              <div className="sticky top-24 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
                {/* Going count */}
                <div className="text-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  {goingCount === 0 ? (
                    <p className="text-base font-medium text-neutral-500">Be the first to join!</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-neutral-900 dark:text-white">{goingCount}</p>
                      <p className="text-sm text-neutral-500">
                        {goingCount === 1 ? 'person going' : 'people going'}
                      </p>
                    </>
                  )}
                </div>

                {/* Price display */}
                {!event.isFree && event.price && (
                  <div className="text-center pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                      ${(event.price / 100).toFixed(2)}
                      <span className="text-sm font-normal text-neutral-500 ml-1">SGD</span>
                    </p>
                  </div>
                )}

                {/* Client-side actions - simplified */}
                <UnifiedEventClient
                  event={{
                    id: event.id,
                    slug: event.slug,
                    name: event.name,
                    day: event.day,
                    time: event.time,
                    location: event.location,
                    organizer: event.organizer,
                    isFull: event.isFull,
                    eventDate: event.eventDate,
                    isFree: event.isFree,
                    price: event.price,
                    paynowEnabled: event.paynowEnabled,
                    paynowQrCode: event.paynowQrCode,
                    paynowNumber: event.paynowNumber,
                  }}
                  initialGoingCount={goingCount}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 safe-area-inset-bottom z-50">
        <UnifiedEventClient
          event={{
            id: event.id,
            slug: event.slug,
            name: event.name,
            day: event.day,
            time: event.time,
            location: event.location,
            organizer: event.organizer,
            isFull: event.isFull,
            eventDate: event.eventDate,
            isFree: event.isFree,
            price: event.price,
            paynowEnabled: event.paynowEnabled,
            paynowQrCode: event.paynowQrCode,
            paynowNumber: event.paynowNumber,
          }}
          initialGoingCount={goingCount}
          variant="mobile"
        />
      </div>
    </div>
  )
}
