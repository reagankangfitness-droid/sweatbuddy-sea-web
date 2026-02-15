import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { anthropic, AGENT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all host's events with pricing
    const events = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        status: { in: ['APPROVED', 'CANCELLED'] },
      },
      select: {
        id: true,
        eventName: true,
        price: true,
        isFree: true,
        maxTickets: true,
        category: true,
        day: true,
        time: true,
      },
    })

    const eventIds = events.map(e => e.id)

    // Get attendance counts per event
    const attendanceCounts = eventIds.length > 0
      ? await prisma.eventAttendance.groupBy({
          by: ['eventId'],
          _count: { id: true },
          where: { eventId: { in: eventIds } },
        })
      : []

    // Get transaction data for paid events
    const transactions = eventIds.length > 0
      ? await prisma.eventTransaction.findMany({
          where: { eventSubmissionId: { in: eventIds }, status: 'SUCCEEDED' },
          select: { eventSubmissionId: true, totalCharged: true, netPayoutToHost: true },
        })
      : []

    const countMap = new Map(attendanceCounts.map(c => [c.eventId, c._count.id]))

    const pricingData = events.map(e => ({
      name: e.eventName,
      category: e.category,
      price: e.isFree ? 0 : (e.price || 0),
      maxCapacity: e.maxTickets,
      attendance: countMap.get(e.id) || 0,
      revenue: transactions
        .filter(t => t.eventSubmissionId === e.id)
        .reduce((sum, t) => sum + t.totalCharged, 0),
      day: e.day,
      time: e.time,
    }))

    if (pricingData.length === 0) {
      return NextResponse.json({
        recommendedPrice: null,
        earlyBirdPrice: null,
        optimalCapacity: null,
        insights: ['No past event data to analyze. Start hosting events to get pricing suggestions!'],
      })
    }

    const contextStr = pricingData.map(p =>
      `${p.name}: $${(p.price / 100).toFixed(2)}, ${p.attendance} attendees, $${(p.revenue / 100).toFixed(2)} revenue, ${p.day} ${p.time}`
    ).join('\n')

    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 800,
      system: 'You are a pricing analyst for fitness events. Analyze the host\'s pricing history and provide specific recommendations. Return only JSON.',
      messages: [{
        role: 'user',
        content: `Analyze this host's pricing data and recommend optimal pricing:

${contextStr}

Return JSON:
{
  "recommendedPrice": <cents>,
  "earlyBirdPrice": <cents or null>,
  "optimalCapacity": <number or null>,
  "insights": ["insight1", "insight2", "insight3"]
}

Only output JSON.`,
      }],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response')
    }

    let jsonStr = textContent.text.trim()
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)

    const result = JSON.parse(jsonStr.trim())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json({ error: 'Failed to generate pricing suggestions' }, { status: 500 })
  }
}
