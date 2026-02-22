import { prisma } from './prisma'
import { anthropic, AGENT_MODEL } from '@/lib/ai/client'

/**
 * Process icebreaker messages for upcoming events.
 * Posts an AI-generated icebreaker question in event group chats
 * 24 hours before the event starts.
 */
export async function processIcebreakers(): Promise<{
  processed: number
  sent: number
  errors: number
}> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const stats = { processed: 0, sent: 0, errors: 0 }

  // Find published activities starting in the next 24 hours
  const activities = await prisma.activity.findMany({
    where: {
      startTime: { gte: now, lte: in24h },
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      type: true,
      hostId: true,
      userId: true,
      eventChat: {
        select: {
          id: true,
          isActive: true,
          icebreakerSent: true,
        },
      },
      userActivities: {
        where: { status: 'JOINED', deletedAt: null },
        select: { id: true },
      },
    },
  })

  for (const activity of activities) {
    stats.processed++

    try {
      const chat = activity.eventChat

      // Skip if no active chat or icebreaker already sent
      if (!chat || !chat.isActive || chat.icebreakerSent) {
        continue
      }

      // Skip if fewer than 3 joined RSVPs
      if (activity.userActivities.length < 3) {
        continue
      }

      // Generate icebreaker via AI
      const response = await anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 150,
        system: `Generate a short, fun icebreaker question for a group chat of people about to attend a ${activity.type} event called '${activity.title}'. The question should help people start talking before they meet in person. Keep it to 1-2 sentences. Be warm and casual, not corporate. Don't use emojis excessively.`,
        messages: [
          {
            role: 'user',
            content: `Event: '${activity.title}', Category: ${activity.type}`,
          },
        ],
      })

      const icebreakerText =
        response.content[0].type === 'text' ? response.content[0].text : null

      if (!icebreakerText) {
        stats.errors++
        continue
      }

      const hostUserId = activity.hostId || activity.userId

      // Post icebreaker message and mark as sent in a transaction
      await prisma.$transaction([
        prisma.eventChatMessage.create({
          data: {
            chatId: chat.id,
            userId: hostUserId,
            content: icebreakerText,
            isSystem: true,
            isIcebreaker: true,
          },
        }),
        prisma.eventChat.update({
          where: { id: chat.id },
          data: { icebreakerSent: true },
        }),
      ])

      stats.sent++
    } catch (error) {
      console.error(
        `Icebreaker failed for activity ${activity.id}:`,
        error instanceof Error ? error.message : error
      )
      stats.errors++
    }
  }

  return stats
}
