import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminRequest(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        const oldDate = new Date(activity.startTime)

        // Set each activity to a date within the next 7 days
        // Spread them out based on their index
        const index = activities.indexOf(activity)
        const daysToAdd = (index % 7) + 1 // 1-7 days from now
        const hoursToAdd = (index % 12) + 7 // 7am-6pm

        const newStartTime = new Date(now)
        newStartTime.setDate(now.getDate() + daysToAdd)
        newStartTime.setHours(hoursToAdd, 0, 0, 0)

        let newEndTime = null
        if (activity.endTime) {
          const duration = activity.endTime.getTime() - oldDate.getTime()
          newEndTime = new Date(newStartTime.getTime() + duration)
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
export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminRequest(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
