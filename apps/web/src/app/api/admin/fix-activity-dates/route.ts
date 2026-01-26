import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

// Day name to JavaScript day number (0 = Sunday, 1 = Monday, etc.)
const DAY_MAP: Record<string, number> = {
  'sunday': 0,
  'sundays': 0,
  'monday': 1,
  'mondays': 1,
  'tuesday': 2,
  'tuesdays': 2,
  'wednesday': 3,
  'wednesdays': 3,
  'thursday': 4,
  'thursdays': 4,
  'friday': 5,
  'fridays': 5,
  'saturday': 6,
  'saturdays': 6,
}

function getNextOccurrence(dayOfWeek: number, time?: { hours: number; minutes: number }): Date {
  const now = new Date()
  // Use Singapore timezone
  const sgNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))

  const currentDay = sgNow.getDay()
  let daysUntil = dayOfWeek - currentDay

  // If it's today but the time has passed, or if the day has passed this week
  if (daysUntil < 0 || (daysUntil === 0 && time)) {
    const currentHour = sgNow.getHours()
    const currentMinute = sgNow.getMinutes()
    if (daysUntil < 0 || (time && (currentHour > time.hours || (currentHour === time.hours && currentMinute >= time.minutes)))) {
      daysUntil += 7
    }
  }

  const nextDate = new Date(sgNow)
  nextDate.setDate(sgNow.getDate() + daysUntil)

  if (time) {
    nextDate.setHours(time.hours, time.minutes, 0, 0)
  } else {
    nextDate.setHours(9, 0, 0, 0) // Default to 9 AM
  }

  return nextDate
}

function parseDayFromTitle(title: string): number | null {
  const normalized = title.toLowerCase().trim()

  // Check if title contains a day name
  for (const [day, dayNum] of Object.entries(DAY_MAP)) {
    if (normalized.includes(day)) {
      return dayNum
    }
  }

  return null
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all published activities with past startTime
    const now = new Date()

    const activities = await prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        startTime: { lt: now }
      },
      select: {
        id: true,
        title: true,
        startTime: true,
      }
    })

    const updates: { id: string; title: string; oldDate: string; newDate: string }[] = []
    const skipped: { id: string; title: string; reason: string }[] = []

    for (const activity of activities) {
      if (!activity.startTime) {
        skipped.push({
          id: activity.id,
          title: activity.title,
          reason: 'No startTime set'
        })
        continue
      }

      // Try to parse day from title or use the original day of week
      const originalDayOfWeek = activity.startTime.getDay()
      const originalHours = activity.startTime.getHours()
      const originalMinutes = activity.startTime.getMinutes()

      const nextDate = getNextOccurrence(originalDayOfWeek, { hours: originalHours, minutes: originalMinutes })

      // Update the activity
      await prisma.activity.update({
        where: { id: activity.id },
        data: { startTime: nextDate }
      })

      updates.push({
        id: activity.id,
        title: activity.title,
        oldDate: activity.startTime.toISOString(),
        newDate: nextDate.toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} activities`,
      updates,
      skipped,
      currentDate: now.toISOString()
    })

  } catch (error) {
    console.error('Error fixing activity dates:', error)
    return NextResponse.json({ error: 'Failed to fix activity dates' }, { status: 500 })
  }
}

// GET to preview what would be updated
export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Get all published activities
    const activities = await prisma.activity.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        startTime: true,
      },
      orderBy: { startTime: 'asc' }
    })

    const preview = activities.map(activity => {
      const isPast = activity.startTime ? activity.startTime < now : false
      const originalDayOfWeek = activity.startTime?.getDay()
      const suggestedDate = originalDayOfWeek !== undefined
        ? getNextOccurrence(originalDayOfWeek, activity.startTime ? {
            hours: activity.startTime.getHours(),
            minutes: activity.startTime.getMinutes()
          } : undefined)
        : null

      return {
        id: activity.id,
        title: activity.title,
        currentDate: activity.startTime?.toISOString() || null,
        isPast,
        suggestedDate: isPast && suggestedDate ? suggestedDate.toISOString() : null,
        needsUpdate: isPast
      }
    })

    const needsUpdate = preview.filter(a => a.needsUpdate)

    return NextResponse.json({
      currentDate: now.toISOString(),
      totalActivities: activities.length,
      needsUpdate: needsUpdate.length,
      preview: preview.sort((a, b) => {
        if (a.needsUpdate !== b.needsUpdate) return a.needsUpdate ? -1 : 1
        return (a.currentDate || '').localeCompare(b.currentDate || '')
      })
    })

  } catch (error) {
    console.error('Error previewing activity dates:', error)
    return NextResponse.json({ error: 'Failed to preview activity dates' }, { status: 500 })
  }
}
