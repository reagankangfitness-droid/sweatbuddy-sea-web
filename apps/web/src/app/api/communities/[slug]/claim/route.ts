import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { trackEvent, EVENTS } from '@/lib/analytics'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug } = await params
    const { instagramHandle } = await request.json()

    if (!instagramHandle) {
      return NextResponse.json(
        { error: 'Instagram handle is required' },
        { status: 400 }
      )
    }

    // Find community by slug
    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Must be seeded
    if (!community.isSeeded) {
      return NextResponse.json(
        { error: 'This community is not claimable' },
        { status: 400 }
      )
    }

    // Must not already be claimed
    if (community.claimedAt) {
      return NextResponse.json(
        { error: 'This community has already been claimed' },
        { status: 400 }
      )
    }

    // Normalize handles for comparison
    const normalizeHandle = (h: string) =>
      h.replace(/^@/, '').toLowerCase().trim()

    const userHandle = normalizeHandle(instagramHandle)
    const communityHandle = community.claimableBy
      ? normalizeHandle(community.claimableBy)
      : null

    if (!communityHandle || userHandle !== communityHandle) {
      return NextResponse.json(
        {
          error:
            "Instagram handle doesn't match. Contact support@sweatbuddies.co",
        },
        { status: 403 }
      )
    }

    // Claim the community
    await prisma.community.update({
      where: { id: community.id },
      data: {
        claimedById: userId,
        claimedAt: new Date(),
        createdById: userId,
      },
    })

    // Create owner membership
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
      update: { role: 'OWNER' },
      create: {
        communityId: community.id,
        userId,
        role: 'OWNER',
      },
    })

    // Track analytics
    await trackEvent(EVENTS.COMMUNITY_CLAIMED, userId, {
      communityId: community.id,
      communityName: community.name,
      slug: community.slug,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error claiming community:', error)
    return NextResponse.json(
      { error: 'Failed to claim community' },
      { status: 500 }
    )
  }
}
