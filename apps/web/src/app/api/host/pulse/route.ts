import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  formatContextForPulse,
  WEEKLY_PULSE_SYSTEM_PROMPT,
} from '@/lib/ai'

export const dynamic = 'force-dynamic'

// Rate limit: max 1 generation per hour per host
const GENERATION_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

interface PulseData {
  id: string
  weekStart: string
  weekEnd: string
  summary: string
  highlights: string[]
  insights: string[]
  suggestions: string[]
  metrics: {
    thisWeekRsvps: number
    lastWeekRsvps: number
    totalAttendees: number
    totalEvents: number
    avgAttendeesPerEvent: number
  }
  generatedAt: string
}

/**
 * Get the start (Monday) and end (Sunday) of the current week in Singapore timezone
 */
function getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  // Get current date in Singapore timezone
  const now = new Date()
  const sgOffset = 8 * 60 // Singapore is UTC+8
  const utcOffset = now.getTimezoneOffset()
  const sgTime = new Date(now.getTime() + (sgOffset + utcOffset) * 60 * 1000)

  // Find Monday of current week
  const dayOfWeek = sgTime.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(sgTime)
  monday.setDate(sgTime.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)

  // Find Sunday of current week
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { weekStart: monday, weekEnd: sunday }
}

/**
 * Ensure organizer record exists for this session
 */
