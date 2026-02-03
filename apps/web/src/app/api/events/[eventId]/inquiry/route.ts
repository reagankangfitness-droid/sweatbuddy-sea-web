import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import eventsData from '@/data/events.json'

// Normalize Instagram handle (remove @ prefix, lowercase, trim)
function normalizeInstagramHandle(handle: string): string {
  return handle.replace(/^@/, '').toLowerCase().trim()
}

// Helper to get event details
async function getEventDetails(eventId: string) {
  // Check static events first
  const staticEvent = eventsData.events.find((e) => e.id === eventId)
  if (staticEvent) {
    return {
      name: staticEvent.name,
      organizerInstagram: normalizeInstagramHandle(staticEvent.organizer),
      contactEmail: null, // Static events don't have contact email in JSON
      organizerName: staticEvent.organizer,
    }
  }

  // Check approved submissions
  const submission = await prisma.eventSubmission.findFirst({
    where: { id: eventId, status: 'APPROVED' },
    select: {
      eventName: true,
      organizerInstagram: true,
      contactEmail: true,
      organizerName: true,
    },
  })

  if (submission) {
    return {
      name: submission.eventName,
      organizerInstagram: normalizeInstagramHandle(submission.organizerInstagram),
      contactEmail: submission.contactEmail,
      organizerName: submission.organizerName,
    }
  }

  return null
}

// POST: Send an inquiry to the host (works even if host hasn't registered)
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

    if (!senderEmail) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // Get event details
    const eventDetails = await getEventDetails(eventId)
    if (!eventDetails) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Verify sender is an attendee
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

    // Find or create organizer record
    let organizer = await prisma.organizer.findUnique({
      where: { instagramHandle: eventDetails.organizerInstagram },
    })

    if (!organizer && eventDetails.contactEmail) {
      // Try to auto-create organizer from event submission data
      // Use try-catch to handle unique constraint violations gracefully
      try {
        organizer = await prisma.organizer.create({
          data: {
            email: eventDetails.contactEmail.toLowerCase().trim(),
            instagramHandle: eventDetails.organizerInstagram,
            name: eventDetails.organizerName,
            isVerified: false, // Not fully verified until they log in
          },
        })
      } catch (createError) {
        // If creation fails (e.g., email already used), try to find by email
        // Organizer creation failed, trying to find by email
        organizer = await prisma.organizer.findUnique({
          where: { email: eventDetails.contactEmail.toLowerCase().trim() },
        })
      }
    }

    // For static events or if organizer creation failed, we'll just send the email
    // without storing in the conversation system

    // Create conversation and message if we have an organizer record
    let message = null
    if (organizer) {
      // Find or create conversation
      let conversation = await prisma.eventDirectConversation.findFirst({
        where: {
          eventId,
          organizerId: organizer.id,
          attendeeEmail: senderEmail.toLowerCase().trim(),
        },
      })

      if (!conversation) {
        conversation = await prisma.eventDirectConversation.create({
          data: {
            eventId,
            organizerId: organizer.id,
            attendeeEmail: senderEmail.toLowerCase().trim(),
            attendeeName: senderName || attendance.name || null,
          },
        })
      }

      // Create message
      message = await prisma.eventDirectMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: 'attendee',
          senderEmail: senderEmail.toLowerCase().trim(),
          senderName: senderName || attendance.name || 'Anonymous',
          content: content.trim(),
        },
      })

      // Update conversation last message time
      await prisma.eventDirectConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: message.createdAt },
      })
    }

    // Send email notification to host (don't let email failure break the request)
    const hostEmail = eventDetails.contactEmail || (organizer?.email)
    if (hostEmail) {
      const replyUrl = `https://sweatbuddies.co/organizer/dashboard`

      // Fire and forget - don't await
      sendEmail({
        to: hostEmail,
        subject: `New inquiry from ${senderName || 'an attendee'} about "${eventDetails.name}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #171717; margin-bottom: 16px;">You have a new message</h2>
            <p style="color: #525252; margin-bottom: 8px;">
              <strong>${senderName || 'Someone'}</strong> sent you a message about your event:
            </p>
            <p style="color: #171717; font-weight: 600; margin-bottom: 24px;">
              ${eventDetails.name}
            </p>
            <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #1800ad;">
              <p style="color: #171717; margin: 0; white-space: pre-wrap; line-height: 1.5;">${content.trim()}</p>
            </div>
            <a href="${replyUrl}"
               style="display: inline-block; background: #1800ad; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View & Reply on SweatBuddies
            </a>
            <p style="color: #a3a3a3; font-size: 13px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
              Reply directly to this email to respond to ${senderName || 'the attendee'}, or click the button above to reply on SweatBuddies.
            </p>
          </div>
        `,
        replyTo: senderEmail,
      }).catch(err => console.error('Failed to send inquiry email:', err))
    }

    return NextResponse.json({
      success: true,
      message: message ? {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        senderName: message.senderName,
        createdAt: message.createdAt.toISOString(),
      } : null,
    })
  } catch (error) {
    console.error('Send inquiry error:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
