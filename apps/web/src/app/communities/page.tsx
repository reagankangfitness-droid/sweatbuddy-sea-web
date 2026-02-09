import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Users, Calendar, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Communities | SweatBuddies',
  description: 'Join fitness communities in Singapore and Bangkok. Find your tribe, attend events, and connect with like-minded people.',
  openGraph: {
    title: 'Communities | SweatBuddies',
    description: 'Join fitness communities in Singapore and Bangkok. Find your tribe.',
    url: 'https://www.sweatbuddies.co/communities',
  },
}

const categoryColors: Record<string, string> = {
  run: 'from-amber-400 to-orange-500',
  yoga: 'from-blue-400 to-indigo-500',
  gym: 'from-red-400 to-rose-500',
  hiit: 'from-orange-400 to-amber-500',
  cycling: 'from-lime-400 to-green-500',
  swimming: 'from-cyan-400 to-blue-500',
  dance: 'from-pink-400 to-rose-500',
  default: 'from-neutral-400 to-neutral-600',
}

function getCategoryColor(category: string): string {
  const key = category.toLowerCase().split(/[-_\s]/)[0]
  return categoryColors[key] || categoryColors.default
}

async function getCommunities() {
  const communities = await prisma.community.findMany({
    where: { isActive: true },
    include: {
      city: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isVerified: true,
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
    take: 50,
  })
  return communities
}

async function getCities() {
  const cities = await prisma.city.findMany({
    where: { isLaunched: true },
    orderBy: { communityCount: 'desc' },
  })
  return cities
}

export default async function CommunitiesPage() {
  const [communities, cities] = await Promise.all([
    getCommunities(),
    getCities(),
  ])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-900">
              sweatbuddies
            </Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-neutral-900 mb-4">
            Find Your Community
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {communities.length} active communities hosting fitness events across Southeast Asia. Join your tribe.
          </p>
        </div>
      </section>

      {/* City Filter */}
      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <span className="text-sm text-neutral-500 whitespace-nowrap">Browse by city:</span>
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm font-medium text-neutral-700 transition-colors whitespace-nowrap"
              >
                <MapPin className="w-4 h-4" />
                {city.name}
                <span className="text-neutral-400">({city.communityCount})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Communities Grid */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.slug}`}
                className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Cover Image */}
                <div className={`relative h-32 bg-gradient-to-br ${getCategoryColor(community.category)}`}>
                  {community.coverImage && (
                    <Image
                      src={community.coverImage}
                      alt={community.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-neutral-700 capitalize">
                      {community.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Logo/Avatar */}
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0 -mt-8 border-2 border-white shadow-sm">
                      {community.logoImage ? (
                        <Image
                          src={community.logoImage}
                          alt={community.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : community.createdBy?.imageUrl ? (
                        <Image
                          src={community.createdBy.imageUrl}
                          alt={community.createdBy.name || ''}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-semibold text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                        {community.name}
                      </h3>
                      {community.city && (
                        <p className="text-sm text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {community.city.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {community.description && (
                    <p className="mt-3 text-sm text-neutral-600 line-clamp-2">
                      {community.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community._count.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {community._count.activities} events
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {communities.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No communities yet</h3>
              <p className="text-neutral-600">Be the first to create a community!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-semibold text-2xl text-neutral-900 mb-3">
            Want to start your own community?
          </h2>
          <p className="text-neutral-600 mb-6">
            Create a community and start hosting events for your tribe.
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