async function ensureOrganizer(session: { id: string; email: string; instagramHandle: string; name: string | null }) {
  // Try to find existing organizer by email or Instagram
  let organizer = await prisma.organizer.findFirst({
    where: {
      OR: [
        { email: { equals: session.email, mode: 'insensitive' } },
        { instagramHandle: { equals: session.instagramHandle, mode: 'insensitive' } },
      ],
    },
  })

  // Create if doesn't exist
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
 * Generate a weekly pulse using Claude
 */
async function generatePulse(organizerId: string): Promise<{
  summary: string
  highlights: string[]
  insights: string[]
  suggestions: string[]
}> {
  // Build context from database
  const context = await buildAgentContext(organizerId)
  const contextStr = formatContextForPulse(context)

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1500,
    system: WEEKLY_PULSE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a weekly pulse for this host:

${contextStr}

Generate a warm, encouraging weekly pulse with:
1. A brief summary paragraph (2-3 sentences max)
2. 2-3 highlights/wins from this week (even small ones count!)
3. 2-3 insights about their community
4. 2-3 actionable suggestions for next week

Format your response as JSON:
{
  "summary": "...",
  "highlights": ["...", "..."],
  "insights": ["...", "..."],
  "suggestions": ["...", "..."]
}

Only output the JSON, no other text.`,
      },
    ],
  })

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse JSON response
  try {
    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = textContent.text.trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }
    jsonStr = jsonStr.trim()

    const parsed = JSON.parse(jsonStr)
    return {
      summary: parsed.summary || 'Your weekly pulse is ready!',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch {
    // Fallback if JSON parsing fails
    console.error('Failed to parse Claude response:', textContent.text)
    return {
      summary: 'Your community is growing! Check back next week for detailed insights.',
      highlights: ['You have active events bringing people together'],
      insights: ['Building a fitness community takes time - keep at it!'],
      suggestions: ['Share your next event on Instagram Stories to boost visibility'],
    }
  }
}

/**
 * GET /api/host/pulse
 * Returns the current week's pulse, generating if needed
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure organizer record exists
    const organizer = await ensureOrganizer(session)
    const { weekStart, weekEnd } = getCurrentWeekBounds()

    // Check for existing pulse this week
    const existingPulse = await prisma.weeklyPulse.findUnique({
      where: {
        organizerId_weekStart: {
          organizerId: organizer.id,
          weekStart,
        },
      },
    })

    if (existingPulse) {
      // Return cached pulse
      const pulse: PulseData = {
        id: existingPulse.id,
        weekStart: existingPulse.weekStart.toISOString().split('T')[0],
        weekEnd: existingPulse.weekEnd.toISOString().split('T')[0],
        summary: existingPulse.summary,
        highlights: existingPulse.highlights as string[],
        insights: existingPulse.insights as string[],
        suggestions: existingPulse.suggestions as string[],
        metrics: existingPulse.metrics as PulseData['metrics'],
        generatedAt: existingPulse.createdAt.toISOString(),
      }

      return NextResponse.json({ pulse, cached: true })
    }

    // Generate new pulse
    const context = await buildAgentContext(organizer.id)
    const generated = await generatePulse(organizer.id)

    // Save to database
    const newPulse = await prisma.weeklyPulse.create({
      data: {
        organizerId: organizer.id,
        weekStart,
        weekEnd,
        summary: generated.summary,
        highlights: generated.highlights,
        insights: generated.insights,
        suggestions: generated.suggestions,
        metrics: {
          thisWeekRsvps: context.stats.thisWeekRsvps,
          lastWeekRsvps: context.stats.lastWeekRsvps,
          totalAttendees: context.totalAttendees,
          totalEvents: context.totalEvents,
          avgAttendeesPerEvent: context.stats.avgAttendeesPerEvent,
        },
        modelUsed: AGENT_MODEL,
      },
    })

    const pulse: PulseData = {
      id: newPulse.id,
      weekStart: newPulse.weekStart.toISOString().split('T')[0],
      weekEnd: newPulse.weekEnd.toISOString().split('T')[0],
      summary: newPulse.summary,
      highlights: newPulse.highlights as string[],
      insights: newPulse.insights as string[],
      suggestions: newPulse.suggestions as string[],
      metrics: newPulse.metrics as PulseData['metrics'],
      generatedAt: newPulse.createdAt.toISOString(),
    }

    return NextResponse.json({ pulse, cached: false })
  } catch (error) {
    console.error('Pulse API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pulse' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/host/pulse
 * Force regenerate the pulse for the current week
 */
export async function POST() {
  try {
    // Check authentication
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure organizer record exists
    const organizer = await ensureOrganizer(session)
    const { weekStart, weekEnd } = getCurrentWeekBounds()

    // Check for existing pulse and rate limit
    const existingPulse = await prisma.weeklyPulse.findUnique({
      where: {
        organizerId_weekStart: {
          organizerId: organizer.id,
          weekStart,
        },
      },
    })

    if (existingPulse) {
      const timeSinceGeneration = Date.now() - existingPulse.createdAt.getTime()
      if (timeSinceGeneration < GENERATION_COOLDOWN_MS) {
        const minutesRemaining = Math.ceil(
          (GENERATION_COOLDOWN_MS - timeSinceGeneration) / (60 * 1000)
        )
        return NextResponse.json(
          {
            error: `Rate limited. You can regenerate in ${minutesRemaining} minutes.`,
            retryAfter: minutesRemaining,
          },
          { status: 429 }
        )
      }

      // Delete existing pulse to regenerate
      await prisma.weeklyPulse.delete({
        where: { id: existingPulse.id },
      })
    }

    // Generate new pulse
    const context = await buildAgentContext(organizer.id)
    const generated = await generatePulse(organizer.id)

    // Save to database
    const newPulse = await prisma.weeklyPulse.create({
      data: {
        organizerId: organizer.id,
        weekStart,
        weekEnd,
        summary: generated.summary,
        highlights: generated.highlights,
        insights: generated.insights,
        suggestions: generated.suggestions,
        metrics: {
          thisWeekRsvps: context.stats.thisWeekRsvps,
          lastWeekRsvps: context.stats.lastWeekRsvps,
          totalAttendees: context.totalAttendees,
          totalEvents: context.totalEvents,
          avgAttendeesPerEvent: context.stats.avgAttendeesPerEvent,
        },
        modelUsed: AGENT_MODEL,
      },
    })

    const pulse: PulseData = {
      id: newPulse.id,
      weekStart: newPulse.weekStart.toISOString().split('T')[0],
      weekEnd: newPulse.weekEnd.toISOString().split('T')[0],
      summary: newPulse.summary,
      highlights: newPulse.highlights as string[],
      insights: newPulse.insights as string[],
      suggestions: newPulse.suggestions as string[],
      metrics: newPulse.metrics as PulseData['metrics'],
      generatedAt: newPulse.createdAt.toISOString(),
    }

    return NextResponse.json({ pulse, regenerated: true })
  } catch (error) {
    console.error('Pulse regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate pulse' },
      { status: 500 }
    )
  }
}
