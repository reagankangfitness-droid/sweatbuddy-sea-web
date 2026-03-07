import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/host/community/stats - Community health metrics
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.userId
    const instagramHandle = session.instagramHandle

    const whereClause = userId
      ? {
          OR: [
            { submittedByUserId: userId },
            { organizerInstagram: { equals: instagramHandle, mode: 'insensitive' as const } },
          ],
          status: 'APPROVED' as const,
        }
      : {
          organizerInstagram: { equals: instagramHandle, mode: 'insensitive' as const },
          status: 'APPROVED' as const,
        }

    // Get all host's event IDs
    const hostEvents = await prisma.eventSubmission.findMany({
      where: whereClause,
      select: { id: true },
    })

    const eventIds = hostEvents.map((e) => e.id)

    if (eventIds.length === 0) {
      return NextResponse.json({
        totalMembers: 0,
        activeThisMonth: 0,
        retentionRate: 0,
        newMembers: 0,
      })
    }

    // Get all attendance records
    const allAttendances = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        OR: [
          { paymentStatus: 'paid' },
          { paymentStatus: 'free' },
          { paymentStatus: null },
        ],
      },
      select: {
        email: true,
        timestamp: true,
      },
    })

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Build per-member aggregation
    const memberMap = new Map<string, { firstSeen: Date; lastSeen: Date }>()

    for (const a of allAttendances) {
      const key = a.email.toLowerCase()
      const existing = memberMap.get(key)
      const ts = a.timestamp

      if (existing) {
        if (ts < existing.firstSeen) existing.firstSeen = ts
        if (ts > existing.lastSeen) existing.lastSeen = ts
      } else {
        memberMap.set(key, { firstSeen: ts, lastSeen: ts })
      }
    }

    // Total Members: all unique emails
    const totalMembers = memberMap.size

    // Active This Month: attended at least 1 event in last 30 days
    let activeThisMonth = 0
    // New Members: first attendance in last 30 days
    let newMembers = 0
    // Retention: attended in both current month (last 30d) and previous month (30-60d ago)
    let activeCurrentMonth = 0
    let activePreviousMonth = 0
    let retainedBoth = 0

    for (const [, member] of memberMap) {
      const activeRecently = member.lastSeen >= thirtyDaysAgo
      const activePrev = member.lastSeen >= sixtyDaysAgo && member.firstSeen < thirtyDaysAgo

      if (activeRecently) activeThisMonth++
      if (member.firstSeen >= thirtyDaysAgo) newMembers++

      // For retention calculation
      // Check if this member had any attendance in current period
      if (activeRecently) activeCurrentMonth++
      // Check if they had attendance in previous period (30-60 days ago)
      if (member.firstSeen < thirtyDaysAgo) {
        activePreviousMonth++
        if (activeRecently) retainedBoth++
      }
    }

    // Retention Rate: of members who existed before this month, what % came back this month
    const retentionRate = activePreviousMonth > 0
      ? Math.round((retainedBoth / activePreviousMonth) * 100)
      : 0

    return NextResponse.json({
      totalMembers,
      activeThisMonth,
      retentionRate,
      newMembers,
    })
  } catch (error) {
    console.error('Community stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community stats' },
      { status: 500 }
    )
  }
}
