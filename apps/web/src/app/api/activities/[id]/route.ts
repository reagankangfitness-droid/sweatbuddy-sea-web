import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
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
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (activity.userId !== userId) {
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
