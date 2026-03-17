import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import CommunitiesPageClient, { CommunityData, CityData } from './CommunitiesPageClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Communities | SweatBuddies',
  description: 'Explore communities hosting fitness and wellness experiences.',
  openGraph: {
    title: 'Communities | SweatBuddies',
    description: 'Explore communities hosting fitness and wellness experiences.',
    url: 'https://www.sweatbuddies.co/communities',
  },
}

async function getCommunities(): Promise<CommunityData[]> {
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
      members: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
        take: 5,
        orderBy: { joinedAt: 'asc' },
      },
      activities: {
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          startTime: { gte: new Date() },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          categorySlug: true,
        },
        orderBy: { startTime: 'asc' },
        take: 1,
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

  return communities.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    coverImage: c.coverImage,
    logoImage: c.logoImage,
    category: c.category,
    isVerified: c.isVerified,
    memberCount: c.memberCount,
    eventCount: c.eventCount,
    cityName: c.city?.name ?? null,
    citySlug: c.city?.slug ?? null,
    creatorName: c.createdBy?.name ?? null,
    creatorImageUrl: c.createdBy?.imageUrl ?? null,
    members: c.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      imageUrl: m.user.imageUrl,
    })),
    nextEvent: c.activities[0]
      ? {
          id: c.activities[0].id,
          title: c.activities[0].title,
          startTime: c.activities[0].startTime?.toISOString() ?? new Date().toISOString(),
          categorySlug: c.activities[0].categorySlug,
        }
      : null,
    _count: c._count,
  }))
}

async function getCities(): Promise<CityData[]> {
  const cities = await prisma.city.findMany({
    where: { isLaunched: true, communityCount: { gt: 0 } },
    orderBy: { communityCount: 'desc' },
  })
  return cities.map((c) => ({
    name: c.name,
    slug: c.slug,
    communityCount: c.communityCount,
  }))
}

function getSubtitle(communityCount: number, cities: CityData[]): string {
  const prefix = `${communityCount} active communit${communityCount === 1 ? 'y' : 'ies'}`
  if (cities.length === 0) return prefix
  if (cities.length === 1) return `${prefix} in ${cities[0].name}`
  if (cities.length === 2) return `${prefix} in ${cities[0].name} & ${cities[1].name}`
  const allButLast = cities.slice(0, -1).map((c) => c.name).join(', ')
  return `${prefix} in ${allButLast} & ${cities[cities.length - 1].name}`
}

export default async function CommunitiesPage() {
  const [communities, cities] = await Promise.all([
    getCommunities(),
    getCities(),
  ])

  const subtitle = getSubtitle(communities.length, cities)

  return (
    <CommunitiesPageClient
      communities={communities}
      cities={cities}
      subtitle={subtitle}
    />
  )
}
