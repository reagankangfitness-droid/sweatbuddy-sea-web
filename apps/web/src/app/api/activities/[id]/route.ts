import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Converts a datetime-local string (e.g., "2024-12-15T14:00") to a proper UTC Date.
 * datetime-local inputs don't include timezone info, so we need to interpret them
 * as the user's local time and convert to UTC.
 *
 * @param dateTimeLocal - String like "2024-12-15T18:30" from datetime-local input
 * @param timezoneOffset - Client's timezone offset in minutes (e.g., -480 for UTC+8)
 *                         This is the value from new Date().getTimezoneOffset()
 */
function parseLocalDateTime(dateTimeLocal: string, timezoneOffset?: number): Date {
  // If already has timezone info, parse directly
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateTimeLocal)) {
    return new Date(dateTimeLocal)
  }

  // If no timezone offset provided, treat as UTC (backwards compatibility)
  if (timezoneOffset === undefined) {
    return new Date(dateTimeLocal + 'Z')
  }

  // Parse the datetime-local string components directly to avoid timezone issues
  // Format: "YYYY-MM-DDTHH:MM" or "YYYY-MM-DDTHH:MM:SS"
  const [datePart, timePart] = dateTimeLocal.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const timeParts = timePart.split(':').map(Number)
  const hours = timeParts[0]
  const minutes = timeParts[1]
  const seconds = timeParts[2] || 0

  // Create a UTC date from the local time components
  // Then adjust by the client's timezone offset
  // timezoneOffset is negative for east of UTC (e.g., -480 for UTC+8)
  // So for UTC+8, we need to SUBTRACT 8 hours to get UTC
  const utcDate = Date.UTC(year, month - 1, day, hours, minutes, seconds)
  const adjustedUtc = utcDate + (timezoneOffset * 60 * 1000)

  return new Date(adjustedUtc)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const activity = await prisma.activity.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        city: true,
        latitude: true,
        longitude: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        imageUrl: true,
        price: true,
        currency: true,
        status: true,
        userId: true,
        hostId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        userActivities: {
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
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if activity exists and belongs to user
    const existingActivity = await prisma.activity.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      select: {
        userId: true,
        hostId: true,
      },
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (existingActivity.userId !== userId && existingActivity.hostId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own activities' }, { status: 403 })
    }

    // Parse and update activity
    const body = await request.json()

    // Get timezone offset from request body (sent by client)
    const timezoneOffset = typeof body.timezoneOffset === 'number' ? body.timezoneOffset : undefined

    const updatedActivity = await prisma.activity.update({
      where: {
        id: params.id,
      },
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        city: body.city,
        latitude: body.latitude,
        longitude: body.longitude,
        startTime: body.startTime ? parseLocalDateTime(body.startTime, timezoneOffset) : null,
        endTime: body.endTime ? parseLocalDateTime(body.endTime, timezoneOffset) : null,
        maxPeople: body.maxPeople || null,
        imageUrl: body.imageUrl || null,
        price: body.price ?? 0,
        currency: body.currency || 'USD',
      },
    })

    return NextResponse.json(updatedActivity)
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if activity exists and belongs to user
    const activity = await prisma.activity.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      select: {
        userId: true,
        hostId: true,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (activity.userId !== userId && activity.hostId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own activities' }, { status: 403 })
    }

    // Soft delete the activity
    await prisma.activity.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
