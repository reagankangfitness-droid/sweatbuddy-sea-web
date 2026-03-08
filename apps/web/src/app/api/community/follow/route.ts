import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/community/follow — Follow a community
 * Body: { communityId } or { instagramHandle }
 */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the DB user
  const user = await prisma.user.findFirst({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
    where: { communityId_userId: { communityId: community.id, userId: user.id } },
  })

  if (existing) {
    return NextResponse.json({ message: 'Already following', communityId: community.id })
  }

  // Create membership (follow)
  await prisma.communityMember.create({
    data: {
      communityId: community.id,
      userId: user.id,
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
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { communityId } = body

  if (!communityId) {
    return NextResponse.json({ error: 'communityId is required' }, { status: 400 })
  }

  // Check membership exists and is not OWNER
  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
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
