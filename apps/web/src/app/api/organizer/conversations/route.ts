import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Get all conversations for the organizer
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)

    // Find organizer in DB
    const organizer = await prisma.organizer.findUnique({
      where: { id: session.id },
    })

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      )
    }

    // Get all conversations with last message
    const conversations = await prisma.eventDirectConversation.findMany({
      where: { organizerId: organizer.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      conversations: conversations.map((c) => ({
        id: c.id,
        eventId: c.eventId,
        attendeeEmail: c.attendeeEmail,
        attendeeName: c.attendeeName,
        lastMessageAt: c.lastMessageAt?.toISOString() || null,
        messageCount: c._count.messages,
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content,
              senderType: c.messages[0].senderType,
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('Get organizer conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    )
  }
}
