import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Get all activities
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
      },
    })

    const now = new Date()
    const updates: { id: string; title: string; oldDate: Date | null; newDate: Date }[] = []

    for (const activity of activities) {
      if (activity.startTime) {
        // Calculate how far in the past the activity is
        const oldDate = new Date(activity.startTime)

        // Create a new date that's the same day/time but in the future
        // Add 2 months to push all activities into the future
        const newStartTime = new Date(oldDate)
        newStartTime.setMonth(newStartTime.getMonth() + 2)

        // Make sure it's still in the future
        while (newStartTime <= now) {
          newStartTime.setMonth(newStartTime.getMonth() + 1)
        }

        let newEndTime = null
        if (activity.endTime) {
          const oldEndDate = new Date(activity.endTime)
          newEndTime = new Date(oldEndDate)
          newEndTime.setMonth(newEndTime.getMonth() + 2)
          while (newEndTime <= now) {
            newEndTime.setMonth(newEndTime.getMonth() + 1)
          }
        }

        await prisma.activity.update({
          where: { id: activity.id },
          data: {
            startTime: newStartTime,
            endTime: newEndTime,
          },
        })

        updates.push({
          id: activity.id,
          title: activity.title,
          oldDate: activity.startTime,
          newDate: newStartTime,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} activities with future dates`,
      updates: updates.map((u) => ({
        id: u.id,
        title: u.title,
        oldDate: u.oldDate?.toISOString(),
        newDate: u.newDate.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fixing dates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fix dates' },
      { status: 500 }
    )
  }
}

// GET to preview what would be updated
export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    const now = new Date()

    const preview = activities.map((activity) => {
      const isPast = activity.startTime ? new Date(activity.startTime) < now : false

      return {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime?.toISOString(),
        status: activity.status,
        isPast,
      }
    })

    const pastCount = preview.filter((p) => p.isPast).length
    const futureCount = preview.filter((p) => !p.isPast).length

    return NextResponse.json({
      success: true,
      totalActivities: activities.length,
      pastActivities: pastCount,
      futureActivities: futureCount,
      currentTime: now.toISOString(),
      preview,
    })
  } catch (error) {
    console.error('Error previewing dates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to preview dates' },
      { status: 500 }
    )
  }
}
