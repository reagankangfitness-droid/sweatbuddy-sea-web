import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface MonthlyTrend {
  month: string
  rsvps: number
  attended: number
  showUpRate: number
  revenue: number
}

interface DayDistribution {
  day: string
  rsvps: number
  attended: number
}

interface TimeDistribution {
  hour: string
  rsvps: number
}

interface RetentionData {
  month: string
  newMembers: number
  returningMembers: number
}

interface TopEvent {
  id: string
  name: string
  date: string | null
  rsvps: number
  attended: number
  showUpRate: number
  revenue: number
}

interface UpcomingEventPrediction {
  id: string
  name: string
  date: string | null
  day: string | null
  time: string | null
  currentRSVPs: number
  predictedShowUpRate: number
  predictedAttendance: number
}

interface RevenueForecast {
  month: string
  predictedRevenue: number
  confidence: 'high' | 'medium' | 'low'
}

interface Recommendation {
  type: 'success' | 'warning' | 'info'
  title: string
  description: string
}

export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instagramHandle = session.instagramHandle
    const userId = session.userId

    // Build where clause: prioritize userId for account-based queries
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

    // Get all approved events for this organizer
    const events = await prisma.eventSubmission.findMany({
      where: whereClause,
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        day: true,
        time: true,
        createdAt: true,
        price: true,
      },
      orderBy: { eventDate: 'asc' },
    })

    // Get upcoming events (future dates)
    const now = new Date()
    const upcomingEvents = events.filter(e => e.eventDate && new Date(e.eventDate) > now)

    const eventIds = events.map(e => e.id)

    if (eventIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalEvents: 0,
          totalRSVPs: 0,
          totalAttended: 0,
          avgShowUpRate: 0,
          totalRevenue: 0,
          uniqueAttendees: 0,
        },
        monthlyTrends: [],
        dayDistribution: [],
        timeDistribution: [],
        retentionData: [],
        topEvents: [],
        insights: null,
      })
    }

    // Get all attendance records
    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId: { in: eventIds } },
      select: {
        id: true,
        eventId: true,
        email: true,
        timestamp: true,
        actuallyAttended: true,
        paymentAmount: true,
        paymentStatus: true,
      },
    })

    // Get transactions for revenue
    const transactions = await prisma.eventTransaction.findMany({
      where: {
        eventSubmissionId: { in: eventIds },
        status: 'SUCCEEDED',
      },
      select: {
        eventSubmissionId: true,
        netPayoutToHost: true,
        createdAt: true,
      },
    })

    // Calculate summary stats
    const totalRSVPs = attendances.length
    const totalAttended = attendances.filter(a => a.actuallyAttended).length
    const avgShowUpRate = totalRSVPs > 0 ? Math.round((totalAttended / totalRSVPs) * 100) : 0
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.netPayoutToHost || 0), 0)
    const uniqueAttendees = new Set(attendances.map(a => a.email.toLowerCase())).size

    // Monthly trends (last 12 months)
    const monthlyTrends: MonthlyTrend[] = []

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short' })

      const monthAttendances = attendances.filter(a => {
        const date = new Date(a.timestamp)
        return date >= monthStart && date <= monthEnd
      })

      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.createdAt)
        return date >= monthStart && date <= monthEnd
      })

      const rsvps = monthAttendances.length
      const attended = monthAttendances.filter(a => a.actuallyAttended).length
      const showUpRate = rsvps > 0 ? Math.round((attended / rsvps) * 100) : 0
      const revenue = monthTransactions.reduce((sum, t) => sum + (t.netPayoutToHost || 0), 0) / 100

      monthlyTrends.push({
        month: monthLabel,
        rsvps,
        attended,
        showUpRate,
        revenue,
      })
    }

    // Day distribution (which days get most signups)
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayStats: Record<string, { rsvps: number; attended: number }> = {}
    dayOrder.forEach(d => dayStats[d] = { rsvps: 0, attended: 0 })

    events.forEach(event => {
      const eventAttendances = attendances.filter(a => a.eventId === event.id)
      const eventAttended = eventAttendances.filter(a => a.actuallyAttended)
      if (event.day && dayStats[event.day] !== undefined) {
        dayStats[event.day].rsvps += eventAttendances.length
        dayStats[event.day].attended += eventAttended.length
      }
    })

    const dayDistribution: DayDistribution[] = dayOrder.map(day => ({
      day: day.slice(0, 3),
      rsvps: dayStats[day].rsvps,
      attended: dayStats[day].attended,
    }))

    // Time distribution (which hours get most signups)
    const timeStats: Record<number, number> = {}
    for (let h = 5; h <= 22; h++) {
      timeStats[h] = 0
    }

    events.forEach(event => {
      if (!event.time) return
      const eventAttendances = attendances.filter(a => a.eventId === event.id)

      // Parse time like "7:00 AM", "19:00", "7pm"
      const timeMatch = event.time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/)
      if (timeMatch) {
        let hour = parseInt(timeMatch[1])
        const period = timeMatch[3]?.toUpperCase()

        if (period === 'PM' && hour !== 12) hour += 12
        if (period === 'AM' && hour === 12) hour = 0

        if (timeStats[hour] !== undefined) {
          timeStats[hour] += eventAttendances.length
        }
      }
    })

    const timeDistribution: TimeDistribution[] = Object.entries(timeStats)
      .map(([hour, rsvps]) => ({
        hour: `${parseInt(hour) % 12 || 12}${parseInt(hour) >= 12 ? 'pm' : 'am'}`,
        rsvps,
      }))
      .filter(t => t.rsvps > 0 || parseInt(t.hour) >= 6 && parseInt(t.hour) <= 21)

    // Retention data (new vs returning members per month)
    const retentionData: RetentionData[] = []
    const seenEmails = new Set<string>()

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short' })

      const monthAttendances = attendances.filter(a => {
        const date = new Date(a.timestamp)
        return date >= monthStart && date <= monthEnd
      })

      let newMembers = 0
      let returningMembers = 0

      const monthEmails = new Set<string>()
      monthAttendances.forEach(a => {
        const emailLower = a.email.toLowerCase()
        if (!monthEmails.has(emailLower)) {
          monthEmails.add(emailLower)
          if (seenEmails.has(emailLower)) {
            returningMembers++
          } else {
            newMembers++
            seenEmails.add(emailLower)
          }
        }
      })

      retentionData.push({
        month: monthLabel,
        newMembers,
        returningMembers,
      })
    }

    // Top performing events (by RSVPs)
    const eventStats = events.map(event => {
      const eventAttendances = attendances.filter(a => a.eventId === event.id)
      const eventTransactions = transactions.filter(t => t.eventSubmissionId === event.id)

      const rsvps = eventAttendances.length
      const attended = eventAttendances.filter(a => a.actuallyAttended).length
      const showUpRate = rsvps > 0 ? Math.round((attended / rsvps) * 100) : 0
      const revenue = eventTransactions.reduce((sum, t) => sum + (t.netPayoutToHost || 0), 0) / 100

      return {
        id: event.id,
        name: event.eventName,
        date: event.eventDate?.toISOString().split('T')[0] || null,
        rsvps,
        attended,
        showUpRate,
        revenue,
      }
    })

    const topEvents: TopEvent[] = eventStats
      .filter(e => e.rsvps > 0)
      .sort((a, b) => b.rsvps - a.rsvps)
      .slice(0, 5)

    // Generate insights
    const bestDay = dayDistribution.reduce((best, d) => d.rsvps > best.rsvps ? d : best, dayDistribution[0])
    const bestTime = timeDistribution.reduce((best, t) => t.rsvps > best.rsvps ? t : best, timeDistribution[0] || { hour: '', rsvps: 0 })

    // Growth calculation
    const recentMonths = monthlyTrends.slice(-3)
    const previousMonths = monthlyTrends.slice(-6, -3)
    const recentTotal = recentMonths.reduce((sum, m) => sum + m.rsvps, 0)
    const previousTotal = previousMonths.reduce((sum, m) => sum + m.rsvps, 0)
    const growthRate = previousTotal > 0 ? Math.round(((recentTotal - previousTotal) / previousTotal) * 100) : 0

    // Calculate show-up rates by day for predictions
    const showUpRateByDay: Record<string, { total: number; attended: number }> = {}
    dayOrder.forEach(d => showUpRateByDay[d] = { total: 0, attended: 0 })

    events.forEach(event => {
      if (!event.day || !dayStats[event.day]) return
      const eventAttendances = attendances.filter(a => a.eventId === event.id)
      showUpRateByDay[event.day].total += eventAttendances.length
      showUpRateByDay[event.day].attended += eventAttendances.filter(a => a.actuallyAttended).length
    })

    // Predict show-up rate for upcoming events
    const upcomingEventPredictions: UpcomingEventPrediction[] = upcomingEvents.slice(0, 5).map(event => {
      const eventRSVPs = attendances.filter(a => a.eventId === event.id).length

      // Use day-specific show-up rate if available, otherwise use average
      let predictedRate = avgShowUpRate
      if (event.day && showUpRateByDay[event.day] && showUpRateByDay[event.day].total > 0) {
        predictedRate = Math.round((showUpRateByDay[event.day].attended / showUpRateByDay[event.day].total) * 100)
      }

      const predictedAttendance = Math.round(eventRSVPs * (predictedRate / 100))

      return {
        id: event.id,
        name: event.eventName,
        date: event.eventDate?.toISOString().split('T')[0] || null,
        day: event.day,
        time: event.time,
        currentRSVPs: eventRSVPs,
        predictedShowUpRate: predictedRate,
        predictedAttendance,
      }
    })

    // Revenue forecast (next 3 months)
    const avgMonthlyRevenue = monthlyTrends
      .filter(m => m.revenue > 0)
      .reduce((sum, m) => sum + m.revenue, 0) / Math.max(monthlyTrends.filter(m => m.revenue > 0).length, 1)

    const revenueGrowthRate = recentMonths.length > 0 && previousMonths.length > 0
      ? (recentMonths.reduce((s, m) => s + m.revenue, 0) / 3) / Math.max((previousMonths.reduce((s, m) => s + m.revenue, 0) / 3), 1)
      : 1

    const revenueForecast: RevenueForecast[] = []
    for (let i = 1; i <= 3; i++) {
      const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthLabel = forecastMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const predictedRevenue = Math.round(avgMonthlyRevenue * Math.pow(revenueGrowthRate, i / 3) * 100) / 100

      revenueForecast.push({
        month: monthLabel,
        predictedRevenue: Math.max(0, predictedRevenue),
        confidence: totalRevenue > 1000 ? 'high' : totalRevenue > 100 ? 'medium' : 'low',
      })
    }

    // Generate actionable recommendations
    const recommendations: Recommendation[] = []

    if (avgShowUpRate < 60) {
      recommendations.push({
        type: 'warning',
        title: 'Improve Show-up Rate',
        description: `Your ${avgShowUpRate}% show-up rate is below average. Try sending reminder emails 24h before events.`,
      })
    } else if (avgShowUpRate >= 80) {
      recommendations.push({
        type: 'success',
        title: 'Great Show-up Rate!',
        description: `Your ${avgShowUpRate}% show-up rate is excellent. Your community is highly engaged.`,
      })
    }

    if (growthRate > 20) {
      recommendations.push({
        type: 'success',
        title: 'Strong Growth',
        description: `You're growing ${growthRate}% over 3 months. Consider adding more event slots.`,
      })
    } else if (growthRate < -10) {
      recommendations.push({
        type: 'warning',
        title: 'Declining Attendance',
        description: 'Attendance is down. Try varying event times or promoting on social media.',
      })
    }

    const bestDayData = dayDistribution.reduce((best, d) => d.rsvps > best.rsvps ? d : best, dayDistribution[0])
    if (bestDayData && bestDayData.rsvps > 0) {
      recommendations.push({
        type: 'info',
        title: `${bestDayData.day} is Your Best Day`,
        description: `Schedule more events on ${bestDayData.day}s to maximize attendance.`,
      })
    }

    return NextResponse.json({
      summary: {
        totalEvents: events.length,
        totalRSVPs,
        totalAttended,
        avgShowUpRate,
        totalRevenue: totalRevenue / 100,
        uniqueAttendees,
      },
      monthlyTrends,
      dayDistribution,
      timeDistribution,
      retentionData,
      topEvents,
      insights: {
        bestDay: bestDay?.day || null,
        bestTime: bestTime?.hour || null,
        growthRate,
        avgAttendeesPerEvent: events.length > 0 ? Math.round(totalRSVPs / events.length) : 0,
      },
      // New predictive analytics
      upcomingEventPredictions,
      revenueForecast,
      recommendations,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
