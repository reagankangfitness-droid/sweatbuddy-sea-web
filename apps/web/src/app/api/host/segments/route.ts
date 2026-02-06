import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  SEGMENTATION_SYSTEM_PROMPT,
} from '@/lib/ai'

export const dynamic = 'force-dynamic'

interface AttendeeSegment {
  name: string
  description: string
  count: number
  members: Array<{
    email: string
    name: string | null
    attendanceCount: number
    lastAttendedDate: string | null
  }>
  suggestions: string[]
}

interface SegmentationResult {
  segments: AttendeeSegment[]
  totalAttendees: number
  generatedAt: string
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
 * GET /api/host/segments
 * Get AI-powered attendee segmentation
 */
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const context = await buildAgentContext(organizer.id)

    // If no attendees, return empty segments
    if (context.totalAttendees === 0) {
      return NextResponse.json({
        segments: [],
        totalAttendees: 0,
        generatedAt: new Date().toISOString(),
      })
    }

    // Build attendee data for segmentation
    const attendeeData = {
      topRegulars: context.topRegulars,
      atRiskMembers: context.atRiskMembers,
      recentActivity: context.recentActivity,
      stats: context.stats,
    }

    // Generate AI segmentation
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 2000,
      system: SEGMENTATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze and segment the following community members for host ${context.organizerName}:

Top Regulars (${context.topRegulars.length}):
${context.topRegulars.map(r => `- ${r.name || r.email}: ${r.attendanceCount} events attended`).join('\n')}

At-Risk Members (${context.atRiskMembers.length}):
${context.atRiskMembers.map(m => `- ${m.name || m.email}: ${m.totalAttendance} events, last attended ${m.daysSinceLastAttended} days ago`).join('\n')}

Recent Activity:
${context.recentActivity.slice(0, 10).map(a => `- ${a.attendeeName}: ${a.type} for ${a.eventName}`).join('\n')}

Stats:
- This week RSVPs: ${context.stats.thisWeekRsvps}
- Last week RSVPs: ${context.stats.lastWeekRsvps}
- Average attendees per event: ${context.stats.avgAttendeesPerEvent}

Create meaningful segments with actionable suggestions. Format as JSON:
{
  "segments": [
    {
      "name": "Segment Name",
      "description": "Why this segment matters",
      "memberEmails": ["email1@example.com", "email2@example.com"],
      "suggestions": ["Action 1", "Action 2"]
    }
  ]
}

Only output the JSON, no other text.`,
        },
      ],
    })

    // Extract and parse response
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    let parsed: { segments: Array<{ name: string; description: string; memberEmails: string[]; suggestions: string[] }> }
    try {
      let jsonStr = textContent.text.trim()
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
      jsonStr = jsonStr.trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      // Fallback segmentation
      parsed = {
        segments: [
          {
            name: 'Super Regulars',
            description: 'Members who attend most frequently',
            memberEmails: context.topRegulars.slice(0, 5).map(r => r.email),
            suggestions: ['Thank them personally', 'Ask for feedback', 'Invite them to help promote'],
          },
          {
            name: 'At Risk',
            description: 'Previously active members who may be drifting away',
            memberEmails: context.atRiskMembers.slice(0, 5).map(m => m.email),
            suggestions: ['Send a personal check-in', 'Share upcoming events', 'Ask what they\'d like to see'],
          },
        ],
      }
    }

    // Build member lookup
    const allMembers = new Map<string, { name: string | null; attendanceCount: number; lastAttendedDate: string | null }>()

    for (const regular of context.topRegulars) {
      allMembers.set(regular.email, {
        name: regular.name,
        attendanceCount: regular.attendanceCount,
        lastAttendedDate: null,
      })
    }

    for (const atRisk of context.atRiskMembers) {
      const existing = allMembers.get(atRisk.email)
      allMembers.set(atRisk.email, {
        name: atRisk.name,
        attendanceCount: existing?.attendanceCount || atRisk.totalAttendance,
        lastAttendedDate: null, // Calculate from daysSinceLastAttended if needed
      })
    }

    // Map segments with full member data
    const segments: AttendeeSegment[] = parsed.segments.map(seg => ({
      name: seg.name,
      description: seg.description,
      count: seg.memberEmails.length,
      members: seg.memberEmails
        .filter(email => allMembers.has(email))
        .map(email => {
          const member = allMembers.get(email)!
          return {
            email,
            name: member.name,
            attendanceCount: member.attendanceCount,
            lastAttendedDate: member.lastAttendedDate,
          }
        }),
      suggestions: seg.suggestions,
    }))

    const result: SegmentationResult = {
      segments,
      totalAttendees: context.totalAttendees,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Segmentation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate segments' },
      { status: 500 }
    )
  }
}
