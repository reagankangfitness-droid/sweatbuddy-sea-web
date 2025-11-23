import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/activities/[id]/messages - Fetch messages for current user and host
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id

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
    const receiverId = isHost ? senderId : hostId

    // Find the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        activityId,
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
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
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
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
    const senderId = userId
    const receiverId = isHost ? senderId : hostId

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        activityId,
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          activityId,
          senderId,
          receiverId,
        },
      })
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
