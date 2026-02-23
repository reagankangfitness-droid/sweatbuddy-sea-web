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

    const limit = checkRateLimit(session.id, 'ai/generate-social', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Daily limit reached. Try again in ${Math.ceil((limit.retryAfterSeconds || 0) / 3600)} hours.`, remaining: 0 },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { eventTitle, category, location, dateTime, description, communityName } = body as {
      eventTitle: string
      category: string
      location: string
      dateTime?: string
      description?: string
      communityName?: string
    }

    if (!eventTitle || !category) {
      return NextResponse.json({ error: 'Event title and category are required' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate social media content to promote a fitness event. Create 3 versions:

1. INSTAGRAM CAPTION: Engaging caption with relevant emojis, a call to action, and 5-8 relevant hashtags at the end. Keep it punchy and scroll-stopping. 2-3 short paragraphs max.

2. WHATSAPP MESSAGE: Casual, friendly message to share in group chats or DMs. Include key details (what, when, where). Use a few emojis but keep it natural like texting a friend. Include a line like "Drop a comment or DM me to join!"

3. INSTAGRAM STORY TEXT: Very short, bold text (2-3 lines max) designed for an Instagram Story overlay. Think big, punchy, attention-grabbing. Include one strong CTA.

Separate each section with these exact markers on their own lines:
---INSTAGRAM---
---WHATSAPP---
---STORY---

Event: ${eventTitle}
Category: ${category}
Location: ${location || 'TBD'}
Date/Time: ${dateTime || 'TBD'}
Description: ${description || 'none provided'}
Community: ${communityName || 'not specified'}

Start with the ---INSTAGRAM--- marker.`,
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    const rawText = textBlock ? textBlock.text.trim() : ''

    // Parse sections by markers
    const instagramMatch = rawText.match(/---INSTAGRAM---\s*([\s\S]*?)(?=---WHATSAPP---|$)/)
    const whatsappMatch = rawText.match(/---WHATSAPP---\s*([\s\S]*?)(?=---STORY---|$)/)
    const storyMatch = rawText.match(/---STORY---\s*([\s\S]*)$/)

    const instagram = instagramMatch?.[1]?.trim() || ''
    const whatsapp = whatsappMatch?.[1]?.trim() || ''
    const story = storyMatch?.[1]?.trim() || ''

    console.log(`[ai/generate-social] user=${session.id} event="${eventTitle}" remaining=${limit.remaining}`)

    return NextResponse.json({ instagram, whatsapp, story, remaining: limit.remaining })
  } catch (error) {
    console.error('[ai/generate-social] error:', error)
    return NextResponse.json({ error: 'Failed to generate social content' }, { status: 500 })
  }
}
