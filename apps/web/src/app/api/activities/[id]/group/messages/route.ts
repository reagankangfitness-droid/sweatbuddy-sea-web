import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseMentions } from '@/lib/mentions'
import { createMentionNotifications } from '@/lib/notifications'

// GET /api/activities/[id]/group/messages - Fetch all group messages
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
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Find the activity's group chat
    const group = await prisma.group.findFirst({
      where: {
        activityId,
        deletedAt: null,
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 })
    }

    // Check if user is the host
    const isHost = activity.userId === userId

    // Check if user is a member of the group
    const membership = await prisma.userGroup.findFirst({
      where: {
        userId,
        groupId: group.id,
        deletedAt: null,
      },
    })

    // Allow access if user is host OR a group member
    if (!membership && !isHost) {
      return NextResponse.json(
        { error: 'You must join this activity to view the group chat' },
        { status: 403 }
      )
    }

    // Fetch all messages
    const messages = await prisma.message.findMany({
      where: {
        groupId: group.id,
        deletedAt: null,
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
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Try to fetch mentions separately (may not exist in DB yet)
    let messagesWithMentions = messages.map(m => ({ ...m, mentions: [] as any[] }))
    try {
      const messageIds = messages.map(m => m.id)
      const mentions = await prisma.mention.findMany({
        where: { messageId: { in: messageIds } },
        select: {
          id: true,
          messageId: true,
          mentionedUserId: true,
          mentionText: true,
        },
      })

      // Group mentions by messageId
      const mentionsByMessage = mentions.reduce((acc, mention) => {
        if (!acc[mention.messageId]) acc[mention.messageId] = []
        acc[mention.messageId].push(mention)
        return acc
      }, {} as Record<string, typeof mentions>)

      messagesWithMentions = messages.map(m => ({
        ...m,
        mentions: mentionsByMessage[m.id] || [],
      }))
    } catch (e) {
      // Mentions table may not exist yet, continue without them
      // Mentions table not available yet
    }

    // Fetch group members for mention autocomplete
    const members = await prisma.userGroup.findMany({
      where: {
        groupId: group.id,
        deletedAt: null,
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

    // Also include the host in mentionable users
    const host = await prisma.user.findUnique({
      where: { id: activity.userId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    })

    // Combine members and host (avoid duplicates)
    const memberUsers = members.map(m => m.user)
    const mentionableUsers = host
      ? [host, ...memberUsers.filter(m => m.id !== host.id)]
      : memberUsers

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
      messages: messagesWithMentions,
      mentionableUsers,
    })
  } catch (error) {
    console.error('Error fetching group messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/activities/[id]/group/messages - Send a message to the group
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
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Find the activity's group chat
    const group = await prisma.group.findFirst({
      where: {
        activityId,
        deletedAt: null,
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group chat not found' }, { status: 404 })
    }

    // Check if user is the host
    const isHost = activity.userId === userId

    // Check if user is a member of the group
    const membership = await prisma.userGroup.findFirst({
      where: {
        userId,
        groupId: group.id,
        deletedAt: null,
      },
    })

    // Allow access if user is host OR a group member
    if (!membership && !isHost) {
      return NextResponse.json(
        { error: 'You must join this activity to send messages' },
        { status: 403 }
      )
    }

    // Get user details from Clerk and ensure they exist in database
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    })

    // Create the message (mentions are created async, so don't include them here)
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        groupId: group.id,
        userId,
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

    // Parse mentions and create notifications
    const trimmedContent = content.trim()

    // Fetch group members for mention resolution
    const members = await prisma.userGroup.findMany({
      where: {
        groupId: group.id,
        deletedAt: null,
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

    // Also include the host
    const host = await prisma.user.findUnique({
      where: { id: activity.userId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    })

    // Combine members and host
    const memberUsers = members.map(m => m.user)
    const mentionableUsers = host
      ? [host, ...memberUsers.filter(m => m.id !== host.id)]
      : memberUsers

    // Parse mentions from the message
    const mentions = parseMentions(trimmedContent, mentionableUsers)

    // Create notifications for mentioned users (async, don't block response)
    if (mentions.length > 0) {
      const senderName = clerkUser.fullName || clerkUser.firstName || 'Someone'

      createMentionNotifications({
        messageId: message.id,
        senderId: userId,
        senderName,
        mentions,
        activityId,
        activityTitle: activity.title,
        messagePreview: trimmedContent,
      }).catch(err => {
        console.error('Error creating mention notifications:', err)
      })
    }

    // Return message with empty mentions array (mentions are created async)
    return NextResponse.json({ ...message, mentions: [] }, { status: 201 })
  } catch (error) {
    console.error('Error sending group message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
