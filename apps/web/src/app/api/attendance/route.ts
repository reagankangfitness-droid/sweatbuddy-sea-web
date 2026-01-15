import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEventConfirmationEmail, sendHostNewAttendeeNotification } from '@/lib/event-confirmation-email'
import { scheduleEventReminder } from '@/lib/event-reminders'
import { schedulePostEventFollowUp } from '@/lib/post-event-followup'
import { isAdminRequest } from '@/lib/admin-auth'
import { generateCheckInCode } from '@/lib/generate-checkin-qr'

interface AttendanceRecord {
  id: string
  eventId: string
  eventName: string
  email: string
  name: string | null
  subscribe: boolean
  timestamp: string
  confirmed: boolean
}

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      eventId,
      eventName,
      email,
      name,
      subscribe,
      mealPreference,
      timestamp,
      // Additional event details for confirmation email
      eventDay,
      eventTime,
      eventLocation,
      organizerInstagram,
      communityLink,
      // Waiver fields
      waiverAccepted,
      waiverVersion,
    } = body

    // Get user IP address for waiver record
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const userIp = forwardedFor?.split(',')[0]?.trim() || realIp || null

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!eventId || !eventName) {
      return NextResponse.json(
        { error: 'Event ID and name are required' },
        { status: 400 }
      )
    }

    // Check for duplicate (same email + event)
    const existing = await prisma.eventAttendance.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        eventId: eventId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You've already registered for this event" },
        { status: 400 }
      )
    }

    // Generate unique check-in code for QR
    const checkInCode = generateCheckInCode()

    // Create attendance record
    const attendance = await prisma.eventAttendance.create({
      data: {
        id: generateId(),
        eventId,
        eventName,
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        subscribe: subscribe ?? true,
        mealPreference: mealPreference || null,
        timestamp: new Date(timestamp || new Date()),
        confirmed: true,
        // Waiver acceptance (one-time, covers all future events)
        waiverAccepted: waiverAccepted ?? false,
        waiverVersion: waiverVersion || null,
        waiverAcceptedAt: waiverAccepted ? new Date() : null,
        waiverAcceptedIp: waiverAccepted ? userIp : null,
        // QR code check-in
        checkInCode,
      },
    })

    // If subscribed, add to newsletter list
    if (subscribe) {
      try {
        const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email: email.toLowerCase().trim() },
        })

        if (!existingSubscriber) {
          await prisma.newsletterSubscriber.create({
            data: {
              email: email.toLowerCase().trim(),
              name: name?.trim() || null,
              subscribedAt: new Date(),
              source: 'event_attendance',
            },
          })
        }
      } catch (newsletterError) {
        // Don't fail the whole request if newsletter signup fails
        console.error('Newsletter signup error:', newsletterError)
      }
    }

    // Send confirmation email (fire and forget - don't block the response)
    sendEventConfirmationEmail({
      to: email.toLowerCase().trim(),
      userName: name?.trim() || null,
      eventId,
      eventName,
      eventDay: eventDay || 'TBD',
      eventTime: eventTime || 'TBD',
      eventLocation: eventLocation || 'See event details',
      organizerInstagram,
      communityLink: communityLink || null,
      checkInCode, // QR code check-in
    }).catch((emailError) => {
      console.error('Confirmation email error:', emailError)
    })

    // Schedule 24-hour reminder email, post-event follow-up, and notify host (fire and forget)
    // Get event date and host info from database
    prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        eventDate: true,
        time: true,
        contactEmail: true,
        organizerName: true,
        slug: true,
      },
    }).then(async (event) => {
      if (event?.eventDate) {
        // Schedule 24-hour pre-event reminder
        scheduleEventReminder({
          attendanceId: attendance.id,
          eventId,
          eventDate: event.eventDate,
        }).catch((err) => {
          console.error('Failed to schedule reminder:', err)
        })

        // Schedule post-event follow-up (2 hours after event ends)
        schedulePostEventFollowUp({
          attendanceId: attendance.id,
          eventId,
          eventDate: event.eventDate,
          eventTime: event.time || eventTime || '08:00',
        }).catch((err) => {
          console.error('Failed to schedule post-event follow-up:', err)
        })
      }

      // Notify host about new attendee
      if (event?.contactEmail) {
        // Get current attendee count
        const attendeeCount = await prisma.eventAttendance.count({
          where: { eventId },
        })

        sendHostNewAttendeeNotification({
          to: event.contactEmail,
          hostName: event.organizerName || null,
          eventId,
          eventName,
          eventSlug: event.slug || null,
          attendeeName: name?.trim() || null,
          attendeeEmail: email.toLowerCase().trim(),
          currentAttendeeCount: attendeeCount,
        }).catch((err) => {
          console.error('Failed to send host notification:', err)
        })
      }
    }).catch((err) => {
      console.error('Failed to fetch event for reminder:', err)
    })

    return NextResponse.json({
      success: true,
      attendanceId: attendance.id,
    })
  } catch (error) {
    console.error('Attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to register attendance' },
      { status: 500 }
    )
  }
}

// Get attendees for an event (admin use)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  // Admin auth check
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (eventId) {
      const attendees = await prisma.eventAttendance.findMany({
        where: { eventId },
        orderBy: { timestamp: 'desc' },
      })

      return NextResponse.json({
        attendees: attendees.map((a) => ({
          id: a.id,
          eventId: a.eventId,
          eventName: a.eventName,
          email: a.email,
          name: a.name,
          subscribe: a.subscribe,
          mealPreference: a.mealPreference,
          timestamp: a.timestamp.toISOString(),
          confirmed: a.confirmed,
        })),
      })
    }

    // Return attendance records with pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500) // Max 500 per page
    const skip = (page - 1) * limit

    const [allAttendees, totalCount] = await Promise.all([
      prisma.eventAttendance.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.eventAttendance.count(),
    ])

    return NextResponse.json({
      attendees: allAttendees.map((a) => ({
        id: a.id,
        eventId: a.eventId,
        eventName: a.eventName,
        email: a.email,
        name: a.name,
        subscribe: a.subscribe,
        mealPreference: a.mealPreference,
        timestamp: a.timestamp.toISOString(),
        confirmed: a.confirmed,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Get attendees error:', error)
    return NextResponse.json(
      { error: 'Failed to get attendees' },
      { status: 500 }
    )
  }
}

// Delete an attendee (admin use)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const attendeeId = searchParams.get('id')

  // Admin auth check
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!attendeeId) {
    return NextResponse.json({ error: 'Attendee ID is required' }, { status: 400 })
  }

  try {
    // First get the attendee to find their email and eventId (for chat message cleanup)
    const attendee = await prisma.eventAttendance.findUnique({
      where: { id: attendeeId },
    })

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    // Delete the attendance record
    await prisma.eventAttendance.delete({
      where: { id: attendeeId },
    })

    // Also delete any chat messages from this user for this event
    await prisma.eventChatMessage.deleteMany({
      where: {
        eventId: attendee.eventId,
        senderEmail: attendee.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Attendee removed successfully',
    })
  } catch (error) {
    console.error('Delete attendee error:', error)
    return NextResponse.json(
      { error: 'Failed to remove attendee' },
      { status: 500 }
    )
  }
}
