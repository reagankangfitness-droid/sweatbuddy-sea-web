import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/current-user'

/**
 * POST /api/community/follow — Follow a community
 * Body: { communityId } or { instagramHandle }
 */
export async function POST(request: Request) {
  const dbUser = await getCurrentDbUser()
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { communityId, instagramHandle } = body

  // Find community by ID or instagram handle
  let community
  if (communityId) {
    community = await prisma.community.findUnique({ where: { id: communityId } })
  } else if (instagramHandle) {
    const normalized = instagramHandle.replace(/^@/, '').toLowerCase().trim()
    community = await prisma.community.findFirst({
      where: { instagramHandle: { equals: normalized, mode: 'insensitive' } },
    })
  }

  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  // Check if already a member
  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: dbUser.id } },
  })

  if (existing) {
    return NextResponse.json({ message: 'Already following', communityId: community.id })
  }

  // Create membership (follow)
  await prisma.communityMember.create({
    data: {
      communityId: community.id,
      userId: dbUser.id,
      role: 'MEMBER',
    },
  })

  // Update member count
  const count = await prisma.communityMember.count({ where: { communityId: community.id } })
  await prisma.community.update({
    where: { id: community.id },
    data: { memberCount: count },
  })

  return NextResponse.json({
    success: true,
    message: 'Now following',
    communityId: community.id,
  })
}

/**
 * DELETE /api/community/follow — Unfollow a community
 * Body: { communityId }
 */
export async function DELETE(request: Request) {
  const dbUser = await getCurrentDbUser()
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { communityId } = body

  if (!communityId) {
    return NextResponse.json({ error: 'communityId is required' }, { status: 400 })
  }

  // Check membership exists and is not OWNER
  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: dbUser.id } },
  })

  if (!member) {
    return NextResponse.json({ message: 'Not following' })
  }

  if (member.role === 'OWNER') {
    return NextResponse.json(
      { error: 'Owners cannot unfollow their own community' },
      { status: 400 }
    )
  }

  await prisma.communityMember.delete({
    where: { id: member.id },
  })

  // Update member count
  const count = await prisma.communityMember.count({ where: { communityId } })
  await prisma.community.update({
    where: { id: communityId },
    data: { memberCount: count },
  })

  return NextResponse.json({ success: true, message: 'Unfollowed' })
}
