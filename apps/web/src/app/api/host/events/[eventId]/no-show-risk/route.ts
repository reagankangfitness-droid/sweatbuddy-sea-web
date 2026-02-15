import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface AttendeeRisk {
  id: string
  name: string | null
  email: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  factors: string[]
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
      select: {
        organizerInstagram: true,
        eventDate: true,
        isFree: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current event attendees
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        email: true,
        paymentStatus: true,
        timestamp: true,
      },
    })

    if (attendees.length === 0) {
      return NextResponse.json({
        attendees: [],
        aggregatePrediction: { expectedAttendance: 0, expectedNoShows: 0 },
      })
    }

    // Get all host's events for historical data
    const hostEvents = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        status: { in: ['APPROVED', 'CANCELLED'] },
        id: { not: eventId },
      },
      select: { id: true },
    })

    const hostEventIds = hostEvents.map(e => e.id)

    // Get historical attendance data for each attendee
    const attendeeEmails = attendees.map(a => a.email)
    const historicalAttendance = hostEventIds.length > 0
      ? await prisma.eventAttendance.findMany({
          where: {
            eventId: { in: hostEventIds },
            email: { in: attendeeEmails },
          },
          select: {
            email: true,
            actuallyAttended: true,
          },
        })
      : []

    // Build per-email stats
    const emailStats = new Map<string, { total: number; noShows: number; attended: number }>()
    for (const record of historicalAttendance) {
      const stats = emailStats.get(record.email) || { total: 0, noShows: 0, attended: 0 }
      stats.total++
      if (record.actuallyAttended === false) stats.noShows++
      if (record.actuallyAttended === true) stats.attended++
      emailStats.set(record.email, stats)
    }

    // Calculate risk for each attendee
    const now = new Date()
    const riskResults: AttendeeRisk[] = attendees.map(attendee => {
      let riskScore = 20 // Base risk
      const factors: string[] = []

      // Factor 1: Historical no-show rate
      const history = emailStats.get(attendee.email)
      if (history && history.total > 0) {
        const noShowRate = history.noShows / history.total
        if (noShowRate > 0.5) {
          riskScore += 35
          factors.push(`${Math.round(noShowRate * 100)}% past no-show rate`)
        } else if (noShowRate > 0.2) {
          riskScore += 20
          factors.push(`${Math.round(noShowRate * 100)}% past no-show rate`)
        } else if (noShowRate === 0 && history.attended > 0) {
          riskScore -= 15
          factors.push('Reliable attendee - no past no-shows')
        }
      } else {
        riskScore += 10
        factors.push('First-time attendee - no history')
      }

      // Factor 2: Free vs paid
      if (attendee.paymentStatus === 'free' || !attendee.paymentStatus) {
        riskScore += 15
        factors.push('Free event (higher no-show tendency)')
      } else if (attendee.paymentStatus === 'paid') {
        riskScore -= 10
        factors.push('Paid attendee (lower no-show risk)')
      }

      // Factor 3: Registration lead time
      const registeredAt = new Date(attendee.timestamp)
      const daysBeforeEvent = event.eventDate
        ? (event.eventDate.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24)
        : null

      if (daysBeforeEvent !== null) {
        if (daysBeforeEvent < 1) {
          riskScore += 10
          factors.push('Same-day registration')
        } else if (daysBeforeEvent > 7) {
          riskScore += 5
          factors.push('Registered far in advance')
        }
      }

      // Clamp score 0-100
      riskScore = Math.max(0, Math.min(100, riskScore))

      const riskLevel: 'low' | 'medium' | 'high' =
        riskScore <= 30 ? 'low' : riskScore <= 60 ? 'medium' : 'high'

      return {
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        riskScore,
        riskLevel,
        factors,
      }
    })

    // Aggregate prediction
    const avgRisk = riskResults.reduce((sum, r) => sum + r.riskScore, 0) / riskResults.length
    const expectedNoShowRate = avgRisk / 100
    const expectedNoShows = Math.round(attendees.length * expectedNoShowRate)
    const expectedAttendance = attendees.length - expectedNoShows

    return NextResponse.json({
      attendees: riskResults,
      aggregatePrediction: {
        expectedAttendance,
        expectedNoShows,
        avgRiskScore: Math.round(avgRisk),
      },
    })
  } catch (error) {
    console.error('No-show risk error:', error)
    return NextResponse.json({ error: 'Failed to calculate risk scores' }, { status: 500 })
  }
}
