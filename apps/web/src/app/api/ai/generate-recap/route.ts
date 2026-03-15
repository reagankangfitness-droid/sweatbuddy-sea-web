import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { anthropic, AGENT_MODEL } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// 15 generations per host per day (24h window)
const RATE_LIMIT_MAX = 15
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = checkRateLimit(session.id, 'ai/generate-recap', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Daily limit reached. Try again in ${Math.ceil((limit.retryAfterSeconds || 0) / 3600)} hours.`, remaining: 0 },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { eventTitle, category, attendeeCount, hostNotes, communityName } = body as {
      eventTitle: string
      category: string
      attendeeCount: number
      hostNotes?: string
      communityName?: string
    }

    if (!eventTitle || !category) {
      return NextResponse.json({ error: 'Event title and category are required' }, { status: 400 })
    }

    if (!attendeeCount || attendeeCount < 0) {
      return NextResponse.json({ error: 'Valid attendee count is required' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Write a short, warm, and energetic recap for a fitness community event that just happened. This will be shown publicly to attendees on the event page.

Requirements:
- 2-3 sentences max
- Celebrate the community and the shared experience
- Mention the attendee count naturally (${attendeeCount} people attended)
- Keep it genuine, not corporate — like a friend sharing a highlight
${hostNotes ? `- Incorporate these host notes naturally: "${hostNotes}"` : ''}
${communityName ? `- Community name: ${communityName}` : ''}

Event: ${eventTitle}
Category: ${category}
Attendees: ${attendeeCount}

Write ONLY the recap text, no labels or prefixes.`,
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    const recap = textBlock ? textBlock.text.trim() : ''

    console.info(`[ai/generate-recap] user=${session.id} event="${eventTitle}" remaining=${limit.remaining}`)

    return NextResponse.json({ recap, remaining: limit.remaining })
  } catch (error) {
    console.error('[ai/generate-recap] error:', error)
    return NextResponse.json({ error: 'Failed to generate recap' }, { status: 500 })
  }
}
