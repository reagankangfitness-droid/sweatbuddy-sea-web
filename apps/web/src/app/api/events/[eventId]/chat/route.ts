import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get chat messages for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
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
    const body = await request.json()
    const { content, senderName, senderEmail } = body

    // Validate required fields
    if (!content || !senderEmail) {
      return NextResponse.json(
        { error: 'Content and email are required' },
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
        email: senderEmail.toLowerCase().trim(),
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Only attendees can send messages' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.eventChatMessage.create({
      data: {
        eventId,
        content: content.trim(),
        senderName: senderName?.trim() || attendance.name || 'Anonymous',
        senderEmail: senderEmail.toLowerCase().trim(),
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to send message', details: errorMessage },
      { status: 500 }
    )
  }
}
