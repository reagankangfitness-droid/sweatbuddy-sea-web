import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/host/followers — Get follower count and list for the current host
 */
export async function GET() {
  const session = await getHostSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find communities owned by this host
  const communities = await prisma.community.findMany({
    where: {
      OR: [
        ...(session.userId ? [{ createdById: session.userId }] : []),
        ...(session.instagramHandle
          ? [{ instagramHandle: { equals: session.instagramHandle, mode: 'insensitive' as const } }]
          : []),
      ],
    },
    select: { id: true, name: true, memberCount: true },
  })

  if (communities.length === 0) {
    return NextResponse.json({ totalFollowers: 0, communities: [] })
  }

  const communityIds = communities.map((c) => c.id)

  // Total followers across all communities (excluding OWNER)
  const totalFollowers = await prisma.communityMember.count({
    where: {
      communityId: { in: communityIds },
      role: { not: 'OWNER' },
    },
  })

  // Recent followers (last 10)
  const recentFollowers = await prisma.communityMember.findMany({
    where: {
      communityId: { in: communityIds },
      role: { not: 'OWNER' },
    },
    include: {
      user: {
        select: { id: true, name: true, imageUrl: true },
      },
      community: {
        select: { name: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    totalFollowers,
    communities: communities.map((c) => ({
      id: c.id,
      name: c.name,
      memberCount: c.memberCount,
    })),
    recentFollowers: recentFollowers.map((f) => ({
      id: f.user.id,
      name: f.user.name,
      imageUrl: f.user.imageUrl,
      communityName: f.community.name,
      joinedAt: f.joinedAt.toISOString(),
    })),
  })
}
