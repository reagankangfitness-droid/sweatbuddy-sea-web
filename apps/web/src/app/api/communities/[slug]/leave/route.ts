import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCommunityMemberCount } from '@/lib/community-system'

// POST /api/communities/[slug]/leave - Leave a community
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

    // Check if a member
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 404 })
    }

    // Owner cannot leave - must transfer ownership or delete community
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Owner cannot leave. Transfer ownership or delete the community.' },
        { status: 400 }
      )
    }

    // Remove membership
    await prisma.communityMember.delete({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
    })

    // Update member count
    await updateCommunityMemberCount(community.id)

    return NextResponse.json({ message: 'Successfully left community' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
