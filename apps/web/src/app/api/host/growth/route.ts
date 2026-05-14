import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'

export const dynamic = 'force-dynamic'

type Recommendation = {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'acquisition' | 'retention' | 'engagement' | 'monetization'
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
}

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function getCategoryName(slugOrName: string | null | undefined): string | null {
  if (!slugOrName) return null
  const normalized = slugOrName.toLowerCase()
  const category = ACTIVITY_CATEGORIES.find((c) =>
    c.slug === normalized || c.name.toLowerCase() === normalized
  )
  return category?.name || slugOrName
}

export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const hostUserId = session.userId || session.id

    const eventWhere = session.userId
      ? {
          OR: [
            { submittedByUserId: session.userId },
            { organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' as const } },
          ],
          status: 'APPROVED' as const,
        }
      : {
          organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' as const },
          status: 'APPROVED' as const,
        }

    const [activities, eventSubmissions] = await Promise.all([
      prisma.activity.findMany({
        where: {
          OR: [{ userId: hostUserId }, { hostId: hostUserId }],
          status: { in: ['PUBLISHED', 'COMPLETED'] },
          deletedAt: null,
        },
        select: {
          id: true,
          startTime: true,
          categorySlug: true,
          price: true,
          userActivities: {
            where: {
              deletedAt: null,
              status: { in: ['JOINED', 'COMPLETED'] },
            },
            select: {
              userId: true,
              createdAt: true,
              actuallyAttended: true,
              checkedIn: true,
            },
          },
        },
      }),
      prisma.eventSubmission.findMany({
        where: eventWhere,
        select: {
          id: true,
          category: true,
          eventDate: true,
          price: true,
        },
      }),
    ])

    const eventAttendances = eventSubmissions.length > 0
      ? await prisma.eventAttendance.findMany({
          where: { eventId: { in: eventSubmissions.map((event) => event.id) } },
          select: {
            eventId: true,
            email: true,
            timestamp: true,
            actuallyAttended: true,
          },
        })
      : []
    const attendancesByEvent = new Map<string, typeof eventAttendances>()
    for (const attendance of eventAttendances) {
      const list = attendancesByEvent.get(attendance.eventId) || []
      list.push(attendance)
      attendancesByEvent.set(attendance.eventId, list)
    }

    const memberFirstSeen = new Map<string, Date>()
    const activeMembers = new Set<string>()
    let attendedCount = 0
    let rsvpCount = 0
    let paidEvents = 0
    const categoryCounts = new Map<string, number>()

    for (const activity of activities) {
      if (activity.price > 0) paidEvents++
      if (activity.categorySlug) {
        categoryCounts.set(activity.categorySlug, (categoryCounts.get(activity.categorySlug) || 0) + 1)
      }

      for (const rsvp of activity.userActivities) {
        rsvpCount++
        const key = `user:${rsvp.userId}`
        const existing = memberFirstSeen.get(key)
        if (!existing || rsvp.createdAt < existing) memberFirstSeen.set(key, rsvp.createdAt)
        if (rsvp.createdAt >= thirtyDaysAgo) activeMembers.add(key)
        if (rsvp.actuallyAttended || rsvp.checkedIn) attendedCount++
      }
    }

    for (const event of eventSubmissions) {
      if ((event.price || 0) > 0) paidEvents++
      categoryCounts.set(event.category, (categoryCounts.get(event.category) || 0) + 1)

      for (const attendance of attendancesByEvent.get(event.id) || []) {
        rsvpCount++
        const key = `email:${attendance.email.toLowerCase()}`
        const existing = memberFirstSeen.get(key)
        if (!existing || attendance.timestamp < existing) memberFirstSeen.set(key, attendance.timestamp)
        if (attendance.timestamp >= thirtyDaysAgo) activeMembers.add(key)
        if (attendance.actuallyAttended) attendedCount++
      }
    }

    const firstSeenDates = [...memberFirstSeen.values()]
    const newMembersLast30Days = firstSeenDates.filter((date) => date >= thirtyDaysAgo).length
    const previousNewMembers = firstSeenDates.filter((date) => date >= sixtyDaysAgo && date < thirtyDaysAgo).length
    const churnedMembersLast30Days = firstSeenDates.filter((date) => date < sixtyDaysAgo).length - activeMembers.size
    const totalEvents = activities.length + eventSubmissions.length
    const avgAttendeesPerEvent = totalEvents > 0 ? Math.round((rsvpCount / totalEvents) * 10) / 10 : 0
    const retentionRate = percent(activeMembers.size, memberFirstSeen.size)
    const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const communityType = getCategoryName(topCategory)
    const showUpRate = percent(attendedCount, rsvpCount)

    const recommendations: Recommendation[] = []

    if (newMembersLast30Days === 0 && totalEvents > 0) {
      recommendations.push({
        title: 'Create a first-timer friendly session',
        description: 'No new members joined in the last 30 days. Add one clearly beginner-friendly session and promote it from your profile and community.',
        priority: 'high',
        category: 'acquisition',
        effort: 'medium',
        impact: 'high',
      })
    }

    if (retentionRate < 35 && memberFirstSeen.size >= 5) {
      recommendations.push({
        title: 'Re-engage recent attendees',
        description: 'Your active member share is low. Message people who attended before but have not joined in the last month.',
        priority: 'high',
        category: 'retention',
        effort: 'low',
        impact: 'high',
      })
    }

    if (showUpRate > 0 && showUpRate < 60) {
      recommendations.push({
        title: 'Tighten pre-event reminders',
        description: `Your tracked show-up rate is ${showUpRate}%. Send a reminder 24 hours before each session and ask attendees to reconfirm.`,
        priority: 'medium',
        category: 'engagement',
        effort: 'low',
        impact: 'medium',
      })
    }

    if (paidEvents === 0 && totalEvents >= 3) {
      recommendations.push({
        title: 'Test one paid session',
        description: 'You have repeated hosting activity but no paid sessions. Try a low-friction paid format with limited capacity.',
        priority: 'medium',
        category: 'monetization',
        effort: 'medium',
        impact: 'medium',
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Increase session frequency gradually',
        description: 'Your baseline looks healthy. Add one more session in the format that already attracts the most attendees.',
        priority: 'low',
        category: 'engagement',
        effort: 'medium',
        impact: 'medium',
      })
    }

    const categoryTips = communityType
      ? [
          `Lead with ${communityType.toLowerCase()} in the session title so people instantly know what to expect.`,
          'Repeat the same day and time for at least four weeks before judging demand.',
          'Use attendee photos or recaps after each event to make the next one easier to trust.',
          'Invite regulars to bring one friend when capacity is not filling.',
        ]
      : [
          'Keep one consistent weekly slot so members can build a routine around it.',
          'Make beginner expectations explicit in the title and description.',
          'Follow up within 24 hours after each session while the experience is still fresh.',
          'Use one clear call to action: join, invite a friend, or save the next date.',
        ]

    return NextResponse.json({
      metrics: {
        totalMembers: memberFirstSeen.size,
        activeMembers: activeMembers.size,
        newMembersLast30Days,
        churnedMembersLast30Days: Math.max(0, churnedMembersLast30Days),
        growthRateLast30Days: growthRate(newMembersLast30Days, previousNewMembers),
        retentionRate,
        avgAttendeesPerEvent,
        totalEvents,
      },
      recommendations,
      summary: totalEvents === 0
        ? 'You do not have enough hosting activity yet. Publish your first session, then this page will track member growth and retention.'
        : `You have reached ${memberFirstSeen.size} unique member${memberFirstSeen.size === 1 ? '' : 's'} across ${totalEvents} event${totalEvents === 1 ? '' : 's'}, with ${activeMembers.size} active in the last 30 days.`,
      categoryTips,
      communityType,
    })
  } catch (error) {
    console.error('Growth API error:', error)
    return NextResponse.json({ error: 'Failed to load growth data' }, { status: 500 })
  }
}
