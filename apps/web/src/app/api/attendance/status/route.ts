import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/attendance/status?eventIds=id1,id2,id3
 *
 * Returns the user's attendance status for given events.
 * Uses Clerk auth to get user email.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's email from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const eventIdsParam = searchParams.get('eventIds')

    if (!eventIdsParam) {
      return NextResponse.json({ error: 'eventIds required' }, { status: 400 })
    }

    const eventIds = eventIdsParam.split(',').filter(Boolean)

    // Get all attendance records for this user and these events
    const attendances = await prisma.eventAttendance.findMany({
      where: {
        email,
        eventId: { in: eventIds },
      },
      select: {
        eventId: true,
        paymentStatus: true,
        confirmed: true,
        timestamp: true,
      },
    })

    // Build a map of eventId -> status
    const statusMap: Record<string, {
      isAttending: boolean
      paymentStatus: string | null
      confirmed: boolean
    }> = {}

    for (const eventId of eventIds) {
      const attendance = attendances.find(a => a.eventId === eventId)
      statusMap[eventId] = attendance
        ? {
            isAttending: true,
            paymentStatus: attendance.paymentStatus,
            confirmed: attendance.confirmed,
          }
        : {
            isAttending: false,
            paymentStatus: null,
            confirmed: false,
          }
    }

    return NextResponse.json({ status: statusMap, email })
  } catch (error) {
    console.error('Attendance status error:', error)
    return NextResponse.json(
      { error: 'Failed to get attendance status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/attendance/status
 * Body: { email: string, eventIds: string[] }
 *
 * Returns attendance status without requiring auth (for checking by email)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, eventIds } = body

    if (!email || !eventIds?.length) {
      return NextResponse.json(
        { error: 'email and eventIds required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Get all attendance records for this email and these events
    const attendances = await prisma.eventAttendance.findMany({
      where: {
        email: normalizedEmail,
        eventId: { in: eventIds },
      },
      select: {
        eventId: true,
        paymentStatus: true,
        confirmed: true,
        timestamp: true,
      },
    })

    // Build a map of eventId -> status
    const statusMap: Record<string, {
      isAttending: boolean
      paymentStatus: string | null
      confirmed: boolean
    }> = {}

    for (const eventId of eventIds) {
      const attendance = attendances.find(a => a.eventId === eventId)
      statusMap[eventId] = attendance
        ? {
            isAttending: true,
            paymentStatus: attendance.paymentStatus,
            confirmed: attendance.confirmed,
          }
        : {
            isAttending: false,
            paymentStatus: null,
            confirmed: false,
          }
    }

    return NextResponse.json({ status: statusMap })
  } catch (error) {
    console.error('Attendance status error:', error)
    return NextResponse.json(
      { error: 'Failed to get attendance status' },
      { status: 500 }
    )
  }
}
