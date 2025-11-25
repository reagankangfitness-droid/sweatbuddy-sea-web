import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
      messages,
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

    // Create the message
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending group message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
