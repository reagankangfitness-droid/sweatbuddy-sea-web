import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { anthropic, AGENT_MODEL, buildAgentContext, formatContextForChat } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    // Find or create organizer
    let organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { email: { equals: session.email, mode: 'insensitive' } },
          { instagramHandle: { equals: session.instagramHandle, mode: 'insensitive' } },
        ],
      },
    })

    if (!organizer) {
      organizer = await prisma.organizer.create({
        data: {
          email: session.email.toLowerCase(),
          instagramHandle: session.instagramHandle.toLowerCase(),
          name: session.name,
        },
      })
    }

    // Build context
    const context = await buildAgentContext(organizer.id)
    const contextStr = formatContextForChat(context)

    // Get past event performance details
    const events = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        status: { in: ['APPROVED', 'CANCELLED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        price: true,
        isFree: true,
        maxTickets: true,
        status: true,
      },
    })

    const eventIds = events.map(e => e.id)
    const attendanceCounts = eventIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['eventId'],
          _count: { id: true },
          where: { eventId: { in: eventIds } },
        })
      : []

    const countMap = new Map(attendanceCounts.map(c => [c.eventId, c._count.id]))

    const pastPerformance = events.map(e => ({
      name: e.eventName,
      category: e.category,
      day: e.day,
      time: e.time,
      date: e.eventDate?.toISOString().split('T')[0] || 'recurring',
      price: e.isFree ? 'Free' : `$${((e.price || 0) / 100).toFixed(2)}`,
      capacity: e.maxTickets || 'unlimited',
      attendance: countMap.get(e.id) || 0,
      status: e.status,
    }))

    const systemPrompt = `You are SweatBuddies AI Event Planner - a friendly, data-driven assistant that helps fitness community hosts plan their next events.

HOST DATA:
${contextStr}

PAST EVENT PERFORMANCE:
${pastPerformance.map(e => `- ${e.name} (${e.category}, ${e.day} ${e.time}): ${e.attendance} attendees, ${e.price}, capacity: ${e.capacity}`).join('\n')}

GUIDELINES:
- Give specific, data-backed recommendations based on the host's actual numbers
- When suggesting day/time: reference which slots had the best attendance
- When suggesting pricing: reference what price points worked best
- When suggesting capacity: base it on historical fill rates
- Keep responses concise, warm, and actionable
- Use bullet points for clarity
- If the host has limited data, acknowledge it and give general best practices
- Suggest concrete next steps the host can take right now`

    // Stream the response
    const stream = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stream: true,
    })

    // Create a ReadableStream to send to the client
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('AI planner error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
