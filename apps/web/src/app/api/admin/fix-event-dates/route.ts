import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { revalidateTag } from 'next/cache'

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
  // Handle "Every X" patterns
  'every sunday': 0,
  'every monday': 1,
  'every tuesday': 2,
  'every wednesday': 3,
  'every thursday': 4,
  'every friday': 5,
  'every saturday': 6,
}

function getNextOccurrence(dayOfWeek: number, timezone: string = 'Asia/Singapore'): Date {
  // Get current date in Singapore timezone
  const now = new Date()
  const sgNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }))

  const currentDay = sgNow.getDay()
  let daysUntil = dayOfWeek - currentDay

  // If it's today but we want the next occurrence, or if the day has passed this week
  if (daysUntil <= 0) {
    daysUntil += 7
  }

  const nextDate = new Date(sgNow)
  nextDate.setDate(sgNow.getDate() + daysUntil)
  nextDate.setHours(0, 0, 0, 0)

  return nextDate
}

function parseDayFromString(dayStr: string): number | null {
  const normalized = dayStr.toLowerCase().trim()

  // Direct match
  if (DAY_MAP[normalized] !== undefined) {
    return DAY_MAP[normalized]
  }

  // Check if it contains a day name
  for (const [pattern, dayNum] of Object.entries(DAY_MAP)) {
    if (normalized.includes(pattern.split(' ').pop()!)) {
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
    // Get all approved events
    const events = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
    })

    const updates: { id: string; eventName: string; oldDate: string | null; newDate: string; day: string }[] = []
    const skipped: { id: string; eventName: string; reason: string }[] = []

    const now = new Date()
    const sgNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
    sgNow.setHours(0, 0, 0, 0)

    for (const event of events) {
      // Only process recurring events with past dates
      if (!event.recurring) {
        // For one-time events, check if the date is in the past
        if (event.eventDate && event.eventDate < sgNow) {
          skipped.push({
            id: event.id,
            eventName: event.eventName,
            reason: 'One-time event with past date (will be filtered by API)'
          })
        }
        continue
      }

      // Check if eventDate is in the past or null
      const needsUpdate = !event.eventDate || event.eventDate < sgNow

      if (!needsUpdate) {
        skipped.push({
          id: event.id,
          eventName: event.eventName,
          reason: 'Event date is already in the future'
        })
        continue
      }

      // Try to parse the day from the event's day field
      const dayOfWeek = parseDayFromString(event.day)

      if (dayOfWeek === null) {
        skipped.push({
          id: event.id,
          eventName: event.eventName,
          reason: `Could not parse day from: "${event.day}"`
        })
        continue
      }

      const nextDate = getNextOccurrence(dayOfWeek)

      // Update the event
      await prisma.eventSubmission.update({
        where: { id: event.id },
        data: { eventDate: nextDate }
      })

      updates.push({
        id: event.id,
        eventName: event.eventName,
        oldDate: event.eventDate?.toISOString().split('T')[0] || null,
        newDate: nextDate.toISOString().split('T')[0],
        day: event.day
      })
    }

    // Revalidate the events cache
    revalidateTag('events')

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} events`,
      updates,
      skipped,
      currentDate: sgNow.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Error fixing event dates:', error)
    return NextResponse.json({ error: 'Failed to fix event dates' }, { status: 500 })
  }
}

// GET to preview what would be updated (dry run)
export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const events = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        day: true,
        recurring: true,
      }
    })

    const now = new Date()
    const sgNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
    sgNow.setHours(0, 0, 0, 0)

    const preview = events.map(event => {
      const isPast = event.eventDate ? event.eventDate < sgNow : true
      const dayOfWeek = parseDayFromString(event.day)
      const nextDate = dayOfWeek !== null ? getNextOccurrence(dayOfWeek) : null

      return {
        id: event.id,
        eventName: event.eventName,
        currentDate: event.eventDate?.toISOString().split('T')[0] || null,
        day: event.day,
        recurring: event.recurring,
        isPast,
        parsedDay: dayOfWeek,
        suggestedDate: nextDate?.toISOString().split('T')[0] || null,
        needsUpdate: event.recurring && isPast && dayOfWeek !== null
      }
    })

    const needsUpdate = preview.filter(e => e.needsUpdate)
    const cannotParse = preview.filter(e => e.recurring && e.parsedDay === null)

    return NextResponse.json({
      currentDate: sgNow.toISOString().split('T')[0],
      totalEvents: events.length,
      needsUpdate: needsUpdate.length,
      cannotParse: cannotParse.length,
      preview: preview.sort((a, b) => {
        if (a.needsUpdate !== b.needsUpdate) return a.needsUpdate ? -1 : 1
        return (a.currentDate || '').localeCompare(b.currentDate || '')
      })
    })

  } catch (error) {
    console.error('Error previewing event dates:', error)
    return NextResponse.json({ error: 'Failed to preview event dates' }, { status: 500 })
  }
}
