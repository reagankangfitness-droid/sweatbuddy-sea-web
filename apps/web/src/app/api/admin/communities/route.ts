import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { generateUniqueSlug } from '@/lib/community-system'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { logAdminAction } from '@/lib/admin-audit'
import { getCurrentDbUser } from '@/lib/current-user'

// GET - List all communities with full details
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        coverImage: true,
        logoImage: true,
        instagramHandle: true,
        websiteUrl: true,
        communityLink: true,
        usualArea: true,
        usualSchedule: true,
        joinPlatform: true,
        vibeTags: true,
        priceType: true,
        beginnerFriendly: true,
        sourceUrl: true,
        lastVerifiedAt: true,
        memberCount: true,
        eventCount: true,
        isActive: true,
        isVerified: true,
        verificationStatus: true,
        moderationStatus: true,
        riskScore: true,
        riskFlags: true,
        moderationNotes: true,
        isSeeded: true,
        claimableBy: true,
        claimedAt: true,
        claimedById: true,
        createdAt: true,
        city: {
          select: { name: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { memberCount: 'desc' },
    })

    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

// POST - Create a new community (seed from admin UI)
export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await getCurrentDbUser()
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      category,
      description,
      city = 'Singapore',
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
      lastVerifiedAt,
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'name and category are required' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name)

    // Find city or default to Singapore
    let cityRecord = await prisma.city.findFirst({
      where: { name: { equals: city, mode: 'insensitive' } },
    })
    if (!cityRecord) {
      cityRecord = await prisma.city.findFirst({
        where: { name: { equals: 'Singapore', mode: 'insensitive' } },
      })
    }

    // Normalize instagram handle
    const normalizedHandle = instagramHandle
      ? instagramHandle.replace(/^@/, '').toLowerCase().trim()
      : null

    // Create the community
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        category,
        description: description || null,
        logoImage: logoImage || null,
        coverImage: coverImage || null,
        instagramHandle: normalizedHandle,
        websiteUrl: websiteUrl || null,
        communityLink: communityLink || null,
        usualArea: usualArea || null,
        usualSchedule: usualSchedule || null,
        joinPlatform: joinPlatform || null,
        vibeTags: Array.isArray(vibeTags) ? vibeTags : [],
        priceType: priceType || null,
        beginnerFriendly: Boolean(beginnerFriendly),
        sourceUrl: sourceUrl || websiteUrl || communityLink || null,
        lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : null,
        cityId: cityRecord?.id || null,
        createdById: dbUser.id,
        isSeeded: true,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        moderationStatus: 'LIVE',
        riskScore: 0,
        riskFlags: [],
        moderationNotes: null,
        claimableBy: normalizedHandle,
        memberCount: 0,
      },
    })

    // Create community chat
    await prisma.communityChat.create({
      data: { communityId: community.id },
    })

    // Track analytics
    await trackEvent(EVENTS.COMMUNITY_SEEDED, dbUser.id, {
      communityId: community.id,
      communityName: name,
      slug,
    })

    // Audit log
    await logAdminAction({
      action: 'seed_community',
      targetType: 'community',
      targetId: community.id,
      adminId: dbUser.id,
      details: { name, slug, category, instagramHandle: normalizedHandle },
    })

    return NextResponse.json(community, { status: 201 })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    )
  }
}
