import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserReminderPreferences,
  updateUserReminderPreferences,
} from '@/lib/reminders'

/**
 * GET /api/reminders/preferences
 * Get current user's reminder preferences
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await getUserReminderPreferences(userId)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching reminder preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reminders/preferences
 * Update current user's reminder preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validFields = [
      'enableOneWeekReminder',
      'enableOneDayReminder',
      'enableTwoHourReminder',
      'emailReminders',
      'pushReminders',
      'smsReminders',
      'quietHoursStart',
      'quietHoursEnd',
      'timezone',
    ]

    const updateData: Record<string, unknown> = {}

    for (const field of validFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    const preferences = await updateUserReminderPreferences(userId, updateData)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating reminder preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
