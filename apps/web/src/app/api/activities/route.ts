import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activitySchema } from '@/lib/validations/activity'
import { mapCategoryToLegacyType, getCategoriesByGroup } from '@/lib/categories'

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

export async function POST(request: Request) {
  try {
    // Authenticate with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details from Clerk and sync to database
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    // Ensure user exists in database (upsert)
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    })

    // Parse and validate request body
    const body = await request.json()
    const validatedData = activitySchema.parse(body)

    // Get timezone offset from request body (sent by client)
    // This is the offset in minutes from UTC (e.g., -480 for UTC+8 Singapore)
    const timezoneOffset = typeof body.timezoneOffset === 'number' ? body.timezoneOffset : undefined

    // Create activity and group chat in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Determine legacy type from categorySlug for backwards compatibility
      const categorySlug = validatedData.categorySlug || null
      const legacyType = categorySlug
        ? mapCategoryToLegacyType(categorySlug)
        : validatedData.type

      // Create activity in database
      const activity = await tx.activity.create({
        data: {
          title: validatedData.title,
          description: validatedData.description || null,
          type: legacyType as 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER',
          categorySlug: categorySlug,
          city: validatedData.city,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          // Additional location fields from Google Places
          address: validatedData.address || null,
          streetAddress: validatedData.streetAddress || null,
          postalCode: validatedData.postalCode || null,
          country: validatedData.country || null,
          placeId: validatedData.placeId || null,
          startTime: validatedData.startTime ? parseLocalDateTime(validatedData.startTime, timezoneOffset) : null,
          endTime: validatedData.endTime ? parseLocalDateTime(validatedData.endTime, timezoneOffset) : null,
          maxPeople: validatedData.maxPeople || null,
          imageUrl: validatedData.imageUrl || null,
          price: validatedData.price ?? 0,
          currency: validatedData.currency || 'USD',
          status: 'PENDING_APPROVAL', // All new activities require approval
          userId,
          hostId: userId, // Creator is the host by default
        },
      })

      // Create group chat for the activity
      const group = await tx.group.create({
        data: {
          name: `${validatedData.title} - Group Chat`,
          description: `Group chat for ${validatedData.title} activity`,
          privacy: 'PRIVATE',
          activityId: activity.id,
        },
      })

      // Add host as first member with ADMIN role
      await tx.userGroup.create({
        data: {
          userId,
          groupId: group.id,
          role: 'ADMIN',
        },
      })

      return activity
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Filter params
    const categories = searchParams.get('categories') // comma-separated
    const group = searchParams.get('group')
    const city = searchParams.get('city')
    const upcoming = searchParams.get('upcoming')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build where clause - only show PUBLISHED activities to public
    const where: Record<string, unknown> = {
      deletedAt: null,
      status: 'PUBLISHED', // Only show approved/published activities
    }

    // Filter by categories (comma-separated slugs)
    if (categories) {
      const categoryList = categories.split(',').filter(Boolean)
      if (categoryList.length > 0) {
        where.categorySlug = { in: categoryList }
      }
    }

    // Filter by category group
    if (group) {
      const groupCategories = getCategoriesByGroup(group)
      if (groupCategories.length > 0) {
        where.categorySlug = { in: groupCategories.map((c) => c.slug) }
      }
    }

    // Filter by city
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    // Filter to upcoming activities only
    if (upcoming === 'true') {
      where.startTime = { gte: new Date() }
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            // Note: email intentionally excluded from public API for privacy
          },
        },
        userActivities: {
          where: {
            status: 'JOINED',
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
        ratingSummary: {
          select: {
            averageRating: true,
            totalReviews: true,
          },
        },
      },
      orderBy: upcoming === 'true'
        ? { startTime: 'asc' }
        : { createdAt: 'desc' },
      take: limit ? Math.min(parseInt(limit, 10), 100) : 20,
      skip: offset ? parseInt(offset, 10) : undefined,
    })

    return NextResponse.json(activities)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
