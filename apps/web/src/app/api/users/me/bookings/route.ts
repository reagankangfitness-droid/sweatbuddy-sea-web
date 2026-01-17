import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

        return {
          id: attendance.id,
          status: attendance.paymentStatus === 'refunded' ? 'CANCELLED' : 'JOINED',
          paymentStatus: attendance.paymentStatus?.toUpperCase() || 'FREE',
          amountPaid: attendance.paymentAmount ? attendance.paymentAmount / 100 : 0,
          currency: 'SGD',
          createdAt: attendance.timestamp?.toISOString() || new Date().toISOString(),
          activity: {
            id: event.id,
            title: event.eventName,
            type: event.category || 'Fitness',
            city: event.location || 'Singapore',
            startTime: event.eventDate?.toISOString() || null,
            endTime: null,
            imageUrl: event.imageUrl,
            price: event.isFree ? 0 : (event.price || 0),
            currency: 'SGD',
            user: {
              id: event.organizerInstagram || 'host',
              name: event.organizerInstagram ? `@${event.organizerInstagram}` : 'Host',
              email: '',
              imageUrl: null,
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
