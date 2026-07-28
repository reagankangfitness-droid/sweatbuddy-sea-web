import { prisma } from '@/lib/prisma'
import {
  getCommunitySeedConfidenceScore,
  getPublicCommunitySeeds,
  type CommunityDirectorySeed,
} from '@/lib/community-directory-seed'
import { getCityLocationConfig } from '@/lib/location-config'
import type { CityData, CommunityData } from '@/app/communities/CommunitiesPageClient'

export async function getCommunityDirectory(): Promise<CommunityData[]> {
  const communities = await prisma.community
    .findMany({
      where: {
        isActive: true,
        moderationStatus: 'LIVE',
        usualArea: { not: null },
        OR: [
          { sourceUrl: { not: null } },
          { communityLink: { not: null } },
          { websiteUrl: { not: null } },
          { instagramHandle: { not: null } },
        ],
      },
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
            moderationStatus: 'LIVE',
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
      take: 100,
    })
    .catch((error) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('Failed to load communities:', error)
      }
      return []
    })

  const databaseCommunities: CommunityData[] = communities.map((community) => {
    const fallbackCoordinates = resolveCommunityDirectoryCoordinates({
      citySlug: community.city?.slug ?? null,
      usualArea: community.usualArea,
      id: community.id,
    })

    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      coverImage: community.coverImage,
      logoImage: community.logoImage,
      category: community.category,
      isVerified: community.isVerified,
      memberCount: community.memberCount,
      eventCount: community.eventCount,
      cityName: community.city?.name ?? null,
      citySlug: community.city?.slug ?? null,
      latitude: community.latitude ?? fallbackCoordinates.lat,
      longitude: community.longitude ?? fallbackCoordinates.lng,
      usualArea: community.usualArea,
      usualSchedule: community.usualSchedule,
      joinPlatform: community.joinPlatform,
      communityLink: community.communityLink,
      websiteUrl: community.websiteUrl,
      sourceUrl: community.sourceUrl,
      sourceLabel: community.sourceUrl || community.communityLink || community.websiteUrl
        ? 'Official source'
        : null,
      bestFor: null,
      soloFriendly: community.beginnerFriendly || community.vibeTags.includes('solo'),
      confidenceScore: community.isVerified ? 90 : 70,
      confidenceTier: community.isVerified ? 'verified' : 'source_checked',
      vibeTags: community.vibeTags,
      priceType: community.priceType,
      beginnerFriendly: community.beginnerFriendly,
      lastVerifiedAt: community.lastVerifiedAt?.toISOString() ?? null,
      creatorName: community.createdBy?.name ?? null,
      creatorImageUrl: community.createdBy?.imageUrl ?? null,
      members: community.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        imageUrl: member.user.imageUrl,
      })),
      nextEvent: community.activities[0]
        ? {
            id: community.activities[0].id,
            title: community.activities[0].title,
            startTime: community.activities[0].startTime?.toISOString() ?? new Date().toISOString(),
            categorySlug: community.activities[0].categorySlug,
          }
        : null,
      _count: community._count,
    }
  })

  return mergeSeedCommunities(databaseCommunities)
}

export function seedToCommunityData(seed: CommunityDirectorySeed): CommunityData {
  const fallbackCoordinates = resolveCommunityDirectoryCoordinates(seed)

  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    coverImage: seed.coverImage ?? null,
    logoImage: null,
    category: seed.category,
    isVerified: true,
    memberCount: 0,
    eventCount: 0,
    cityName: seed.cityName,
    citySlug: seed.citySlug,
    latitude: fallbackCoordinates.lat,
    longitude: fallbackCoordinates.lng,
    usualArea: seed.usualArea,
    usualSchedule: seed.usualSchedule,
    joinPlatform: seed.joinPlatform,
    communityLink: seed.communityLink,
    websiteUrl: seed.websiteUrl ?? null,
    sourceUrl: seed.sourceUrl,
    sourceLabel: seed.sourceLabel,
    bestFor: seed.bestFor,
    soloFriendly: seed.soloFriendly,
    confidenceScore: getCommunitySeedConfidenceScore(seed),
    confidenceTier: seed.confidenceTier,
    vibeTags: seed.vibeTags,
    priceType: seed.priceType,
    beginnerFriendly: seed.beginnerFriendly,
    lastVerifiedAt: seed.lastVerifiedAt,
    creatorName: null,
    creatorImageUrl: null,
    members: [],
    nextEvent: null,
    _count: { members: 0, activities: 0 },
  }
}

