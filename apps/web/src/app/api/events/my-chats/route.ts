import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({
    where: { id: userId },
    select: { email: true },
  })
  if (!dbUser?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Find distinct eventIds where user has sent messages
  const userMessages = await prisma.eventChatMessage.findMany({
    where: { senderEmail: dbUser.email.toLowerCase() },
    select: { eventId: true },
    distinct: ['eventId'],
  })

  const eventIds = userMessages.map((m) => m.eventId)
  if (eventIds.length === 0) {
    return NextResponse.json({ eventChats: [] })
  }

  // For each event, get latest message + event info
  const eventChats = await Promise.all(
    eventIds.map(async (eventId) => {
      const latestMsg = await prisma.eventChatMessage.findFirst({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
      })

      // Try to find event info from submissions first, then activities
      const submission = await prisma.eventSubmission.findFirst({
        where: { id: eventId },
        select: { id: true, eventName: true, imageUrl: true, category: true },
      })

      const activity = !submission
        ? await prisma.activity.findFirst({
            where: { id: eventId },
            select: { id: true, title: true, imageUrl: true, type: true },
          })
        : null

      return {
        eventId,
        eventName: submission?.eventName || activity?.title || 'Event',
        imageUrl: submission?.imageUrl || activity?.imageUrl || null,
        category: submission?.category || activity?.type || '',
        lastMessage: latestMsg
          ? {
              content: latestMsg.content,
              senderName: latestMsg.senderName,
              createdAt: latestMsg.createdAt.toISOString(),
            }
          : null,
      }
    })
  )

  // Sort by latest message time
  eventChats.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
    return bTime - aTime
  })

  return NextResponse.json({ eventChats })
}
