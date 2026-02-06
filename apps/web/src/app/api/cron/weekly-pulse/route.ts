import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  formatContextForPulse,
  WEEKLY_PULSE_SYSTEM_PROMPT,
} from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout for cron job

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Get the start (Monday) and end (Sunday) of the current week in Singapore timezone
 */
function getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date()
  const sgOffset = 8 * 60 // Singapore is UTC+8
  const utcOffset = now.getTimezoneOffset()
  const sgTime = new Date(now.getTime() + (sgOffset + utcOffset) * 60 * 1000)

  const dayOfWeek = sgTime.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(sgTime)
  monday.setDate(sgTime.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { weekStart: monday, weekEnd: sunday }
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

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  try {
    let jsonStr = textContent.text.trim()
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
    jsonStr = jsonStr.trim()

    const parsed = JSON.parse(jsonStr)
    return {
      summary: parsed.summary || 'Your weekly pulse is ready!',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch {
    return {
      summary: 'Your community is growing! Check back next week for detailed insights.',
      highlights: ['You have active events bringing people together'],
      insights: ['Building a fitness community takes time - keep at it!'],
      suggestions: ['Share your next event on Instagram Stories to boost visibility'],
    }
  }
}

/**
 * POST /api/cron/weekly-pulse
 * Generates weekly pulses for all active organizers
 * Should be called by Vercel Cron on Monday mornings
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { weekStart, weekEnd } = getCurrentWeekBounds()

    // Get all organizers who have had activity
    const organizers = await prisma.organizer.findMany({
      where: {
        // Only process organizers who have approved events
        OR: [
          {
            instagramHandle: {
              in: (await prisma.eventSubmission.findMany({
                where: { status: 'APPROVED' },
                select: { organizerInstagram: true },
                distinct: ['organizerInstagram'],
              })).map(e => e.organizerInstagram),
            },
          },
        ],
      },
    })

    const results = {
      total: organizers.length,
      generated: 0,
      skipped: 0,
      errors: 0,
      details: [] as { organizerId: string; status: string; error?: string }[],
    }

    for (const organizer of organizers) {
      try {
        // Check if pulse already exists for this week
        const existingPulse = await prisma.weeklyPulse.findUnique({
          where: {
            organizerId_weekStart: {
              organizerId: organizer.id,
              weekStart,
            },
          },
        })

        if (existingPulse) {
          results.skipped++
          results.details.push({
            organizerId: organizer.id,
            status: 'skipped',
          })
          continue
        }

        // Generate pulse
        const context = await buildAgentContext(organizer.id)
        const generated = await generatePulse(organizer.id)

        // Save to database
        await prisma.weeklyPulse.create({
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

        results.generated++
        results.details.push({
          organizerId: organizer.id,
          status: 'generated',
        })
      } catch (error) {
        results.errors++
        results.details.push({
          organizerId: organizer.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        console.error(`Failed to generate pulse for organizer ${organizer.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      ...results,
    })
  } catch (error) {
    console.error('Weekly pulse cron error:', error)
    return NextResponse.json(
      { error: 'Failed to run weekly pulse cron' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/weekly-pulse
 * Health check for the cron endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/weekly-pulse',
    description: 'Generates weekly AI pulses for all active organizers',
    schedule: 'Mondays at 8:00 AM SGT',
  })
}
