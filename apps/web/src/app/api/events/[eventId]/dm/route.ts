import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizerSession } from '@/lib/organizer-session'
import { sendEmail } from '@/lib/email'
import eventsData from '@/data/events.json'

// Helper to get organizer handle for an event
async function getEventOrganizer(eventId: string): Promise<string | null> {
  // Check static events first
  const staticEvent = eventsData.events.find((e) => e.id === eventId)
  if (staticEvent) {
    return staticEvent.organizer.toLowerCase()
  }

  // Check approved submissions
  const submission = await prisma.eventSubmission.findFirst({
    where: { id: eventId, status: 'APPROVED' },
  })
  if (submission) {
    return submission.organizerInstagram.toLowerCase()
  }

  return null
}

// GET: Get or create conversation and messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { searchParams } = new URL(request.url)
    const attendeeEmail = searchParams.get('email')

    // Check if organizer is making this request (with signature verification)
    const organizerSession = await getOrganizerSession()

    let isOrganizer = false
    let organizerId: string | null = null
    let queryEmail = attendeeEmail

    if (organizerSession) {
      const organizer = await prisma.organizer.findUnique({
        where: { id: organizerSession.id },
      })

      if (organizer) {
        // Verify this organizer owns this event
        const eventOrganizerHandle = await getEventOrganizer(eventId)
        if (eventOrganizerHandle === organizer.instagramHandle.toLowerCase()) {
          isOrganizer = true
          organizerId = organizer.id
        }
      }
    }

    // For attendees, email is required
    if (!isOrganizer && !queryEmail) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // Find organizer for this event
    const eventOrganizerHandle = await getEventOrganizer(eventId)
    if (!eventOrganizerHandle) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Find or create organizer record
    let organizer = await prisma.organizer.findUnique({
      where: { instagramHandle: eventOrganizerHandle },
    })

    if (!organizer) {
      // Organizer hasn't registered yet - they need to register first
      return NextResponse.json({
        success: true,
        organizerRegistered: false,
        conversation: null,
        messages: [],
      })
    }

    organizerId = organizer.id

    // If attendee, verify they are attending this event
    if (!isOrganizer && queryEmail) {
      const attendance = await prisma.eventAttendance.findFirst({
        where: {
          eventId,
          email: queryEmail.toLowerCase().trim(),
        },
      })

      if (!attendance) {
        return NextResponse.json(
          { error: 'Only attendees can chat with the organizer' },
          { status: 403 }
        )
      }
    }

    // For organizers viewing a specific attendee's chat
    const targetEmail = isOrganizer ? attendeeEmail : queryEmail

    if (!targetEmail) {
      // Organizer wants list of all conversations for this event
      if (isOrganizer) {
        const conversations = await prisma.eventDirectConversation.findMany({
          where: {
            eventId,
            organizerId,
          },
          orderBy: { lastMessageAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })

        return NextResponse.json({
          success: true,
          organizerRegistered: true,
          conversations: conversations.map((c) => ({
            id: c.id,
            attendeeEmail: c.attendeeEmail,
            attendeeName: c.attendeeName,
            lastMessageAt: c.lastMessageAt?.toISOString() || null,
            lastMessage: c.messages[0]
              ? {
                  content: c.messages[0].content,
                  senderType: c.messages[0].senderType,
                }
              : null,
          })),
        })
      }

      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // Find or create conversation
    let conversation = await prisma.eventDirectConversation.findFirst({
      where: {
        eventId,
        organizerId,
        attendeeEmail: targetEmail.toLowerCase().trim(),
      },
    })

    if (!conversation) {
      // Get attendee name from attendance record
      const attendance = await prisma.eventAttendance.findFirst({
        where: {
          eventId,
          email: targetEmail.toLowerCase().trim(),
        },
      })

      conversation = await prisma.eventDirectConversation.create({
        data: {
          eventId,
          organizerId,
          attendeeEmail: targetEmail.toLowerCase().trim(),
          attendeeName: attendance?.name || null,
        },
      })
    }

    // Get messages
    const messages = await prisma.eventDirectMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      organizerRegistered: true,
      conversation: {
        id: conversation.id,
        attendeeEmail: conversation.attendeeEmail,
        attendeeName: conversation.attendeeName,
      },
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderType: m.senderType,
        senderName: m.senderName,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Get DM error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}

// POST: Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()
    const { content, senderEmail, senderName } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Check if organizer is making this request (with signature verification)
    const session = await getOrganizerSession()

    let isOrganizer = false
    let organizer: { id: string; instagramHandle: string; name: string | null } | null = null

    if (session) {
      const org = await prisma.organizer.findUnique({
        where: { id: session.id },
      })

      if (org) {
        const eventOrganizerHandle = await getEventOrganizer(eventId)
        if (eventOrganizerHandle === org.instagramHandle.toLowerCase()) {
          isOrganizer = true
          organizer = org
        }
      }
    }

    // For attendees, need email
    if (!isOrganizer && !senderEmail) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // Find event organizer
    const eventOrganizerHandle = await getEventOrganizer(eventId)
    if (!eventOrganizerHandle) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Find organizer record
    const eventOrganizer = await prisma.organizer.findUnique({
      where: { instagramHandle: eventOrganizerHandle },
    })

    if (!eventOrganizer) {
      return NextResponse.json(
        { error: 'Organizer has not registered yet' },
        { status: 404 }
      )
    }

    // Determine sender info
    let senderType: 'organizer' | 'attendee'
    let finalSenderEmail: string
    let finalSenderName: string
    let attendeeEmail: string

    if (isOrganizer && organizer) {
      senderType = 'organizer'
      finalSenderEmail = organizer.instagramHandle
      finalSenderName = organizer.name || `@${organizer.instagramHandle}`
      attendeeEmail = senderEmail // When organizer sends, senderEmail is the attendee they're messaging
    } else {
      // Verify attendee
      const attendance = await prisma.eventAttendance.findFirst({
        where: {
          eventId,
          email: senderEmail.toLowerCase().trim(),
        },
      })

      if (!attendance) {
        return NextResponse.json(
          { error: 'Only attendees can message the organizer' },
          { status: 403 }
        )
      }

      senderType = 'attendee'
      finalSenderEmail = senderEmail.toLowerCase().trim()
      finalSenderName = senderName || attendance.name || 'Anonymous'
      attendeeEmail = finalSenderEmail
    }

    // Find or create conversation
    let conversation = await prisma.eventDirectConversation.findFirst({
      where: {
        eventId,
        organizerId: eventOrganizer.id,
        attendeeEmail: attendeeEmail.toLowerCase().trim(),
      },
    })

    if (!conversation) {
      const attendance = await prisma.eventAttendance.findFirst({
        where: {
          eventId,
          email: attendeeEmail.toLowerCase().trim(),
        },
      })

      conversation = await prisma.eventDirectConversation.create({
        data: {
          eventId,
          organizerId: eventOrganizer.id,
          attendeeEmail: attendeeEmail.toLowerCase().trim(),
          attendeeName: attendance?.name || null,
        },
      })
    }

    // Create message
    const message = await prisma.eventDirectMessage.create({
      data: {
        conversationId: conversation.id,
        senderType,
        senderEmail: finalSenderEmail,
        senderName: finalSenderName,
        content: content.trim(),
      },
    })

    // Update conversation last message time
    await prisma.eventDirectConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    })

    // Send email notification to host when attendee sends a message
    if (senderType === 'attendee') {
      // Get the event details for the notification
      const eventSubmission = await prisma.eventSubmission.findFirst({
        where: { id: eventId },
        select: { eventName: true, contactEmail: true, organizerName: true },
      })

      if (eventSubmission?.contactEmail) {
        // Send notification email (don't await - fire and forget)
        sendEmail({
          to: eventSubmission.contactEmail,
          subject: `New message from ${finalSenderName} about "${eventSubmission.eventName}"`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #171717; margin-bottom: 16px;">New Message Received</h2>
              <p style="color: #525252; margin-bottom: 24px;">
                You have a new message from <strong>${finalSenderName}</strong> about your event <strong>"${eventSubmission.eventName}"</strong>
              </p>
              <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #171717; margin: 0; white-space: pre-wrap;">${content.trim()}</p>
              </div>
              <a href="https://sweatbuddies.co/organizer/dashboard"
                 style="display: inline-block; background: #171717; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View & Reply
              </a>
              <p style="color: #a3a3a3; font-size: 14px; margin-top: 24px;">
                You're receiving this because someone messaged you about your SweatBuddies event.
              </p>
            </div>
          `,
          replyTo: finalSenderEmail,
        }).catch(err => console.error('Failed to send notification email:', err))
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        senderName: message.senderName,
        createdAt: message.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Send DM error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
