import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { generateUniqueSlug } from '@/lib/community-system'
import { trackEvent, EVENTS } from '@/lib/analytics'
import { logAdminAction } from '@/lib/admin-audit'

interface SeedCommunityInput {
  name: string
  category: string
  description?: string
  city?: string
  logoImage?: string
  coverImage?: string
  instagramHandle?: string
  websiteUrl?: string
  communityLink?: string
  schedule?: string
}

async function seedOneCommunity(input: SeedCommunityInput, adminUserId: string) {
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
    schedule,
  } = input

  if (!name || !category) {
    return { success: false, error: 'name and category are required', name }
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

  // Build description with schedule
  let fullDescription = description || ''
  if (schedule) {
    fullDescription = fullDescription
      ? `${fullDescription}\n\nSchedule: ${schedule}`
      : `Schedule: ${schedule}`
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
      description: fullDescription || null,
      logoImage: logoImage || null,
      coverImage: coverImage || null,
      instagramHandle: normalizedHandle,
      websiteUrl: websiteUrl || null,
      communityLink: communityLink || null,
      cityId: cityRecord?.id || null,
      createdById: adminUserId,
      isSeeded: true,
      claimableBy: normalizedHandle,
      memberCount: 0,
    },
  })

  // Create community chat
  await prisma.communityChat.create({
    data: { communityId: community.id },
  })

  // Track analytics
  await trackEvent(EVENTS.COMMUNITY_SEEDED, adminUserId, {
    communityId: community.id,
    communityName: name,
    slug,
  })

  // Audit log
  await logAdminAction({
    action: 'seed_community',
    targetType: 'community',
    targetId: community.id,
    adminId: adminUserId,
    details: { name, slug, category, instagramHandle: normalizedHandle },
  })

  return { success: true, community }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Bulk seeding
    if (Array.isArray(body.communities)) {
      const results = []
      for (const input of body.communities) {
        try {
          const result = await seedOneCommunity(input, userId)
          results.push(result)
        } catch (error) {
          results.push({
            success: false,
            name: input.name || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
      return NextResponse.json({ results })
    }

    // Single community
    const result = await seedOneCommunity(body, userId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.community, { status: 201 })
  } catch (error) {
    console.error('Error seeding community:', error)
    return NextResponse.json(
      { error: 'Failed to seed community' },
      { status: 500 }
    )
  }
}
