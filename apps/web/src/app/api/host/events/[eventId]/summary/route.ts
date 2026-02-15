import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { anthropic, AGENT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const GENERATION_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

async function generateEventSummary(eventId: string, hostInstagram: string) {
  // Get event details
  const event = await prisma.eventSubmission.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      eventName: true,
      category: true,
      day: true,
      eventDate: true,
      time: true,
      location: true,
      price: true,
      isFree: true,
      maxTickets: true,
      organizerInstagram: true,
    },
  })

  if (!event) throw new Error('Event not found')

  // Get attendees
  const attendees = await prisma.eventAttendance.findMany({
    where: { eventId },
    select: {
      id: true,
      name: true,
      email: true,
      paymentStatus: true,
      paymentAmount: true,
      actuallyAttended: true,
      checkedInAt: true,
      timestamp: true,
    },
  })

  // Get reviews
  const reviews = await prisma.eventReview.findMany({
    where: { eventId },
    select: { rating: true, content: true },
  })

  // Get transactions
  const transactions = await prisma.eventTransaction.findMany({
    where: { eventSubmissionId: eventId, status: 'SUCCEEDED' },
    select: { totalCharged: true, netPayoutToHost: true },
  })

  // Get host's other events for comparison
  const otherEvents = await prisma.eventSubmission.findMany({
    where: {
      organizerInstagram: hostInstagram,
      status: { in: ['APPROVED', 'CANCELLED'] },
      id: { not: eventId },
    },
    select: { id: true },
  })

  const otherEventIds = otherEvents.map(e => e.id)
  const otherAttendanceCounts = otherEventIds.length > 0
    ? await prisma.eventAttendance.groupBy({
        by: ['eventId'],
        _count: { id: true },
        where: { eventId: { in: otherEventIds } },
      })
    : []

  // Calculate metrics
  const totalAttendees = attendees.length
  const checkedIn = attendees.filter(a => a.checkedInAt).length
  const attended = attendees.filter(a => a.actuallyAttended === true).length
  const noShows = attendees.filter(a => a.actuallyAttended === false).length
  const paidCount = attendees.filter(a => a.paymentStatus === 'paid').length
  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalCharged, 0)
  const hostPayout = transactions.reduce((sum, t) => sum + t.netPayoutToHost, 0)
  const fillRate = event.maxTickets ? Math.round((totalAttendees / event.maxTickets) * 100) : null
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null
  const showUpRate = totalAttendees > 0 ? Math.round((attended / totalAttendees) * 100) : null
  const avgAttendanceOther = otherAttendanceCounts.length > 0
    ? Math.round(otherAttendanceCounts.reduce((sum, c) => sum + c._count.id, 0) / otherAttendanceCounts.length)
    : null

  const contextStr = `
Event: ${event.eventName}
Category: ${event.category}
Date: ${event.eventDate?.toISOString().split('T')[0] || event.day} at ${event.time}
Location: ${event.location}
Price: ${event.isFree ? 'Free' : `$${((event.price || 0) / 100).toFixed(2)}`}
Max Capacity: ${event.maxTickets || 'Unlimited'}

METRICS:
- Total RSVPs: ${totalAttendees}
- Checked In: ${checkedIn}
- Actually Attended: ${attended}
- No-shows: ${noShows} (${showUpRate !== null ? `${100 - showUpRate}% no-show rate` : 'not tracked'})
- Fill Rate: ${fillRate !== null ? `${fillRate}%` : 'N/A'}
- Paid Attendees: ${paidCount}
- Total Revenue: $${(totalRevenue / 100).toFixed(2)}
- Host Payout: $${(hostPayout / 100).toFixed(2)}
- Average Rating: ${avgRating || 'No reviews yet'} (${reviews.length} reviews)
${reviews.length > 0 ? `- Review comments: ${reviews.filter(r => r.content).map(r => `"${r.content}"`).join(', ')}` : ''}

COMPARISON TO HOST AVERAGE:
- Avg attendance across other events: ${avgAttendanceOther || 'First event'}
- This event: ${totalAttendees} attendees
${avgAttendanceOther ? `- ${totalAttendees > avgAttendanceOther ? 'Above' : 'Below'} average by ${Math.abs(totalAttendees - avgAttendanceOther)}` : ''}
`

  const response = await anthropic.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1500,
    system: `You are a friendly post-event analyst for SweatBuddies, a fitness community platform. Generate an encouraging, data-driven post-event summary. Be warm but specific with data. Always find positives while being honest about areas for improvement.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this event and generate a post-event summary:

${contextStr}

Generate a JSON response with:
{
  "summary": "2-3 sentence narrative summary highlighting the key takeaway",
  "highlights": ["3-4 specific wins or positive moments"],
  "insights": ["2-3 data-driven observations about this event"],
  "suggestions": ["2-3 actionable improvements for next time"],
  "metrics": {
    "attendance": ${totalAttendees},
    "revenue": ${totalRevenue},
    "fillRate": ${fillRate || 0},
    "rating": ${avgRating || 0},
    "showUpRate": ${showUpRate || 0},
    "noShows": ${noShows}
  },
  "comparedToAverage": {
    "attendanceVsAvg": "${avgAttendanceOther ? (totalAttendees > avgAttendanceOther ? 'above' : 'below') : 'first_event'}",
    "difference": ${avgAttendanceOther ? Math.abs(totalAttendees - avgAttendanceOther) : 0}
  }
}

Only output JSON, no other text.`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')

  let jsonStr = textContent.text.trim()
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
  jsonStr = jsonStr.trim()

  return JSON.parse(jsonStr)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Verify host owns event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { organizerInstagram: true, eventName: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for cached summary
    const existing = await prisma.eventSummary.findUnique({
      where: { eventSubmissionId: eventId },
    })

    if (existing) {
      return NextResponse.json({ summary: existing, cached: true })
    }

    // Generate new summary
    const generated = await generateEventSummary(eventId, session.instagramHandle)

    const saved = await prisma.eventSummary.create({
      data: {
        eventSubmissionId: eventId,
        summary: generated.summary || '',
        highlights: generated.highlights || [],
        metrics: generated.metrics || {},
        insights: generated.insights || [],
        suggestions: generated.suggestions || [],
        comparedToAverage: generated.comparedToAverage || null,
      },
    })

    return NextResponse.json({ summary: saved, cached: false })
  } catch (error) {
    console.error('Event summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { organizerInstagram: true },
    })

    if (!event || event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit check
    const existing = await prisma.eventSummary.findUnique({
      where: { eventSubmissionId: eventId },
    })

    if (existing) {
      const timeSince = Date.now() - existing.generatedAt.getTime()
      if (timeSince < GENERATION_COOLDOWN_MS) {
        const minutesRemaining = Math.ceil((GENERATION_COOLDOWN_MS - timeSince) / (60 * 1000))
        return NextResponse.json(
          { error: `Rate limited. Try again in ${minutesRemaining} minutes.` },
          { status: 429 }
        )
      }

      await prisma.eventSummary.delete({ where: { id: existing.id } })
    }

    const generated = await generateEventSummary(eventId, session.instagramHandle)

    const saved = await prisma.eventSummary.create({
      data: {
        eventSubmissionId: eventId,
        summary: generated.summary || '',
        highlights: generated.highlights || [],
        metrics: generated.metrics || {},
        insights: generated.insights || [],
        suggestions: generated.suggestions || [],
        comparedToAverage: generated.comparedToAverage || null,
        regeneratedCount: (existing?.regeneratedCount || 0) + 1,
      },
    })

    return NextResponse.json({ summary: saved, regenerated: true })
  } catch (error) {
    console.error('Summary regeneration error:', error)
    return NextResponse.json({ error: 'Failed to regenerate summary' }, { status: 500 })
  }
}