function resolveCommunityDirectoryCoordinates(community: {
  citySlug: string | null
  usualArea: string | null
  id: string
}) {
  const city = getCityLocationConfig(community.citySlug)
  const area = community.usualArea?.trim().toLowerCase()
  const neighborhood = area
    ? city.neighborhoods.find((candidate) => {
        const name = candidate.name.toLowerCase()
        return area.includes(name) || name.includes(area)
      })
    : null
  const base = neighborhood ?? city.center
  const seed = community.id.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)

  return {
    lat: base.lat + ((((seed * 17) % 100) - 50) / 6500),
    lng: base.lng + ((((seed * 29) % 100) - 50) / 5000),
  }
}

export function mergeSeedCommunities(databaseCommunities: CommunityData[]): CommunityData[] {
  const seen = new Set<string>()
  const merged: CommunityData[] = []

  for (const community of databaseCommunities) {
    seen.add(community.slug)
    seen.add(community.name.toLowerCase())
    if (community.sourceUrl) seen.add(community.sourceUrl)
    if (community.communityLink) seen.add(community.communityLink)
    if (community.websiteUrl) seen.add(community.websiteUrl)
    merged.push(community)
  }

  for (const seed of getPublicCommunitySeeds()) {
    if (
      seen.has(seed.slug) ||
      seen.has(seed.name.toLowerCase()) ||
      seen.has(seed.sourceUrl) ||
      seen.has(seed.communityLink) ||
      (seed.websiteUrl && seen.has(seed.websiteUrl))
    ) {
      continue
    }
    merged.push(seedToCommunityData(seed))
  }

  return merged.sort((a, b) => {
    const scoreDiff = (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    return a.name.localeCompare(b.name)
  })
}

export function getCitiesFromCommunityDirectory(communities: CommunityData[]): CityData[] {
  const counts = new Map<string, CityData>()

  for (const community of communities) {
    if (!community.cityName || !community.citySlug) continue
    const existing = counts.get(community.citySlug)
    counts.set(community.citySlug, {
      name: community.cityName,
      slug: community.citySlug,
      communityCount: (existing?.communityCount ?? 0) + 1,
    })
  }

  return [...counts.values()].sort((a, b) => b.communityCount - a.communityCount)
}

export function getCommunityDirectorySubtitle(communityCount: number, cities: CityData[]): string {
  const prefix = `${communityCount} source-checked communit${communityCount === 1 ? 'y' : 'ies'}`
  if (cities.length === 0) return prefix
  if (cities.length === 1) return `${prefix} in ${cities[0].name}`
  if (cities.length === 2) return `${prefix} in ${cities[0].name} & ${cities[1].name}`
  const allButLast = cities.slice(0, -1).map((city) => city.name).join(', ')
  return `${prefix} in ${allButLast} & ${cities[cities.length - 1].name}`
}

export function getCommunityJoinReadiness(community: CommunityData) {
  const issues: string[] = []
  const strengths: string[] = []
  const hasOfficialLink = Boolean(community.communityLink || community.websiteUrl || community.sourceUrl)
  const checkedAt = community.lastVerifiedAt ? new Date(community.lastVerifiedAt) : null
  const stale = !checkedAt || Date.now() - checkedAt.getTime() > 45 * 24 * 60 * 60 * 1000

  if (hasOfficialLink) strengths.push('Official link found')
  else issues.push('Missing official join link')

  if (community.usualArea) strengths.push('Area is clear')
  else issues.push('Missing usual area')

  if (community.usualSchedule) strengths.push('Schedule signal')
  else issues.push('Missing usual schedule')

  if (community.beginnerFriendly) strengths.push('Beginner-friendly')
  else issues.push('Beginner fit unclear')

  if (community.soloFriendly) strengths.push('Solo-friendly')
  else issues.push('Solo fit unclear')

  if (community.priceType) strengths.push('Cost expectation set')
  else issues.push('Cost expectation unclear')

  if (community.coverImage || community.logoImage) strengths.push('Visual identity')
  else issues.push('Missing photo or logo')

  if (stale) issues.push('Needs fresh source check')
  else strengths.push('Recently checked')

  const score = Math.max(0, Math.min(100, strengths.length * 14 - issues.length * 3))

  return { score, strengths, issues, stale }
}
