import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCommunityMemberRole } from '@/lib/community-system'
import { notifyMany, type NotifyParams } from '@/lib/notifications/service'

// GET /api/communities/[slug]/announcements - Get announcements
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
      include: { chat: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    if (!community.chat) {
      return NextResponse.json([])
    }

    const announcements = await prisma.communityMessage.findMany({
      where: {
        chatId: community.chat.id,
        isAnnouncement: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json(announcements)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/communities/[slug]/announcements - Create announcement
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
      include: { chat: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Check user has ADMIN or OWNER role
    const role = await getCommunityMemberRole(community.id, userId)
    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.json({ error: 'Only admins can post announcements' }, { status: 403 })
    }

    const body = await request.json()
    const { content, isPinned } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Content must be 2000 characters or less' }, { status: 400 })
    }

    // Create or get chat
    let chatId = community.chat?.id
    if (!chatId) {
      const chat = await prisma.communityChat.create({
        data: { communityId: community.id },
      })
      chatId = chat.id
    }

    const announcement = await prisma.communityMessage.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
        isAnnouncement: true,
        isPinned: !!isPinned,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    // Notify community members (fire-and-forget)
    try {
      const members = await prisma.communityMember.findMany({
        where: {
          communityId: community.id,
          userId: { not: userId },
          notificationsOn: true,
        },
        select: { userId: true },
      })

      if (members.length > 0) {
        const notifications: NotifyParams[] = members.map((m) => ({
          userId: m.userId,
          type: 'HOST_ANNOUNCEMENT' as const,
          title: `New announcement in ${community.name}`,
          body: content.trim().slice(0, 100),
          linkUrl: `/communities/${slug}`,
        }))
        notifyMany(notifications)
      }
    } catch {
      // Notification failure should not block the response
    }

    return NextResponse.json(announcement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
