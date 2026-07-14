import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/current-user'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const dbUser = await getCurrentDbUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const body = await request.json().catch(() => ({}))
    const goingSolo = body.goingSolo !== false

    // Update the user's RSVP record to going solo
    const userActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: { userId: dbUser.id, activityId: eventId },
      },
      select: { id: true, status: true, goingSolo: true },
    })

    if (!userActivity || !['JOINED', 'COMPLETED'].includes(userActivity.status)) {
      return NextResponse.json(
        { error: 'You must be joined to this event' },
        { status: 403 }
      )
    }

    if (userActivity.goingSolo === goingSolo) {
      return NextResponse.json({ goingSolo })
    }

    // Update goingSolo on the UserActivity record
    await prisma.userActivity.update({
      where: { id: userActivity.id },
      data: { goingSolo },
    })

    if (!goingSolo) {
      return NextResponse.json({ goingSolo: false })
    }

    // Get user's first name for the system message
    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
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
        userId: dbUser.id,
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
