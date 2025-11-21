import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@sweatbuddy/database'
import { activitySchema } from '@/lib/validations/activity'

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

    // Create activity in database
    const activity = await prisma.activity.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        type: validatedData.type,
        city: validatedData.city,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        maxPeople: validatedData.maxPeople || null,
        imageUrl: validatedData.imageUrl || null,
        price: validatedData.price ?? 0,
        currency: validatedData.currency || 'USD',
        status: validatedData.status || 'PUBLISHED',
        userId,
        hostId: userId, // Creator is the host by default
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        deletedAt: null,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
