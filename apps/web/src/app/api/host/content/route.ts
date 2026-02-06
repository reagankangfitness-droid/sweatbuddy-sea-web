import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  CONTENT_SYSTEM_PROMPT,
} from '@/lib/ai'

export const dynamic = 'force-dynamic'

// Rate limit: max 20 generations per hour
const GENERATION_LIMIT_PER_HOUR = 20

type ContentType = 'instagram_caption' | 'whatsapp_message' | 'event_description' | 'email'
type ContentTone = 'casual' | 'professional' | 'excited' | 'motivational'
type ContentLength = 'short' | 'medium' | 'long'

interface GenerateContentRequest {
  type: ContentType
  tone?: ContentTone
  length?: ContentLength
  eventId?: string
  customPrompt?: string
}

/**
 * Ensure organizer record exists for this session
 */
async function ensureOrganizer(session: { id: string; email: string; instagramHandle: string; name: string | null }) {
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

  return organizer
}

/**
 * POST /api/host/content
 * Generate AI content for hosts
 */
export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const body: GenerateContentRequest = await request.json()

    const {
      type,
      tone = 'casual',
      length = 'medium',
      eventId,
      customPrompt,
    } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      )
    }

    // Rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentGenerations = await prisma.generatedContent.count({
      where: {
        organizerId: organizer.id,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentGenerations >= GENERATION_LIMIT_PER_HOUR) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Get context
    const context = await buildAgentContext(organizer.id)

    // Get event details if eventId provided
    let eventDetails = ''
    if (eventId) {
      const event = await prisma.eventSubmission.findUnique({
        where: { id: eventId },
      })
      if (event) {
        eventDetails = `
Event Details:
- Name: ${event.eventName}
- Day: ${event.day}
- Time: ${event.time}
- Location: ${event.location}
- Description: ${event.description || 'No description'}
- Category: ${event.category}
${event.price ? `- Price: $${(event.price / 100).toFixed(2)}` : '- Price: Free'}
`
      }
    }

    // Build the prompt based on content type
    const typePrompts: Record<ContentType, string> = {
      instagram_caption: `Write an engaging Instagram caption for a fitness event. Include relevant emojis and hashtags. Make it feel authentic and community-focused.`,
      whatsapp_message: `Write a WhatsApp message to share with community members about an upcoming event. Keep it conversational and easy to read on mobile.`,
      event_description: `Write an event description that clearly explains what attendees can expect. Be informative yet engaging.`,
      email: `Write an email to community members. Include a subject line and body. Keep it scannable with short paragraphs.`,
    }

    const lengthGuides: Record<ContentLength, string> = {
      short: 'Keep it brief - 2-3 sentences max.',
      medium: 'Moderate length - 1 short paragraph.',
      long: 'Detailed - 2-3 paragraphs with all relevant info.',
    }

    const toneGuides: Record<ContentTone, string> = {
      casual: 'Use a friendly, casual tone like talking to a friend.',
      professional: 'Use a professional but warm tone.',
      excited: 'Use an enthusiastic, high-energy tone!',
      motivational: 'Use an inspiring, motivational tone that encourages action.',
    }

    const prompt = `${typePrompts[type]}

${toneGuides[tone]}
${lengthGuides[length]}

Host: ${context.organizerName} (@${context.instagramHandle})
Community Stats: ${context.totalEvents} events hosted, ${context.totalAttendees} total attendees

${eventDetails}

${customPrompt ? `Additional context: ${customPrompt}` : ''}

Generate the content now. Only output the content itself, no explanations.`

    // Generate with Claude
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 1000,
      system: CONTENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const generatedContent = textContent.text.trim()

    // Extract metadata based on content type
    let metadata: { hashtags?: string[]; subject?: string } = {}
    if (type === 'instagram_caption') {
      // Extract hashtags
      const hashtags = generatedContent.match(/#\w+/g) || []
      metadata = { hashtags }
    } else if (type === 'email') {
      // Try to extract subject line
      const lines = generatedContent.split('\n')
      const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'))
      if (subjectLine) {
        metadata = { subject: subjectLine.replace(/^subject:\s*/i, '') }
      }
    }

    // Save to database
    const saved = await prisma.generatedContent.create({
      data: {
        organizerId: organizer.id,
        eventId: eventId || null,
        type,
        tone,
        length,
        prompt,
        content: generatedContent,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    })

    return NextResponse.json({
      id: saved.id,
      content: generatedContent,
      type,
      tone,
      length,
      metadata,
      createdAt: saved.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/host/content
 * Get history of generated content
 */
export async function GET(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContentType | null
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const contents = await prisma.generatedContent.findMany({
      where: {
        organizerId: organizer.id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    })

    return NextResponse.json({
      contents: contents.map(c => ({
        id: c.id,
        content: c.content,
        type: c.type,
        tone: c.tone,
        length: c.length,
        metadata: c.metadata,
        eventId: c.eventId,
        copiedAt: c.copiedAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/host/content
 * Mark content as copied/used
 */
export async function PATCH(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const { contentId, action } = await request.json()

    if (!contentId || !action) {
      return NextResponse.json(
        { error: 'Content ID and action are required' },
        { status: 400 }
      )
    }

    const content = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        organizerId: organizer.id,
      },
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    if (action === 'copy') {
      await prisma.generatedContent.update({
        where: { id: contentId },
        data: { copiedAt: new Date() },
      })
    } else if (action === 'use') {
      const { platform } = await request.json()
      await prisma.generatedContent.update({
        where: { id: contentId },
        data: {
          usedAt: new Date(),
          usedWhere: platform || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
