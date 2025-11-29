import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/host/reminders/[activityId]
 * Get reminder settings for an activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activityId } = await params

    // Verify user owns this activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
        deletedAt: null,
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get or create default settings
    let settings = await prisma.hostReminderSettings.findUnique({
      where: { activityId },
    })

    if (!settings) {
      settings = await prisma.hostReminderSettings.create({
        data: {
          activityId,
          hostId: userId,
          enableOneWeekReminder: false,
          enableOneDayReminder: true,
          enableTwoHourReminder: true,
          includeMapLink: true,
          includeCalendarLink: true,
          includeHostContact: false,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching reminder settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/host/reminders/[activityId]
 * Update reminder settings for an activity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activityId } = await params

    // Verify user owns this activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
        deletedAt: null,
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or unauthorized' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate input
    const validFields = [
      'enableOneWeekReminder',
      'enableOneDayReminder',
      'enableTwoHourReminder',
      'oneDaySubject',
      'oneDayMessage',
      'twoHourSubject',
      'twoHourMessage',
      'oneWeekSubject',
      'oneWeekMessage',
      'includeMapLink',
      'includeCalendarLink',
      'includeHostContact',
      'customInstructions',
    ]

    const updateData: Record<string, unknown> = {}

    for (const field of validFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    const settings = await prisma.hostReminderSettings.upsert({
      where: { activityId },
      create: {
        activityId,
        hostId: userId,
        ...updateData,
      },
      update: updateData,
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating reminder settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
