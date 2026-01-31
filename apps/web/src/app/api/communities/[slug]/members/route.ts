import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canManageCommunity, isCommunityMember, updateCommunityMemberCount } from '@/lib/community-system'

// GET /api/communities/[slug]/members - List members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const [members, total] = await Promise.all([
      prisma.communityMember.findMany({
        where: { communityId: community.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              imageUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
          { joinedAt: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.communityMember.count({
        where: { communityId: community.id },
      }),
    ])

    return NextResponse.json({
      members,
      total,
      hasMore: offset + members.length < total,
    })
  } catch (error) {
    console.error('List members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/communities/[slug]/members - Update member role
export async function PATCH(
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

    // Check if user can manage
    if (!(await canManageCommunity(community.id, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, role } = body

    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'targetUserId and role are required' }, { status: 400 })
    }

    // Can't change owner's role
    const targetMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: targetUserId,
        },
      },
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Only owner can make someone admin
    if (role === 'ADMIN' || role === 'OWNER') {
      const currentUserMember = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId,
          },
        },
      })
      if (currentUserMember?.role !== 'OWNER') {
        return NextResponse.json({ error: 'Only owner can assign admin roles' }, { status: 403 })
      }
    }

    const updated = await prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/communities/[slug]/members - Remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if user can manage
    if (!(await canManageCommunity(community.id, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Can't remove owner
    const targetMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: targetUserId,
        },
      },
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })
    }

    // Admins can only remove regular members, not other admins
    const currentUserMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
    })

    if (currentUserMember?.role === 'ADMIN' && targetMember.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 403 })
    }

    await prisma.communityMember.delete({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: targetUserId,
        },
      },
    })

    await updateCommunityMemberCount(community.id)

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
