import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// GET: Validate check-in code and return attendee info
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Check-in code required' },
        { status: 400 }
      )
    }

    // Find attendee by check-in code
    const attendance = await prisma.eventAttendance.findUnique({
      where: { checkInCode: code },
    })

    if (!attendance) {
      return NextResponse.json(
        { valid: false, error: 'Invalid check-in code' },
        { status: 404 }
      )
    }

    // Get event details
    const event = await prisma.eventSubmission.findUnique({
      where: { id: attendance.eventId },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        time: true,
        slug: true,
      },
    })

    return NextResponse.json({
      valid: true,
      attendee: {
        id: attendance.id,
        name: attendance.name,
        email: attendance.email,
        checkedIn: !!attendance.checkedInAt,
        checkedInAt: attendance.checkedInAt?.toISOString() || null,
      },
      event: event ? {
        id: event.id,
        title: event.eventName,
        date: event.eventDate?.toISOString() || null,
        time: event.time,
        slug: event.slug,
      } : null,
    })
  } catch (error) {
    console.error('Check-in validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate check-in code' },
      { status: 500 }
    )
  }
}

// POST: Mark attendee as checked in
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Check-in code required' },
        { status: 400 }
      )
    }

    // Get authenticated user (host)
    const { userId } = await auth()

    // Find attendee by check-in code
    const attendance = await prisma.eventAttendance.findUnique({
      where: { checkInCode: code },
    })

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'Invalid check-in code' },
        { status: 404 }
      )
    }

    // Check if already checked in
    if (attendance.checkedInAt) {
      return NextResponse.json({
        success: false,
        error: 'Already checked in',
        attendee: {
          name: attendance.name,
          email: attendance.email,
          checkedInAt: attendance.checkedInAt.toISOString(),
        },
      }, { status: 400 })
    }

    // Verify host owns this event (optional but recommended)
    if (userId) {
      const event = await prisma.eventSubmission.findUnique({
        where: { id: attendance.eventId },
        select: { submittedByUserId: true },
      })

      if (event && event.submittedByUserId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to check in for this event' },
          { status: 403 }
        )
      }
    }

    // Mark as checked in
    const now = new Date()
    await prisma.eventAttendance.update({
      where: { id: attendance.id },
      data: {
        checkedInAt: now,
        checkedInMethod: 'qr',
        actuallyAttended: true,
        markedAttendedAt: now,
      },
    })

    // Get updated stats
    const stats = await prisma.eventAttendance.aggregate({
      where: { eventId: attendance.eventId },
      _count: { id: true },
    })

    const checkedInCount = await prisma.eventAttendance.count({
      where: {
        eventId: attendance.eventId,
        checkedInAt: { not: null },
      },
    })

    return NextResponse.json({
      success: true,
      attendee: {
        name: attendance.name,
        email: attendance.email,
        checkedInAt: now.toISOString(),
      },
      stats: {
        checkedIn: checkedInCount,
        total: stats._count.id,
      },
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check in' },
      { status: 500 }
    )
  }
}
