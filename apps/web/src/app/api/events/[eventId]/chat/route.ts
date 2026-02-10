import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Get chat messages for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // SECURITY: Require Clerk authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details from Clerk
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const userEmail = user.primaryEmailAddress?.emailAddress
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // Verify user is attending this event
    const attendance = await prisma.eventAttendance.findFirst({
      where: {
        eventId,
        email: userEmail.toLowerCase().trim(),
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Only attendees can view messages' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor')

    const messages = await prisma.eventChatMessage.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    // Return in chronological order for display
    const orderedMessages = messages.reverse()

    return NextResponse.json({
      messages: orderedMessages.map((m) => ({
        id: m.id,
        content: m.content,
        senderName: m.senderName,
        senderEmail: m.senderEmail,
        createdAt: m.createdAt.toISOString(),
      })),
      nextCursor: messages.length === limit ? messages[0]?.id : null,
    })
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}

// Send a new chat message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // SECURITY: Require Clerk authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details from Clerk
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const userEmail = user.primaryEmailAddress?.emailAddress
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Verify user is attending this event
    const attendance = await prisma.eventAttendance.findFirst({
      where: {
        eventId,
        email: userEmail.toLowerCase().trim(),
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Only attendees can send messages' },
        { status: 403 }
      )
    }

    // Create message using authenticated user's details
    const senderName = user.firstName || user.fullName || attendance.name || 'Anonymous'
    const message = await prisma.eventChatMessage.create({
      data: {
        eventId,
        content: content.trim(),
        senderName,
        senderEmail: userEmail.toLowerCase().trim(),
      },
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        createdAt: message.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Send chat message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
