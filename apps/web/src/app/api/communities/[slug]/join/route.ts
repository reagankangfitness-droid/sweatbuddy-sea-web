import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCommunityMemberCount } from '@/lib/community-system'

// POST /api/communities/[slug]/join - Join a community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    if (!community.isActive) {
      return NextResponse.json({ error: 'Community is not active' }, { status: 400 })
    }

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }

    // Check privacy settings
    if (community.privacy === 'INVITE_ONLY') {
      return NextResponse.json(
        { error: 'This community requires an invite to join' },
        { status: 403 }
      )
    }

    // For private communities, we could implement a request system
    // For now, we'll allow joining but this could be enhanced later

    // Add as member
    const member = await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: 'MEMBER',
      },
    })

    // Update member count
    await updateCommunityMemberCount(community.id)

    return NextResponse.json({
      member,
      message: 'Successfully joined community',
    }, { status: 201 })
  } catch (error) {
    console.error('Join community error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
