import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueSlug, updateCommunityMemberCount } from '@/lib/community-system'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { checkRateLimit } from '@/lib/rate-limit'
import { getCurrentDbUser } from '@/lib/current-user'
import { scoreCommunityListing } from '@/lib/listing-moderation'
import { getCommunityDirectory } from '@/lib/community-directory'
import type { CommunityData } from '@/app/communities/CommunitiesPageClient'

// GET /api/communities - List communities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const owned = searchParams.get('owned') === 'true'
    const joined = searchParams.get('joined') === 'true'
    const limit = parseIntegerParam(searchParams.get('limit'), 20, 1, 100)
    const offset = parseIntegerParam(searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER)

    // If owned or joined filter, require authentication
    const dbUser = owned || joined ? await getCurrentDbUser() : null
    if ((owned || joined) && !dbUser) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
     }

    // Handle owned communities (communities user created)
    if (owned && dbUser) {
      const communities = await prisma.community.findMany({
        where: { createdById: dbUser.id },
        include: {
          city: true,
          _count: {
            select: {
              members: true,
              activities: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        communities: communities.map((c) => ({
          ...c,
          memberCount: c._count.members,
          eventCount: c._count.activities,
        })),
      })
    }

    // Handle joined communities (communities user is a member of)
    if (joined && dbUser) {
      const memberships = await prisma.communityMember.findMany({
        where: { userId: dbUser.id },
        include: {
          community: {
            include: {
              city: true,
              _count: {
                select: {
                  members: true,
                  activities: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      })

      return NextResponse.json({
        communities: memberships.map((m) => ({
          ...m.community,
          memberCount: m.community._count.members,
          eventCount: m.community._count.activities,
          role: m.role,
        })),
      })
    }

    // Default: source-backed public directory. This shares the same DB+seed fallback
    // used by /communities so public API consumers do not hard-fail on DB quota.
    const directory = await getCommunityDirectory()
    const filteredCommunities = filterPublicDirectoryCommunities(directory, {
      city,
      category,
      search,
      moderationStatus: 'LIVE',
    })
    const communities = filteredCommunities
      .slice(offset, offset + limit)
      .map(formatDirectoryCommunityForApi)
    const total = filteredCommunities.length

    return NextResponse.json({
      communities,
      total,
      hasMore: offset + communities.length < total,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function parseIntegerParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function filterPublicDirectoryCommunities(
  communities: CommunityData[],
  filters: {
    city: string | null
    category: string | null
    search: string | null
    moderationStatus: 'LIVE'
  },
) {
  if (filters.moderationStatus !== 'LIVE') return []

  const query = filters.search?.trim().toLowerCase()

  return communities.filter((community) => {
    if (filters.city && community.citySlug !== filters.city) return false
    if (filters.category && community.category !== filters.category) return false

    if (query) {
      const haystack = [
        community.name,
        community.description,
        community.usualArea,
        community.usualSchedule,
        community.bestFor,
        community.category,
        ...community.vibeTags,
      ].filter(Boolean).join(' ').toLowerCase()

      if (!haystack.includes(query)) return false
    }

    return true
  })
}

function formatDirectoryCommunityForApi(community: CommunityData) {
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
    city: community.cityName && community.citySlug
      ? { name: community.cityName, slug: community.citySlug }
      : null,
    latitude: community.latitude,
    longitude: community.longitude,
    usualArea: community.usualArea,
    usualSchedule: community.usualSchedule,
    joinPlatform: community.joinPlatform,
    communityLink: community.communityLink,
    websiteUrl: community.websiteUrl,
    sourceUrl: community.sourceUrl,
    sourceLabel: community.sourceLabel,
    bestFor: community.bestFor,
    soloFriendly: community.soloFriendly,
    confidenceScore: community.confidenceScore,
    confidenceTier: community.confidenceTier,
    vibeTags: community.vibeTags,
    priceType: community.priceType,
    beginnerFriendly: community.beginnerFriendly,
    lastVerifiedAt: community.lastVerifiedAt,
    creatorName: community.creatorName,
    creatorImageUrl: community.creatorImageUrl,
    members: community.members,
    nextEvent: community.nextEvent,
    _count: community._count,
  }
}

// POST /api/communities - Create a community
export async function POST(request: NextRequest) {
  try {
    const dbUser = await getCurrentDbUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 5 community creations per user per hour
    const rl = checkRateLimit(dbUser.id, 'communities/create', 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many communities created. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      city: cityName,
      citySlug,
      privacy = 'PUBLIC',
      logoImage,
      coverImage,
      instagramHandle,
      websiteUrl,
      communityLink,
      usualArea,
      usualSchedule,
      joinPlatform,
      vibeTags,
      priceType,
      beginnerFriendly,
      sourceUrl,
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    // Get city if provided (by slug or by name)
    let cityId: string | null = null
    if (citySlug) {
      const city = await prisma.city.findUnique({
        where: { slug: citySlug },
      })
      if (city) {
        cityId = city.id
      }
    } else if (cityName) {
      const city = await prisma.city.findFirst({
        where: { name: cityName },
      })
      if (city) {
        cityId = city.id
      }
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name)
    const sourceForRisk = sourceUrl || websiteUrl || communityLink || ''
    const [duplicateCommunity, recentSubmissionCount] = await Promise.all([
      prisma.community.findFirst({
        where: {
          OR: [
            ...(sourceForRisk ? [{ sourceUrl: sourceForRisk }, { communityLink: sourceForRisk }, { websiteUrl: sourceForRisk }] : []),
            { name: { equals: name, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true },
      }),
      prisma.community.count({
        where: {
          createdById: dbUser.id,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ])
    const decision = scoreCommunityListing({
      communityName: name,
      city: cityName || '',
      category,
      sourceUrl: sourceForRisk,
      note: description || usualArea || usualSchedule || null,
      submitterEmail: dbUser.email,
      submitterUserId: dbUser.id,
      duplicateCommunity: Boolean(duplicateCommunity),
      recentSubmissionCount,
    })

    if (decision.status === 'BLOCKED') {
      return NextResponse.json(
        { error: 'This community listing needs changes before it can be posted.', code: 'BLOCKED_CONTENT' },
        { status: 400 },
      )
    }

    if (duplicateCommunity) {
      return NextResponse.json(
        {
          community: duplicateCommunity,
          duplicate: true,
          requiresReview: false,
          limited: false,
        },
        { status: 200 },
      )
    }

    const initialModerationStatus = 'UNDER_REVIEW' as const

    // Create community with owner as first member, but keep it out of public discovery
    // until an admin approves it.
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description,
        category,
        cityId,
        privacy,
        logoImage,
        coverImage,
        instagramHandle,
        websiteUrl,
        communityLink,
        usualArea: usualArea || null,
        usualSchedule: usualSchedule || null,
        joinPlatform: joinPlatform || null,
        vibeTags: Array.isArray(vibeTags) ? vibeTags : [],
        priceType: priceType || null,
        beginnerFriendly: Boolean(beginnerFriendly),
        sourceUrl: sourceUrl || websiteUrl || communityLink || null,
        createdById: dbUser.id,
        memberCount: 1,
        isVerified: false,
        verificationStatus: 'UNVERIFIED',
        moderationStatus: initialModerationStatus,
        riskScore: decision.riskScore,
        riskFlags: decision.riskFlags,
        moderationNotes: decision.moderationNotes,
        isActive: false,
      },
      include: {
        city: true,
      },
    })

    // Add creator as OWNER
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: dbUser.id,
        role: 'OWNER',
      },
    })

    // Create community chat
    await prisma.communityChat.create({
      data: {
        communityId: community.id,
      },
    })

    // Track analytics event
    await trackEvent(EVENTS.COMMUNITY_CREATED, dbUser.id, {
      communityId: community.id,
      communitySlug: community.slug,
      communityName: community.name,
      category: community.category,
    })

    return NextResponse.json(
      {
        community,
        requiresReview: true,
        limited: false,
      },
      { status: 202 },
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
