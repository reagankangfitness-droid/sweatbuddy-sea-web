import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, MapPin, Users, Calendar } from 'lucide-react'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ slug: string }>
}

const cityImages: Record<string, string> = {
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
  bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200',
  'kuala-lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200',
  jakarta: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=1200',
}

const cityEmojis: Record<string, string> = {
  singapore: '🇸🇬',
  bangkok: '🇹🇭',
  'kuala-lumpur': '🇲🇾',
  jakarta: '🇮🇩',
  manila: '🇵🇭',
  hcmc: '🇻🇳',
  bali: '🏝️',
}

async function getCity(slug: string) {
  const city = await prisma.city.findUnique({
    where: { slug },
  })
  return city
}

async function getCommunities(cityId: string) {
  const communities = await prisma.community.findMany({
    where: {
      cityId,
      isActive: true,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          members: true,
          activities: true,
        },
      },
    },
    orderBy: { memberCount: 'desc' },
    take: 12,
  })
  return communities
}

async function getUpcomingEvents(cityId: string) {
  const events = await prisma.activity.findMany({
    where: {
      community: {
        cityId,
        isActive: true,
      },
      status: 'PUBLISHED',
      startTime: { gte: new Date() },
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          userActivities: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 12,
  })
  return events
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const city = await getCity(slug)

  if (!city) {
    return { title: 'City Not Found | SweatBuddies' }
  }

  return {
    title: `${city.name} Fitness Experiences & Communities | SweatBuddies`,
    description: `Find fitness experiences and join communities in ${city.name}. ${city.communityCount} communities, ${city.eventCount} experiences.`,
    openGraph: {
      title: `${city.name} | SweatBuddies`,
      description: `Find fitness experiences and communities in ${city.name}.`,
      url: `https://www.sweatbuddies.co/cities/${slug}`,
      images: cityImages[slug] ? [cityImages[slug]] : [],
    },
  }
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params

  const city = await getCity(slug)

  if (!city) {
    notFound()
  }

  if (!city.isLaunched) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <span className="text-6xl mb-4 block">{cityEmojis[slug] || '🌏'}</span>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{city.name}</h1>
          <p className="text-neutral-600 mb-8">Coming soon to SweatBuddies!</p>
          <Link
            href="/cities"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            View all cities
          </Link>
        </div>
      </div>
    )
  }

  const [communities, upcomingEvents] = await Promise.all([
    getCommunities(city.id),
    getUpcomingEvents(city.id),
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/cities"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Cities</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-900">
              sweatbuddies
            </Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-64 sm:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900">
          {cityImages[slug] && (
            <Image
              src={cityImages[slug]}
              alt={city.name}
              fill
              className="object-cover opacity-60"
              priority
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{cityEmojis[slug] || '🌏'}</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">{city.name}</h1>
          </div>
          <p className="text-white/80 text-lg mb-4">{city.country}</p>

          <div className="flex items-center gap-6 text-white/70">
            <span className="flex items-center gap-1.5">
              <Users className="w-5 h-5" />
              {city.communityCount} communities
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-5 h-5" />
              {city.eventCount} experiences
            </span>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Upcoming Experiences</h2>
            <Link
              href={`/events?city=${slug}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/activities/${event.id}`}
                  className="group block bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg bg-neutral-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-neutral-500">
                        {event.startTime ? new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }) : ''}
                      </span>
                      <span className="text-lg font-bold text-neutral-900">
                        {event.startTime ? new Date(event.startTime).getDate() : ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                        {event.title}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {event.startTime ? new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                      </p>
                      {event.community && (
                        <p className="text-xs text-neutral-400 mt-1 truncate">
                          by {event.community.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                        <Users className="w-3.5 h-3.5" />
                        {event._count.userActivities} going
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-neutral-50 rounded-xl">
              <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No upcoming experiences in {city.name}</p>
            </div>
          )}
        </div>
      </section>

      {/* Communities */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Communities</h2>
            <Link
              href={`/communities?city=${slug}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {communities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community) => (
                <Link
                  key={community.id}
                  href={`/communities/${community.slug}`}
                  className="group block bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {community.createdBy?.imageUrl ? (
                        <Image
                          src={community.createdBy.imageUrl}
                          alt={community.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                        {community.name}
                      </h3>
                      <p className="text-sm text-neutral-500 capitalize">{community.category}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community._count.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {community._count.activities} experiences
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No communities in {city.name} yet</p>
              <Link
                href="/host/community"
                className="inline-block mt-4 px-6 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Start the first one
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-semibold text-2xl text-neutral-900 mb-3">
            Start a community in {city.name}
          </h2>
          <p className="text-neutral-600 mb-6">
            Build your tribe and host experiences for the local fitness community.
          </p>
          <Link
            href="/host/community"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-800 transition-colors"
          >
            Create a Community
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
