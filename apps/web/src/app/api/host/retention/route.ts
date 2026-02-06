import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  RETENTION_SYSTEM_PROMPT,
} from '@/lib/ai'

export const dynamic = 'force-dynamic'

interface AtRiskMember {
  email: string
  name: string | null
  totalAttendance: number
  daysSinceLastAttended: number
}

interface RetentionAlert {
  member: AtRiskMember
  riskLevel: 'low' | 'medium' | 'high'
  suggestion: string
  messageTemplate: string
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
 * GET /api/host/retention
 * Get at-risk members with AI-powered outreach suggestions
 */
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const context = await buildAgentContext(organizer.id)

    // If no at-risk members, return empty
    if (context.atRiskMembers.length === 0) {
      return NextResponse.json({
        alerts: [],
        totalAtRisk: 0,
        generatedAt: new Date().toISOString(),
      })
    }

    // Generate AI suggestions for each at-risk member
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 2000,
      system: RETENTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate personalized re-engagement suggestions for these at-risk community members.

Host: ${context.organizerName} (@${context.instagramHandle})

At-Risk Members:
${context.atRiskMembers.map((m, i) => `
${i + 1}. ${m.name || m.email}
   - Email: ${m.email}
   - Total events attended: ${m.totalAttendance}
   - Last attended: ${m.daysSinceLastAttended} days ago
`).join('\n')}

Upcoming Events:
${context.upcomingEvents.map(e => `- ${e.name} (${e.day} ${e.time})`).join('\n')}

For each member, provide:
1. Risk level (low/medium/high based on attendance history and days since last visit)
2. A brief suggestion for the host
3. A ready-to-send message template

Format as JSON:
{
  "alerts": [
    {
      "email": "member@email.com",
      "riskLevel": "medium",
      "suggestion": "Brief suggestion for host",
      "messageTemplate": "Hey [Name]! Ready-to-send message..."
    }
  ]
}

Only output the JSON.`,
        },
      ],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    let parsed: { alerts: Array<{ email: string; riskLevel: 'low' | 'medium' | 'high'; suggestion: string; messageTemplate: string }> }
    try {
      let jsonStr = textContent.text.trim()
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
      jsonStr = jsonStr.trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      // Fallback: generate basic alerts
      parsed = {
        alerts: context.atRiskMembers.slice(0, 5).map(m => ({
          email: m.email,
          riskLevel: m.daysSinceLastAttended > 30 ? 'high' : m.daysSinceLastAttended > 14 ? 'medium' : 'low' as 'low' | 'medium' | 'high',
          suggestion: `${m.name || 'This member'} hasn't attended in ${m.daysSinceLastAttended} days. Send a personal message to check in.`,
          messageTemplate: `Hey ${m.name || 'there'}! We've missed you at our recent sessions. Would love to see you at our next event!`,
        })),
      }
    }

    // Build member lookup
    const memberMap = new Map(context.atRiskMembers.map(m => [m.email, m]))

    // Map alerts with full member data
    const alerts: RetentionAlert[] = parsed.alerts
      .filter(a => memberMap.has(a.email))
      .map(a => ({
        member: memberMap.get(a.email)!,
        riskLevel: a.riskLevel,
        suggestion: a.suggestion,
        messageTemplate: a.messageTemplate,
      }))

    return NextResponse.json({
      alerts,
      totalAtRisk: context.atRiskMembers.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Retention alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to generate retention alerts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/host/retention
 * Record an action taken for an at-risk member
 */
export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const { memberEmail, memberName, action, suggestion, message } = await request.json()

    if (!memberEmail || !action || !suggestion) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Record the action
    const retentionAction = await prisma.retentionAction.create({
      data: {
        organizerId: organizer.id,
        memberEmail,
        memberName: memberName || null,
        action, // 'message_sent', 'dismissed', 'email_sent'
        suggestion,
        message: message || null,
      },
    })

    return NextResponse.json({
      id: retentionAction.id,
      success: true,
    })
  } catch (error) {
    console.error('Retention action error:', error)
    return NextResponse.json(
      { error: 'Failed to record action' },
      { status: 500 }
    )
  }
}
