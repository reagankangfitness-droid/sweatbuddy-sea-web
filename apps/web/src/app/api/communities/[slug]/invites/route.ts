import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canManageCommunity, generateInviteCode } from '@/lib/community-system'

// GET /api/communities/[slug]/invites - List invites (admin only)
export async function GET(
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

    if (!(await canManageCommunity(community.id, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const invites = await prisma.communityInvite.findMany({
      where: { communityId: community.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invites })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/communities/[slug]/invites - Create invite
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
    const body = await request.json()
    const { maxUses, expiresInDays } = body

    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    if (!(await canManageCommunity(community.id, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate unique code
    let code = generateInviteCode()
    while (await prisma.communityInvite.findUnique({ where: { code } })) {
      code = generateInviteCode()
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const invite = await prisma.communityInvite.create({
      data: {
        communityId: community.id,
        code,
        invitedById: userId,
        maxUses: maxUses || null,
        expiresAt,
      },
    })

    return NextResponse.json({
      invite,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'}/join/c/${code}`,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/communities/[slug]/invites - Delete invite
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
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    if (!(await canManageCommunity(community.id, userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.communityInvite.delete({
      where: { code },
    })

    return NextResponse.json({ message: 'Invite deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
