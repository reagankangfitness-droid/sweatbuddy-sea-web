import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Calculate next occurrence for recurring events
function getNextOccurrence(dayName: string, eventTime: string): Date {
  const dayMap: Record<string, number> = {
    'Sundays': 0, 'Mondays': 1, 'Tuesdays': 2, 'Wednesdays': 3,
    'Thursdays': 4, 'Fridays': 5, 'Saturdays': 6
  }

  const targetDay = dayMap[dayName]
  if (targetDay === undefined) {
    // Not a standard day, return a week from now
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  }

  const now = new Date()
  const currentDay = now.getDay()

  // Calculate days until next occurrence
  let daysUntil = targetDay - currentDay
  if (daysUntil < 0) {
    daysUntil += 7
  } else if (daysUntil === 0) {
    // If it's today, check if the event time has passed
    const [time, period] = eventTime.split(/(?=[AP]M)/i)
    const [hours, minutes] = time.split(':').map(Number)
    let eventHour = hours
    if (period?.toUpperCase() === 'PM' && hours !== 12) eventHour += 12
    if (period?.toUpperCase() === 'AM' && hours === 12) eventHour = 0

    const eventDateTime = new Date(now)
    eventDateTime.setHours(eventHour, minutes || 0, 0, 0)

    if (now > eventDateTime) {
      // Event already happened today, show next week
      daysUntil = 7
    }
  }

  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + daysUntil)

  // Parse and set time
  try {
    const [time, period] = eventTime.split(/(?=[AP]M)/i)
    const [hours, minutes] = time.split(':').map(Number)
    let eventHour = hours
    if (period?.toUpperCase() === 'PM' && hours !== 12) eventHour += 12
    if (period?.toUpperCase() === 'AM' && hours === 12) eventHour = 0
    nextDate.setHours(eventHour, minutes || 0, 0, 0)
  } catch {
    nextDate.setHours(9, 0, 0, 0) // Default to 9am
  }

  return nextDate
}

export async function GET() {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ bookings: [] })
    }

    // Get current user's email from Clerk
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({ bookings: [] })
    }

    // Fetch attendances for this user's email
    const attendances = await prisma.eventAttendance.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    })

    if (attendances.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    // Get unique event IDs
    const eventIds = [...new Set(attendances.map(a => a.eventId))]

    // Fetch event details
    const events = await prisma.eventSubmission.findMany({
      where: {
        id: { in: eventIds },
      },
    })

    // Create a map for quick lookup
    const eventMap = new Map(events.map(e => [e.id, e]))

    // Transform the data
    const formattedBookings = attendances
      .map((attendance) => {
        const event = eventMap.get(attendance.eventId)
        if (!event) return null

        // For recurring events, calculate next occurrence
        let startTime: string | null = null
        if (event.recurring && event.day && event.time) {
          const nextOccurrence = getNextOccurrence(event.day, event.time)
          startTime = nextOccurrence.toISOString()
        } else if (event.eventDate) {
          startTime = event.eventDate.toISOString()
        }

        return {
          id: attendance.id,
          status: attendance.paymentStatus === 'refunded' ? 'CANCELLED' : 'JOINED',
          paymentStatus: attendance.paymentStatus?.toUpperCase() || 'FREE',
          amountPaid: attendance.paymentAmount ? attendance.paymentAmount / 100 : 0,
          currency: 'SGD',
          createdAt: attendance.timestamp?.toISOString() || new Date().toISOString(),
          activity: {
            id: event.id,
            slug: event.slug,
            title: event.eventName,
            type: event.category || 'Fitness',
            city: event.location || 'Singapore',
            startTime,
            endTime: null,
            imageUrl: event.imageUrl,
            price: event.isFree ? 0 : (event.price || 0),
            currency: 'SGD',
            latitude: event.latitude,
            longitude: event.longitude,
            recurring: event.recurring || false,
            host: {
              name: event.organizerName || 'Host',
              instagram: event.organizerInstagram || null,
            },
          },
        }
      })
      .filter(Boolean)

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Bookings API error:', error)
    // Return empty array instead of error to prevent UI crash
    return NextResponse.json({ bookings: [] })
  }
}
