import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const COLD_THRESHOLD_DAYS = 21 // 3 weeks
const MIN_ATTENDANCE = 2
const COOLDOWN_DAYS = 14
const MAX_MEMBERS = 10

/**
 * GET /api/host/reengagement
 * Returns cold members who attended 2+ events but haven't been back in 3+ weeks.
 * Includes cooldown status (whether a nudge was sent in the last 14 days).
 */
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instagramHandle = session.instagramHandle
    const userId = session.userId

    // Get all approved events for this host
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

    const events = await prisma.eventSubmission.findMany({
      where: whereClause,
      select: { id: true, eventDate: true },
    })

    const eventIds = events.map((e) => e.id)
    if (eventIds.length === 0) {
      return NextResponse.json({ members: [] })
    }

    // Find attendees with 2+ attendances
    const regulars = await prisma.eventAttendance.groupBy({
      by: ['email'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
      having: { id: { _count: { gte: MIN_ATTENDANCE } } },
    })

    if (regulars.length === 0) {
      return NextResponse.json({ members: [] })
    }

    const regularEmails = regulars.map((r) => r.email.toLowerCase())

    // Get most recent attendance per email
    const now = new Date()
    const allAttendances = await prisma.eventAttendance.findMany({
      where: {
        email: { in: regularEmails, mode: 'insensitive' },
        eventId: { in: eventIds },
      },
      orderBy: { timestamp: 'desc' },
      select: { email: true, name: true, timestamp: true },
    })

    // Group by email → most recent
    const lastSeen = new Map<string, { name: string | null; timestamp: Date }>()
    for (const a of allAttendances) {
      const key = a.email.toLowerCase()
      if (!lastSeen.has(key)) {
        lastSeen.set(key, { name: a.name, timestamp: a.timestamp })
      }
    }

    // Filter to cold members (inactive 21+ days)
    const coldThreshold = new Date(now.getTime() - COLD_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)
    const coldMembers: Array<{
      email: string
      name: string | null
      attendanceCount: number
      lastSeenDate: string
      daysSinceLastSeen: number
    }> = []

    for (const regular of regulars) {
      const key = regular.email.toLowerCase()
      const info = lastSeen.get(key)
      if (!info) continue
      if (info.timestamp > coldThreshold) continue // Still active

      const daysSince = Math.floor(
        (now.getTime() - info.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      )

      coldMembers.push({
        email: regular.email,
        name: info.name,
        attendanceCount: regular._count.id,
        lastSeenDate: info.timestamp.toISOString().split('T')[0],
        daysSinceLastSeen: daysSince,
      })
    }

    // Sort by most days inactive, limit to 10
    coldMembers.sort((a, b) => b.daysSinceLastSeen - a.daysSinceLastSeen)
    const limited = coldMembers.slice(0, MAX_MEMBERS)

    if (limited.length === 0) {
      return NextResponse.json({ members: [] })
    }

    // Check cooldown: find nudges sent in the last 14 days for these emails
    const cooldownCutoff = new Date(now.getTime() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    const recentNudges = await prisma.reengagementNudge.findMany({
      where: {
        organizerInstagram: { equals: instagramHandle, mode: 'insensitive' },
        recipientEmail: { in: limited.map((m) => m.email), mode: 'insensitive' },
        sentAt: { gte: cooldownCutoff },
      },
      select: { recipientEmail: true, sentAt: true },
    })

    const cooldownMap = new Map<string, string>()
    for (const nudge of recentNudges) {
      cooldownMap.set(nudge.recipientEmail.toLowerCase(), nudge.sentAt.toISOString())
    }

    // Check if host has any upcoming events (for context in nudge message)
    const upcomingEvent = await prisma.eventSubmission.findFirst({
      where: {
        ...whereClause,
        eventDate: { gte: now },
      },
      orderBy: { eventDate: 'asc' },
      select: { id: true, eventName: true, eventDate: true, slug: true },
    })

    const members = limited.map((m) => ({
      ...m,
      onCooldown: cooldownMap.has(m.email.toLowerCase()),
      lastNudgedAt: cooldownMap.get(m.email.toLowerCase()) || null,
    }))

    return NextResponse.json({
      members,
      upcomingEvent: upcomingEvent
        ? {
            id: upcomingEvent.id,
            name: upcomingEvent.eventName,
            date: upcomingEvent.eventDate?.toISOString().split('T')[0] || null,
            slug: upcomingEvent.slug,
          }
        : null,
    })
  } catch (error) {
    console.error('Reengagement API error:', error)
    return NextResponse.json({ error: 'Failed to fetch cold members' }, { status: 500 })
  }
}
