import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  getCategoryContext,
  COMMUNITY_TYPE_CONTEXT,
} from '@/lib/ai'
import type { CommunityType } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const GROWTH_SYSTEM_PROMPT = `You are a growth strategist AI for SweatBuddies, helping fitness community hosts grow their communities in Singapore.

You analyze community data and provide specific, actionable growth recommendations.

Guidelines:
- Be specific with numbers and actions
- Prioritize low-effort, high-impact ideas
- Consider Singapore's fitness culture and popular locations
- Reference the host's actual data when relevant
- Keep recommendations practical and doable this week
- If community type is provided, tailor suggestions to that specific activity
- Focus on retention, acquisition, and engagement strategies`

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
 * GET /api/host/growth
 * Get AI-powered growth recommendations
 */
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)

    // Get full organizer data with community type
    const fullOrganizer = await prisma.organizer.findUnique({
      where: { id: organizer.id },
      select: {
        communityType: true,
        communityName: true,
        communityLocation: true,
        communitySize: true,
      },
    })

    // Build context
    const context = await buildAgentContext(organizer.id)

    // Calculate growth metrics
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Get events for this organizer
    const events = await prisma.eventSubmission.findMany({
      where: {
        OR: [
          { organizerInstagram: organizer.instagramHandle },
          { contactEmail: organizer.email },
        ],
        status: 'APPROVED',
      },
    })

    const eventIds = events.map(e => e.id)

    // Get attendance data
    const allAttendees = eventIds.length > 0
      ? await prisma.eventAttendance.findMany({
          where: { eventId: { in: eventIds } },
        })
      : []

    // Recent vs previous period comparison
    const recentAttendees = allAttendees.filter(a => new Date(a.timestamp) > thirtyDaysAgo)
    const previousAttendees = allAttendees.filter(a => {
      const date = new Date(a.timestamp)
      return date > sixtyDaysAgo && date <= thirtyDaysAgo
    })

    // Calculate metrics
    const recentUniqueEmails = new Set(recentAttendees.map(a => a.email))
    const previousUniqueEmails = new Set(previousAttendees.map(a => a.email))

    // New members (in recent but not in previous)
    const newMembers = [...recentUniqueEmails].filter(e => !previousUniqueEmails.has(e)).length

    // Churned members (in previous but not in recent)
    const churnedMembers = [...previousUniqueEmails].filter(e => !recentUniqueEmails.has(e)).length

    // Growth rate
    const previousCount = previousUniqueEmails.size || 1
    const growthRate = ((recentUniqueEmails.size - previousCount) / previousCount) * 100

    // Retention rate
    const returningMembers = [...recentUniqueEmails].filter(e => previousUniqueEmails.has(e)).length
    const retentionRate = previousUniqueEmails.size > 0
      ? (returningMembers / previousUniqueEmails.size) * 100
      : 0

    const metrics = {
      totalMembers: new Set(allAttendees.map(a => a.email)).size,
      activeMembers: recentUniqueEmails.size,
      newMembersLast30Days: newMembers,
      churnedMembersLast30Days: churnedMembers,
      growthRateLast30Days: Math.round(growthRate * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      avgAttendeesPerEvent: context.stats.avgAttendeesPerEvent,
      totalEvents: context.totalEvents,
    }

    // Get category-specific context
    const communityType = fullOrganizer?.communityType as CommunityType
    const categoryContext = communityType ? getCategoryContext(communityType) : ''
    const categoryData = communityType ? COMMUNITY_TYPE_CONTEXT[communityType] : null

    // Build AI prompt for growth recommendations
    const prompt = `Analyze this fitness community and provide growth recommendations:

Host: ${context.organizerName} (@${context.instagramHandle})
${fullOrganizer?.communityName ? `Community Name: ${fullOrganizer.communityName}` : ''}
${fullOrganizer?.communityType ? `Community Type: ${fullOrganizer.communityType}` : ''}
${fullOrganizer?.communityLocation ? `Location: ${fullOrganizer.communityLocation}` : ''}
${fullOrganizer?.communitySize ? `Size Category: ${fullOrganizer.communitySize}` : ''}

METRICS:
- Total unique members: ${metrics.totalMembers}
- Active members (last 30 days): ${metrics.activeMembers}
- New members (last 30 days): ${metrics.newMembersLast30Days}
- Churned members (last 30 days): ${metrics.churnedMembersLast30Days}
- Growth rate: ${metrics.growthRateLast30Days}%
- Retention rate: ${metrics.retentionRate}%
- Total events hosted: ${metrics.totalEvents}
- Average attendees per event: ${metrics.avgAttendeesPerEvent}

${context.topRegulars.length > 0 ? `Top Regulars: ${context.topRegulars.map(r => `${r.name} (${r.attendanceCount} events)`).join(', ')}` : ''}

${context.atRiskMembers.length > 0 ? `At-Risk Members: ${context.atRiskMembers.map(m => `${m.name} (${m.daysSinceLastAttended} days since last event)`).join(', ')}` : ''}

${categoryContext}

Provide exactly 4 growth recommendations in this JSON format:
{
  "recommendations": [
    {
      "title": "Short action title (5 words max)",
      "description": "2-3 sentence explanation of what to do and why it will help",
      "priority": "high" | "medium" | "low",
      "category": "acquisition" | "retention" | "engagement" | "monetization",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high"
    }
  ],
  "summary": "One sentence summary of the community's current growth status"
}

Focus on their specific situation. If they have at-risk members, prioritize retention. If they're new, prioritize acquisition. Be specific to their community type.`

    // Generate recommendations with AI
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 1500,
      system: GROWTH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response from AI')
    }

    // Parse AI response
    let aiResponse
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // Fallback recommendations
      aiResponse = {
        recommendations: [
          {
            title: 'Post more consistently',
            description: 'Share weekly updates about your community on Instagram to stay top of mind.',
            priority: 'high',
            category: 'engagement',
            effort: 'low',
            impact: 'medium',
          },
          {
            title: 'Reach out to at-risk members',
            description: 'Send personal messages to members who haven\'t attended recently.',
            priority: 'high',
            category: 'retention',
            effort: 'medium',
            impact: 'high',
          },
          {
            title: 'Partner with local businesses',
            description: 'Connect with cafes or fitness stores for cross-promotion opportunities.',
            priority: 'medium',
            category: 'acquisition',
            effort: 'medium',
            impact: 'medium',
          },
          {
            title: 'Create a referral incentive',
            description: 'Encourage members to bring friends with small rewards or recognition.',
            priority: 'medium',
            category: 'acquisition',
            effort: 'low',
            impact: 'high',
          },
        ],
        summary: 'Focus on consistent engagement and member retention to build momentum.',
      }
    }

    return NextResponse.json({
      metrics,
      recommendations: aiResponse.recommendations,
      summary: aiResponse.summary,
      categoryTips: categoryData?.growthTips || [],
      communityType: fullOrganizer?.communityType || null,
    })
  } catch (error) {
    console.error('Growth API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate growth recommendations' },
      { status: 500 }
    )
  }
}
