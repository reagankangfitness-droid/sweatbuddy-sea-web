import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react'
import { getEvents, Event } from '@/lib/events'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic'

// Category configuration
const categoryConfig: Record<string, {
  title: string
  description: string
  emoji: string
  color: string
}> = {
  'run-club': {
    title: 'Run Club',
    description: 'Join running groups near you. All paces welcome.',
    emoji: '🏃',
    color: 'bg-amber-100 text-amber-800',
  },
  'running': {
    title: 'Running',
    description: 'Running events and group runs near you.',
    emoji: '🏃',
    color: 'bg-amber-100 text-amber-800',
  },
  'yoga': {
    title: 'Yoga',
    description: 'Outdoor and indoor yoga classes for all levels.',
    emoji: '🧘',
    color: 'bg-blue-100 text-blue-800',
  },
  'hiit': {
    title: 'HIIT',
    description: 'High-intensity interval training sessions.',
    emoji: '🔥',
    color: 'bg-red-100 text-red-800',
  },
  'bootcamp': {
    title: 'Bootcamp',
    description: 'Full-body bootcamp workouts in the park.',
    emoji: '💪',
    color: 'bg-orange-100 text-orange-800',
  },
  'dance': {
    title: 'Dance',
    description: 'Dance fitness classes and social dance events.',
    emoji: '💃',
    color: 'bg-pink-100 text-pink-800',
  },
  'meditation': {
    title: 'Meditation',
    description: 'Guided meditation and mindfulness sessions.',
    emoji: '🧘',
    color: 'bg-indigo-100 text-indigo-800',
  },
  'outdoor': {
    title: 'Outdoor Fitness',
    description: 'Outdoor workout sessions in parks and nature.',
    emoji: '🌳',
    color: 'bg-green-100 text-green-800',
  },
  'combat': {
    title: 'Combat Sports',
    description: 'Boxing, martial arts, and combat fitness.',
    emoji: '🥊',
    color: 'bg-red-100 text-red-800',
  },
  'swimming': {
    title: 'Swimming',
    description: 'Open water and pool swimming groups.',
    emoji: '🏊',
    color: 'bg-cyan-100 text-cyan-800',
  },
  'cycling': {
    title: 'Cycling',
    description: 'Group rides and cycling meetups.',
    emoji: '🚴',
    color: 'bg-lime-100 text-lime-800',
  },
  'social': {
    title: 'Social Events',
    description: 'Social fitness meetups and community events.',
    emoji: '🎉',
    color: 'bg-purple-100 text-purple-800',
  },
}

// URL slug to category name mapping
function getCategoryFromSlug(slug: string): string {
  const mapping: Record<string, string> = {
    'run-club': 'Run Club',
    'running': 'Running',
    'yoga': 'Yoga',
    'hiit': 'HIIT',
    'bootcamp': 'Bootcamp',
    'dance': 'Dance',
    'dance-fitness': 'Dance Fitness',
    'meditation': 'Meditation',
    'outdoor': 'Outdoor Fitness',
    'outdoor-fitness': 'Outdoor Fitness',
    'combat': 'Combat',
    'swimming': 'Swimming',
    'cycling': 'Cycling',
    'social': 'Social',
  }
  return mapping[slug.toLowerCase()] || slug
}

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const config = categoryConfig[category] || {
    title: getCategoryFromSlug(category),
    description: `${getCategoryFromSlug(category)} events near you`,
    emoji: '✨',
  }

  return {
    title: `${config.title} Events | SweatBuddies`,
    description: config.description,
    openGraph: {
      title: `${config.emoji} ${config.title} Events | SweatBuddies`,
      description: config.description,
      url: `https://www.sweatbuddies.co/events/${category}`,
      images: [`https://www.sweatbuddies.co/api/og?title=${encodeURIComponent(config.title)}&category=${encodeURIComponent(config.title)}`],
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const categoryName = getCategoryFromSlug(category)
  const config = categoryConfig[category] || {
    title: categoryName,
    description: `${categoryName} events in Singapore`,
    emoji: '✨',
    color: 'bg-neutral-100 text-neutral-800',
  }

  // Fetch all events and filter by category
  const allEvents = await getEvents()
  const events = allEvents.filter(
    (e) => e.category.toLowerCase() === categoryName.toLowerCase()
  )

  // Get going counts for events
  const goingCounts = await prisma.eventAttendance.groupBy({
    by: ['eventId'],
    _count: { id: true },
    where: {
      eventId: { in: events.map((e) => e.id) },
    },
  })

  const countsMap = new Map(goingCounts.map((c) => [c.eventId, c._count.id]))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/#events"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">All Events</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-900">
              sweatbuddies
            </Link>
            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-5xl mb-4 block">{config.emoji}</span>
          <h1 className="font-sans font-bold text-3xl sm:text-4xl text-neutral-900 mb-3">
            {config.title} Events
          </h1>
          <p className="text-neutral-600 max-w-lg mx-auto">
            {config.description}
          </p>
          <div className="mt-6">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
              {events.length} event{events.length !== 1 ? 's' : ''} this week
            </span>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl mb-4 block">😢</span>
              <h2 className="font-semibold text-xl text-neutral-900 mb-2">
                No {config.title} events this week
              </h2>
              <p className="text-neutral-600 mb-6">
                Check back soon or browse other categories.
              </p>
              <Link
                href="/#events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-colors"
              >
                Browse All Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  goingCount={countsMap.get(event.id) || 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-semibold text-xl text-neutral-900 mb-6 text-center">
            Explore Other Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(categoryConfig)
              .filter(([slug]) => slug !== category)
              .slice(0, 8)
              .map(([slug, config]) => (
                <Link
                  key={slug}
                  href={`/events/${slug}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${config.color}`}
                >
                  {config.emoji} {config.title}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-semibold text-2xl text-neutral-900 mb-3">
            Host a {config.title} Event?
          </h2>
          <p className="text-neutral-600 mb-6">
            List your event for free and reach fitness enthusiasts in your area.
          </p>
          <Link
            href="/#submit-desktop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-800 transition-colors"
          >
            Submit Your Event
          </Link>
        </div>
      </section>
    </div>
  )
}

// Event Card Component
function EventCard({ event, goingCount }: { event: Event; goingCount: number }) {
  const categoryEmojis: Record<string, string> = {
    'Run Club': '🏃',
    'Running': '🏃',
    'Yoga': '🧘',
    'HIIT': '🔥',
    'Bootcamp': '💪',
    'Dance': '💃',
    'Meditation': '🧘',
    'Outdoor': '🌳',
    'Combat': '🥊',
  }

  const emoji = categoryEmojis[event.category] || '✨'

  return (
    <Link href={`/e/${event.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-all">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-neutral-100">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {emoji}
            </div>
          )}

          {/* Weekly badge */}
          {event.recurring && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-neutral-700">
              Weekly
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 line-clamp-1 mb-2">
            {event.name}
          </h3>

          <div className="space-y-1.5 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>{event.day}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            {goingCount > 0 && (
              <span className="text-xs text-neutral-400">
                {goingCount === 1 ? '1 going' : `${goingCount} going`}
              </span>
            )}
            <span className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">
              View →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
