import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // Check organizer session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get attendees for this event
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
    })

    // Get conversation status for each attendee
    const session = JSON.parse(sessionCookie.value)
    const organizer = await prisma.organizer.findUnique({
      where: { id: session.id },
    })

    let conversationMap = new Map<string, { hasMessages: boolean; lastMessageAt: Date | null }>()

    if (organizer) {
      const conversations = await prisma.eventDirectConversation.findMany({
        where: {
          eventId,
          organizerId: organizer.id,
        },
        include: {
          _count: { select: { messages: true } },
        },
      })

      for (const conv of conversations) {
        conversationMap.set(conv.attendeeEmail, {
          hasMessages: conv._count.messages > 0,
          lastMessageAt: conv.lastMessageAt,
        })
      }
    }

    return NextResponse.json({
      success: true,
      attendees: attendees.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        timestamp: a.timestamp.toISOString(),
        mealPreference: a.mealPreference,
        hasConversation: conversationMap.has(a.email),
        lastMessageAt: conversationMap.get(a.email)?.lastMessageAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error('Get event attendees error:', error)
    return NextResponse.json(
      { error: 'Failed to get attendees' },
      { status: 500 }
    )
  }
}
