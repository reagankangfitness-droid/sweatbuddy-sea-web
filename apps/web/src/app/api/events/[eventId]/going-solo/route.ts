import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Update the user's RSVP record to going solo
    const userActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: { userId, activityId: eventId },
      },
      select: { id: true, status: true, goingSolo: true },
    })

    if (!userActivity || userActivity.status !== 'JOINED') {
      return NextResponse.json(
        { error: 'You must be joined to this event' },
        { status: 403 }
      )
    }

    if (userActivity.goingSolo) {
      return NextResponse.json({ goingSolo: true })
    }

    // Update goingSolo on the UserActivity record
    await prisma.userActivity.update({
      where: { id: userActivity.id },
      data: { goingSolo: true },
    })

    // Get user's first name for the system message
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, name: true },
    })

    const displayName =
      user?.firstName || user?.name?.split(' ')[0] || 'Someone'

    // Find or create the EventChat
    const chat = await prisma.eventChat.upsert({
      where: { activityId: eventId },
      update: {},
      create: { activityId: eventId, isActive: true },
    })

    // Post a system message
    await prisma.eventChatMessage.create({
      data: {
        chatId: chat.id,
        userId,
        content: `${displayName} is going solo — say hi!`,
        isSystem: true,
      },
    })

    return NextResponse.json({ goingSolo: true })
  } catch (error) {
    console.error('Going solo error:', error)
    return NextResponse.json(
      { error: 'Failed to update going solo status' },
      { status: 500 }
    )
  }
}
