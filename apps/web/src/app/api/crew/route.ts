import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.crewChatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          _count: { select: { members: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: { select: { id: true, name: true, firstName: true } },
            },
          },
          waveActivity: {
            select: {
              id: true,
              activityType: true,
              area: true,
              thought: true,
              locationName: true,
              scheduledFor: true,
              creator: { select: { name: true, firstName: true, imageUrl: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const crews = memberships.map((m) => {
    const lastMsg = m.chat.messages[0] || null
    return {
      chatId: m.chat.id,
      activityType: m.chat.activityType,
      area: m.chat.area,
      memberCount: m.chat._count.members,
      createdAt: m.chat.createdAt.toISOString(),
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            senderName: lastMsg.sender.firstName || lastMsg.sender.name || 'Anonymous',
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      waveActivityId: m.chat.waveActivity?.id || null,
      starterThought: m.chat.waveActivity?.thought || null,
      starterName: m.chat.waveActivity?.creator?.firstName || m.chat.waveActivity?.creator?.name || null,
      starterImageUrl: m.chat.waveActivity?.creator?.imageUrl || null,
      locationName: m.chat.waveActivity?.locationName || null,
      scheduledFor: m.chat.waveActivity?.scheduledFor?.toISOString() || null,
    }
  })

  // Sort: chats with recent messages first, then by creation date
  crews.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.createdAt
    const bTime = b.lastMessage?.createdAt || b.createdAt
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return NextResponse.json({ crews })
}
