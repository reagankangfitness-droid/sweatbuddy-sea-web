import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

// GET /api/activities/[id]/messages - Fetch messages for current user and host
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = id

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: { hostId: true, userId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has joined the activity (only joined users can message)
    const userActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
        status: 'JOINED',
      },
    })

    const isHost = activity.hostId === userId || activity.userId === userId

    if (!userActivity && !isHost) {
      return NextResponse.json(
        { error: 'You must join this activity to message the host' },
        { status: 403 }
      )
    }

    // Determine who the other person in the conversation is
    const hostId = activity.hostId || activity.userId
    const senderId = userId
    const receiverId = hostId

    // Find the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        activityId,
        OR: [
          { senderId: userId, receiverId: hostId },
          { senderId: hostId, receiverId: userId },
        ],
      },
      include: {
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ messages: [], conversation: null })
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        activityId: conversation.activityId,
        sender: conversation.sender,
        receiver: conversation.receiver,
      },
      messages: conversation.messages,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/activities/[id]/messages - Send a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 30 messages per user per minute
    const rl = checkRateLimit(userId, 'activity-messages', 30, 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const activityId = id
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Message content is too long (max 5000 characters)' }, { status: 400 })
    }

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: { hostId: true, userId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has joined the activity
    const userActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
        status: 'JOINED',
      },
    })

    const isHost = activity.hostId === userId || activity.userId === userId

    if (!userActivity && !isHost) {
      return NextResponse.json(
        { error: 'You must join this activity to message the host' },
        { status: 403 }
      )
    }

    // Determine sender and receiver
    const hostId = activity.hostId || activity.userId
    const receiverId = hostId

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        activityId,
        OR: [
          { senderId: userId, receiverId: hostId },
          { senderId: hostId, receiverId: userId },
        ],
      },
    })

    if (!conversation) {
      // Host can't initiate a conversation (they don't know which attendee to message)
      if (isHost) {
        return NextResponse.json(
          { error: 'No conversation exists. The attendee must send the first message.' },
          { status: 400 }
        )
      }
      try {
        conversation = await prisma.conversation.create({
          data: {
            activityId,
            senderId: userId,
            receiverId: hostId,
          },
        })
      } catch {
        // Handle race condition: another request may have created the conversation
        conversation = await prisma.conversation.findFirst({
          where: {
            activityId,
            OR: [
              { senderId: userId, receiverId: hostId },
              { senderId: hostId, receiverId: userId },
            ],
          },
        })
        if (!conversation) {
          throw new Error('Failed to create or find conversation')
        }
      }
    }

    // Create the message
    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
