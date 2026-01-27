import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET: Fetch all host-attendee messages for admin
export async function GET(request: NextRequest) {
  // Admin auth check
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all conversations with their messages
    const conversations = await prisma.eventDirectConversation.findMany({
      include: {
        organizer: {
          select: {
            instagramHandle: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest message only
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    // Get total message count
    const totalMessages = await prisma.eventDirectMessage.count()

    // Get messages from last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const messagesThisWeek = await prisma.eventDirectMessage.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    })

    // Get unique conversations (active chats)
    const activeConversations = conversations.length

    // Format conversations for response
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      eventId: conv.eventId,
      attendeeEmail: conv.attendeeEmail,
      attendeeName: conv.attendeeName,
      organizerHandle: conv.organizer?.instagramHandle || 'Unknown',
      organizerName: conv.organizer?.name || null,
      lastMessage: conv.messages[0]?.content || null,
      lastMessageAt: conv.lastMessageAt?.toISOString() || conv.createdAt.toISOString(),
      lastMessageSender: conv.messages[0]?.senderType || null,
    }))

    return NextResponse.json({
      stats: {
        totalMessages,
        messagesThisWeek,
        activeConversations,
      },
      conversations: formattedConversations,
    })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
