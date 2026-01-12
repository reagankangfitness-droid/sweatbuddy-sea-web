import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// GET /api/host/events/[eventId]/waivers - Get all signed waivers for an event
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params

    // Get organizer session from cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated as organizer' },
        { status: 401 }
      )
    }

    let organizerInstagram: string
    try {
      const session = JSON.parse(sessionCookie.value)
      organizerInstagram = session.instagram?.toLowerCase()
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Verify the event exists and belongs to this organizer
    const event = await prisma.eventSubmission.findFirst({
      where: {
        id: eventId,
        organizerInstagram: {
          equals: organizerInstagram,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        eventName: true,
        waiverEnabled: true,
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or you do not have access' },
        { status: 404 }
      )
    }

    // Get all signed waivers for this event
    const signedWaivers = await prisma.signedWaiver.findMany({
      where: { eventId },
      orderBy: { signedAt: 'desc' },
      select: {
        id: true,
        signeeEmail: true,
        signeeName: true,
        signatureType: true,
        signedAt: true,
        ipAddress: true,
        templateId: true,
        customWaiverText: true,
        agreedText: true,
        pdfUrl: true,
        template: {
          select: {
            name: true,
            version: true,
          }
        },
        attendance: {
          select: {
            name: true,
            timestamp: true,
            paymentStatus: true,
          }
        }
      }
    })

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.eventName,
        waiverEnabled: event.waiverEnabled,
      },
      waivers: signedWaivers.map(w => ({
        id: w.id,
        signeeEmail: w.signeeEmail,
        signeeName: w.signeeName || w.attendance?.name || 'Anonymous',
        signatureType: w.signatureType,
        signedAt: w.signedAt,
        templateName: w.template?.name || 'Custom Waiver',
        templateVersion: w.template?.version,
        isCustom: !w.templateId,
        hasPdf: !!w.pdfUrl,
        rsvpDate: w.attendance?.timestamp,
        paymentStatus: w.attendance?.paymentStatus,
      })),
      totalSigned: signedWaivers.length,
    })
  } catch (error) {
    console.error('Error fetching signed waivers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signed waivers' },
      { status: 500 }
    )
  }
}
