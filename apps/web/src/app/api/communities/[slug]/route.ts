import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canManageCommunity, getCommunityMemberRole } from '@/lib/community-system'

// GET /api/communities/[slug] - Get community details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()

    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        city: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
            isVerified: true,
            instagram: true,
          },
        },
        _count: {
          select: {
            members: true,
            activities: true,
          },
        },
      },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check if current user is a member
    let membership = null
    if (userId) {
      const member = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId,
          },
        },
      })
      if (member) {
        membership = {
          role: member.role,
          joinedAt: member.joinedAt,
          notificationsOn: member.notificationsOn,
        }
      }
    }

    // Get upcoming events
    const upcomingEvents = await prisma.activity.findMany({
      where: {
        communityId: community.id,
        status: 'PUBLISHED',
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            userActivities: true,
          },
        },
      },
    })

    return NextResponse.json({
      community,
      membership,
      upcomingEvents,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/communities/[slug] - Update community
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

    // Check if user can manage this community
    if (!(await canManageCommunity(community.id, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      coverImage,
      logoImage,
      category,
      privacy,
      instagramHandle,
      websiteUrl,
      communityLink,
    } = body

    const updated = await prisma.community.update({
      where: { id: community.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(logoImage !== undefined && { logoImage }),
        ...(category && { category }),
        ...(privacy && { privacy }),
        ...(instagramHandle !== undefined && { instagramHandle }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(communityLink !== undefined && { communityLink }),
      },
      include: {
        city: true,
      },
    })

    return NextResponse.json({ community: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/communities/[slug] - Delete community (owner only)
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
    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Only owner can delete
    const role = await getCommunityMemberRole(community.id, userId)
    if (role !== 'OWNER') {
      return NextResponse.json({ error: 'Only the owner can delete this community' }, { status: 403 })
    }

    // Soft delete - just mark as inactive
    await prisma.community.update({
      where: { id: community.id },
      data: { isActive: false },
    })

    // Update city community count
    if (community.cityId) {
      await prisma.city.update({
        where: { id: community.cityId },
        data: { communityCount: { decrement: 1 } },
      })
    }

    return NextResponse.json({ message: 'Community deleted successfully' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
