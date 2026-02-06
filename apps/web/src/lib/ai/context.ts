import { prisma } from '@/lib/prisma'
import type { AgentContext } from './client'

/**
 * Build comprehensive context about an organizer for AI agent use.
 * This gathers all relevant data about their events, attendees, and activity.
 */
export async function buildAgentContext(organizerId: string): Promise<AgentContext> {
  // Fetch organizer with their events
  const organizer = await prisma.organizer.findUnique({
    where: { id: organizerId },
  })

  if (!organizer) {
    throw new Error('Organizer not found')
  }

  // Get all events for this organizer (by Instagram handle or email)
  const events = await prisma.eventSubmission.findMany({
    where: {
      OR: [
        { organizerInstagram: organizer.instagramHandle },
        { contactEmail: organizer.email },
      ],
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
  })

  const eventIds = events.map(e => e.id)

  // Get all attendance records for these events
  const allAttendees = eventIds.length > 0
    ? await prisma.eventAttendance.findMany({
        where: {
          eventId: { in: eventIds },
        },
        orderBy: { timestamp: 'desc' },
      })
    : []

  // Calculate unique attendees
  const uniqueEmails = new Set(allAttendees.map(a => a.email))

  // Get recent activity (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const recentActivity = allAttendees
    .filter(a => new Date(a.timestamp) > weekAgo)
    .slice(0, 10)
    .map(a => {
      const event = events.find(e => e.id === a.eventId)
      return {
        type: a.paymentStatus === 'paid' ? 'paid' : 'rsvp',
        attendeeName: a.name || a.email.split('@')[0],
        eventName: event?.eventName || a.eventName || 'Event',
        timestamp: a.timestamp.toISOString(),
      }
    })

  // Calculate attendance counts per email
  const attendanceCounts: Record<string, { name: string; email: string; count: number; lastDate: Date | null }> = {}

  allAttendees.forEach(a => {
    const key = a.email
    if (!attendanceCounts[key]) {
      attendanceCounts[key] = {
        name: a.name || a.email.split('@')[0],
        email: a.email,
        count: 0,
        lastDate: null,
      }
    }
    attendanceCounts[key].count++
    const attendeeDate = new Date(a.timestamp)
    if (!attendanceCounts[key].lastDate || attendeeDate > attendanceCounts[key].lastDate) {
      attendanceCounts[key].lastDate = attendeeDate
    }
  })

  // Top regulars (most attendance)
  const topRegulars = Object.values(attendanceCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      email: r.email,
      attendanceCount: r.count,
    }))

  // At-risk members (attended 2+ times but not in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const now = new Date()

  const atRiskMembers = Object.values(attendanceCounts)
    .filter(a => {
      if (a.count < 2) return false // Must have attended at least twice
      if (!a.lastDate) return false
      return a.lastDate < thirtyDaysAgo
    })
    .map(a => ({
      name: a.name,
      email: a.email,
      daysSinceLastAttended: a.lastDate
        ? Math.floor((now.getTime() - a.lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999,
      totalAttendance: a.count,
    }))
    .sort((a, b) => a.daysSinceLastAttended - b.daysSinceLastAttended)
    .slice(0, 5)

  // Upcoming events (events with future dates)
  const upcomingEvents = events
    .filter(e => e.eventDate && new Date(e.eventDate) > now)
    .slice(0, 5)
    .map(e => {
      const goingCount = allAttendees.filter(a => a.eventId === e.id).length
      return {
        id: e.id,
        name: e.eventName,
        date: e.eventDate?.toISOString() || '',
        day: e.day,
        time: e.time,
        goingCount,
      }
    })

  // Calculate stats
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const thisWeekRsvps = allAttendees.filter(a => new Date(a.timestamp) > weekAgo).length
  const lastWeekRsvps = allAttendees.filter(a => {
    const date = new Date(a.timestamp)
    return date > twoWeeksAgo && date <= weekAgo
  }).length

  // Calculate total earnings from paid attendances
  const totalEarnings = allAttendees
    .filter(a => a.paymentStatus === 'paid' && a.paymentAmount)
    .reduce((sum, a) => sum + (a.paymentAmount || 0), 0)

  // Average attendees per event
  const avgAttendeesPerEvent = events.length > 0
    ? Math.round(allAttendees.length / events.length)
    : 0

  return {
    organizerId,
    organizerName: organizer.name || organizer.instagramHandle,
    organizerEmail: organizer.email,
    instagramHandle: organizer.instagramHandle,
    totalEvents: events.length,
    totalAttendees: uniqueEmails.size,
    recentActivity,
    topRegulars,
    atRiskMembers,
    upcomingEvents,
    stats: {
      thisWeekRsvps,
      lastWeekRsvps,
      totalEarnings,
      avgAttendeesPerEvent,
    },
  }
}

/**
 * Get a simplified context summary for chat messages.
 * Includes key stats without full lists.
 */
export function formatContextForChat(context: AgentContext): string {
  const lines = [
    `Host: ${context.organizerName} (@${context.instagramHandle})`,
    `Total events: ${context.totalEvents}`,
    `Total unique attendees: ${context.totalAttendees}`,
    `This week's RSVPs: ${context.stats.thisWeekRsvps}`,
    `Last week's RSVPs: ${context.stats.lastWeekRsvps}`,
    `Avg attendees per event: ${context.stats.avgAttendeesPerEvent}`,
  ]

  if (context.topRegulars.length > 0) {
    lines.push(`Top regulars: ${context.topRegulars.map(r => `${r.name} (${r.attendanceCount})`).join(', ')}`)
  }

  if (context.atRiskMembers.length > 0) {
    lines.push(`At-risk members: ${context.atRiskMembers.map(m => `${m.name} (${m.daysSinceLastAttended}d)`).join(', ')}`)
  }

  if (context.upcomingEvents.length > 0) {
    lines.push(`Upcoming events: ${context.upcomingEvents.map(e => `${e.name} (${e.goingCount} going)`).join(', ')}`)
  }

  return lines.join('\n')
}

/**
 * Format context for weekly pulse generation.
 */
export function formatContextForPulse(context: AgentContext): string {
  const sections: string[] = []

  sections.push(`Host: ${context.organizerName}`)
  sections.push(`Community: @${context.instagramHandle}`)
  sections.push(`Total Events: ${context.totalEvents}`)
  sections.push(`Total Unique Attendees: ${context.totalAttendees}`)
  sections.push('')

  sections.push('📊 This Week vs Last Week:')
  sections.push(`- This week RSVPs: ${context.stats.thisWeekRsvps}`)
  sections.push(`- Last week RSVPs: ${context.stats.lastWeekRsvps}`)
  const change = context.stats.thisWeekRsvps - context.stats.lastWeekRsvps
  if (change > 0) {
    sections.push(`- Trend: +${change} (growing!)`)
  } else if (change < 0) {
    sections.push(`- Trend: ${change} (slight dip)`)
  } else {
    sections.push(`- Trend: Steady`)
  }
  sections.push('')

  if (context.recentActivity.length > 0) {
    sections.push('⚡ Recent Activity (last 7 days):')
    context.recentActivity.forEach(a => {
      sections.push(`- ${a.attendeeName} ${a.type === 'paid' ? 'paid for' : 'joined'} ${a.eventName}`)
    })
  } else {
    sections.push('⚡ Recent Activity: No new RSVPs this week')
  }
  sections.push('')

  if (context.topRegulars.length > 0) {
    sections.push('⭐ Top Regulars:')
    context.topRegulars.forEach((r, i) => {
      sections.push(`${i + 1}. ${r.name}: ${r.attendanceCount} events attended`)
    })
  } else {
    sections.push('⭐ Top Regulars: Building your community...')
  }
  sections.push('')

  if (context.upcomingEvents.length > 0) {
    sections.push('📅 Upcoming Events:')
    context.upcomingEvents.forEach(e => {
      sections.push(`- ${e.name} (${e.day} ${e.time}): ${e.goingCount} going`)
    })
  } else {
    sections.push('📅 Upcoming Events: None scheduled')
  }
  sections.push('')

  if (context.atRiskMembers.length > 0) {
    sections.push('⚠️ At-Risk Members (haven\'t attended recently):')
    context.atRiskMembers.forEach(m => {
      sections.push(`- ${m.name}: ${m.daysSinceLastAttended} days since last event (attended ${m.totalAttendance} total)`)
    })
  } else {
    sections.push('⚠️ At-Risk Members: Everyone is engaged!')
  }

  return sections.join('\n')
}
