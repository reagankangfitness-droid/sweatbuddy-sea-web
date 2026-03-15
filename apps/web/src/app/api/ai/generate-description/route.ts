import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { anthropic, AGENT_MODEL } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// 10 generations per host per day (24h window)
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = checkRateLimit(session.id, 'ai/generate-description', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Daily limit reached. Try again in ${Math.ceil((limit.retryAfterSeconds || 0) / 3600)} hours.`, remaining: 0 },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { title, category, location, dateTime, additionalContext } = body as {
      title: string
      category: string
      location: string
      dateTime?: string
      additionalContext?: string
    }

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Write a compelling event description for a fitness event. Be warm, energetic, and inclusive. Include what attendees can expect, who it's for, and why they should come. Keep it to 2-3 short paragraphs. No excessive emojis.

Event: ${title}
Category: ${category}
Location: ${location || 'TBD'}
Date/Time: ${dateTime || 'TBD'}
Additional context: ${additionalContext || 'none provided'}`,
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    const description = textBlock ? textBlock.text.trim() : ''

    console.info(`[ai/generate-description] user=${session.id} title="${title}" remaining=${limit.remaining}`)

    return NextResponse.json({ description, remaining: limit.remaining })
  } catch (error) {
    console.error('[ai/generate-description] error:', error)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
