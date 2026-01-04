import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instagramHandle = session.instagramHandle

    // Get all events for this host
    const events = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: { equals: instagramHandle, mode: 'insensitive' },
        status: 'APPROVED',
      },
      select: {
        id: true,
        eventName: true,
        day: true,
        eventDate: true,
        time: true,
        maxTickets: true,
        createdAt: true,
      },
    })

    if (events.length === 0) {
      return NextResponse.json({
        attendeesOverTime: [],
        eventsByDay: [],
        eventPerformance: [],
        insights: null,
      })
    }

    const eventIds = events.map((e) => e.id)

    // Get all attendance records
    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId: { in: eventIds } },
      select: {
        id: true,
        eventId: true,
        timestamp: true,
      },
    })

    // 1. Attendees over time (last 6 months, grouped by month)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyData: Record<string, number> = {}
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = 0
    }

    attendances.forEach((a) => {
      const date = new Date(a.timestamp)
      if (date >= sixMonthsAgo) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyData[key] !== undefined) {
          monthlyData[key]++
        }
      }
    })

    const attendeesOverTime = Object.entries(monthlyData).map(([month, count]) => {
      const [year, monthNum] = month.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return {
        month: monthNames[parseInt(monthNum) - 1],
        attendees: count,
      }
    })

    // 2. Events by day of week
    const dayOrder = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
    const eventsByDayMap: Record<string, number> = {}
    dayOrder.forEach((d) => (eventsByDayMap[d] = 0))

    events.forEach((e) => {
      if (eventsByDayMap[e.day] !== undefined) {
        eventsByDayMap[e.day]++
      }
    })

    const eventsByDay = dayOrder.map((day) => ({
      day: day.slice(0, 3), // Sun, Mon, etc.
      events: eventsByDayMap[day],
    }))

    // 3. Event performance (attendance count per event)
    const attendanceByEvent: Record<string, number> = {}
    attendances.forEach((a) => {
      attendanceByEvent[a.eventId] = (attendanceByEvent[a.eventId] || 0) + 1
    })

    const eventPerformance = events
      .map((e) => ({
        name: e.eventName.length > 20 ? e.eventName.slice(0, 20) + '...' : e.eventName,
        fullName: e.eventName,
        attendees: attendanceByEvent[e.id] || 0,
        maxSpots: e.maxTickets || null,
        fillRate: e.maxTickets ? Math.round(((attendanceByEvent[e.id] || 0) / e.maxTickets) * 100) : null,
      }))
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 5)

    // 4. Insights
    const totalAttendees = attendances.length
    const totalEvents = events.length
    const avgAttendeesPerEvent = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0

    // Find best day
    let bestDay = ''
    let bestDayCount = 0
    Object.entries(eventsByDayMap).forEach(([day, count]) => {
      if (count > bestDayCount) {
        bestDayCount = count
        bestDay = day
      }
    })

    // Find most popular time slot
    const timeSlots: Record<string, number> = {}
    events.forEach((e) => {
      const time = e.time
      timeSlots[time] = (timeSlots[time] || 0) + (attendanceByEvent[e.id] || 0)
    })

    let bestTime = ''
    let bestTimeCount = 0
    Object.entries(timeSlots).forEach(([time, count]) => {
      if (count > bestTimeCount) {
        bestTimeCount = count
        bestTime = time
      }
    })

    return NextResponse.json({
      attendeesOverTime,
      eventsByDay,
      eventPerformance,
      insights: {
        totalAttendees,
        totalEvents,
        avgAttendeesPerEvent,
        bestDay: bestDayCount > 0 ? bestDay : null,
        bestTime: bestTimeCount > 0 ? bestTime : null,
      },
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
