import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/events/[eventId]/chat/messages
 * Fetch chat messages with cursor-based pagination.
 * Only RSVP'd users and the host can access.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // Verify activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        hostId: true,
        userId: true,
        title: true,
        endTime: true,
        userActivities: {
          where: { userId, status: 'JOINED', deletedAt: null },
          select: { id: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check access: must be host or RSVP'd
    const isHost = userId === activity.hostId || userId === activity.userId
    const hasJoined = activity.userActivities.length > 0

    if (!isHost && !hasJoined) {
      return NextResponse.json(
        { error: 'Join this activity to access the group chat', locked: true },
        { status: 403 }
      )
    }

    // Check if chat is read-only (24h+ after event end)
    const isReadOnly = activity.endTime
      ? new Date().getTime() - new Date(activity.endTime).getTime() > 24 * 60 * 60 * 1000
      : false

    // Find or lazy-create EventChat
    let chat = await prisma.eventChat.findUnique({
      where: { activityId: eventId },
    })

    if (!chat) {
      chat = await prisma.eventChat.create({
        data: { activityId: eventId, isActive: true },
      })
    }

    // Check if chat has been deactivated
    if (!chat.isActive) {
      return NextResponse.json({
        messages: [],
        pinnedMessages: [],
        participantCount: 0,
        isReadOnly: true,
        hasMore: false,
        nextCursor: null,
      })
    }

    // Fetch pinned messages (always returned, separate from pagination)
    const pinnedMessages = await prisma.eventChatMessage.findMany({
      where: { chatId: chat.id, isPinned: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, imageUrl: true } },
      },
    })

    // Fetch messages with cursor-based pagination (newest first)
    const messages = await prisma.eventChatMessage.findMany({
      where: {
        chatId: chat.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there are more
      include: {
        user: { select: { id: true, name: true, imageUrl: true } },
      },
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    // Reverse to chronological order for display
    messages.reverse()

    const nextCursor = hasMore ? messages[0]?.createdAt.toISOString() : null

    // Get participant count
    const participantCount = await prisma.userActivity.count({
      where: { activityId: eventId, status: 'JOINED', deletedAt: null },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        isPinned: m.isPinned,
        isSystem: m.isSystem,
        isIcebreaker: m.isIcebreaker,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
      })),
      pinnedMessages: pinnedMessages.map((m) => ({
        id: m.id,
        content: m.content,
        isPinned: true,
        isSystem: m.isSystem,
        isIcebreaker: m.isIcebreaker,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
      })),
      participantCount,
      isHost,
      isReadOnly: isReadOnly || !chat.isActive,
      hasMore,
      nextCursor,
    })
  } catch (error) {
    console.error('Event chat GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events/[eventId]/chat/messages
 * Send a message to the event group chat.
 * Only RSVP'd users and the host can send.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const { content } = await request.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    // Verify activity and access
    const activity = await prisma.activity.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        hostId: true,
        userId: true,
        endTime: true,
        userActivities: {
          where: { userId, status: 'JOINED', deletedAt: null },
          select: { id: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const isHost = userId === activity.hostId || userId === activity.userId
    const hasJoined = activity.userActivities.length > 0

    if (!isHost && !hasJoined) {
      return NextResponse.json({ error: 'Join this activity to chat' }, { status: 403 })
    }

    // Check read-only (24h after event end)
    if (activity.endTime) {
      const hoursSinceEnd = (Date.now() - new Date(activity.endTime).getTime()) / (1000 * 60 * 60)
      if (hoursSinceEnd > 24) {
        return NextResponse.json({ error: 'This chat is now read-only' }, { status: 403 })
      }
    }

    // Find or lazy-create EventChat
    let chat = await prisma.eventChat.findUnique({
      where: { activityId: eventId },
    })

    if (!chat) {
      chat = await prisma.eventChat.create({
        data: { activityId: eventId, isActive: true },
      })
    }

    if (!chat.isActive) {
      return NextResponse.json({ error: 'This chat is closed' }, { status: 403 })
    }

    // Create message
    const message = await prisma.eventChatMessage.create({
      data: {
        chatId: chat.id,
        userId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, imageUrl: true } },
      },
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      isPinned: message.isPinned,
      isSystem: message.isSystem,
      isIcebreaker: message.isIcebreaker,
      createdAt: message.createdAt.toISOString(),
      user: message.user,
    })
  } catch (error) {
    console.error('Event chat POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
