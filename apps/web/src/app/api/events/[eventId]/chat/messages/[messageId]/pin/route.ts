import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/events/[eventId]/chat/messages/[messageId]/pin
 * Toggle pin/unpin a message. Host only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string; messageId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, messageId } = await params

    // Verify activity and host access
    const activity = await prisma.activity.findUnique({
      where: { id: eventId },
      select: { id: true, hostId: true, userId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const isHost = userId === activity.hostId || userId === activity.userId
    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can pin messages' }, { status: 403 })
    }

    // Find the message
    const message = await prisma.eventChatMessage.findUnique({
      where: { id: messageId },
      include: { chat: { select: { activityId: true } } },
    })

    if (!message || message.chat.activityId !== eventId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Toggle pin
    const updated = await prisma.eventChatMessage.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
      include: {
        user: { select: { id: true, name: true, imageUrl: true } },
      },
    })

    return NextResponse.json({
      id: updated.id,
      content: updated.content,
      isPinned: updated.isPinned,
      createdAt: updated.createdAt.toISOString(),
      user: updated.user,
    })
  } catch (error) {
    console.error('Pin message error:', error)
    return NextResponse.json(
      { error: 'Failed to pin message' },
      { status: 500 }
    )
  }
}
