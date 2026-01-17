import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user's email from Clerk
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({
        bookings: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasMore: false,
        },
      })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Fetch attendances for this user's email
    const [attendances, totalCount] = await Promise.all([
      prisma.eventAttendance.findMany({
        where: {
          email: email.toLowerCase(),
          confirmed: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.eventAttendance.count({
        where: {
          email: email.toLowerCase(),
          confirmed: true,
        },
      }),
    ])

    // Get unique event IDs
    const eventIds = [...new Set(attendances.map(a => a.eventId))]

    // Fetch event details for all events
    const events = await prisma.eventSubmission.findMany({
      where: {
        id: { in: eventIds },
      },
      select: {
        id: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        description: true,
        organizerInstagram: true,
        imageUrl: true,
        price: true,
        isFree: true,
      },
    })

    // Create a map for quick lookup
    const eventMap = new Map(events.map(e => [e.id, e]))

    // Transform the data to match the expected frontend format
    const formattedBookings = attendances
      .map((attendance) => {
        const event = eventMap.get(attendance.eventId)

        if (!event) {
          return null
        }

        // Parse event date and time to create startTime
        let startTime: string | null = null
        if (event.eventDate) {
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
            title: event.eventName,
            type: event.category || 'Fitness',
            city: event.location || 'Singapore',
            startTime: startTime,
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
      .filter(Boolean) // Remove null entries

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + attendances.length < totalCount,
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
