import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') || 'all' // 'upcoming' | 'past' | 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const now = new Date()
    const whereClause: any = {
      userId: user.id,
      status: 'JOINED', // Only get activities user has joined
      deletedAt: null,
      activity: {
        deletedAt: null,
      },
    }

    // Add time-based filtering
    if (statusFilter === 'upcoming') {
      whereClause.activity = {
        ...whereClause.activity,
        OR: [
          { startTime: { gte: now } },
          { startTime: null }, // Include activities without start time
        ],
      }
    } else if (statusFilter === 'past') {
      whereClause.activity = {
        ...whereClause.activity,
        startTime: { lt: now },
      }
    }

    // Fetch bookings with related activity and host data
    const [bookings, totalCount] = await Promise.all([
      prisma.userActivity.findMany({
        where: whereClause,
        include: {
          activity: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  imageUrl: true,
                },
              },
              userActivities: {
                where: {
                  status: 'JOINED',
                  deletedAt: null,
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          activity: {
            startTime: statusFilter === 'past' ? 'desc' : 'asc',
          },
        },
        skip,
        take: limit,
      }),
      prisma.userActivity.count({
        where: whereClause,
      }),
    ])

    // Transform the data to match the expected format
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.userId,
      activityId: booking.activityId,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      activity: {
        id: booking.activity.id,
        title: booking.activity.title,
        description: booking.activity.description,
        type: booking.activity.type,
        city: booking.activity.city,
        latitude: booking.activity.latitude,
        longitude: booking.activity.longitude,
        startTime: booking.activity.startTime,
        endTime: booking.activity.endTime,
        maxPeople: booking.activity.maxPeople,
        imageUrl: booking.activity.imageUrl,
        price: booking.activity.price,
        currency: booking.activity.currency,
        status: booking.activity.status,
        host: {
          id: booking.activity.user.id,
          name: booking.activity.user.name,
          email: booking.activity.user.email,
          imageUrl: booking.activity.user.imageUrl,
        },
        participants: booking.activity.userActivities.map((ua) => ({
          id: ua.user.id,
          name: ua.user.name,
          imageUrl: ua.user.imageUrl,
        })),
        participantCount: booking.activity.userActivities.length,
      },
    }))

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + bookings.length < totalCount,
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
