import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

// POST /api/events/[eventId]/waiver/sign - Sign a waiver
export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await request.json()

    const {
      attendanceId,
      signeeEmail,
      signeeName,
      signatureType = 'checkbox',
      signatureData,
      agreedText,
    } = body

    // Validate required fields
    if (!attendanceId || !signeeEmail || !agreedText) {
      return NextResponse.json(
        { error: 'Missing required fields: attendanceId, signeeEmail, agreedText' },
        { status: 400 }
      )
    }

    // Get the event and verify waiver is enabled
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        waiverEnabled: true,
        waiverTemplateId: true,
        waiverCustomText: true,
        waiverTemplate: {
          select: {
            id: true,
            version: true,
            content: true,
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!event.waiverEnabled) {
      return NextResponse.json(
        { error: 'Waiver is not required for this event' },
        { status: 400 }
      )
    }

    // Verify the attendance record exists and belongs to this event
    const attendance = await prisma.eventAttendance.findFirst({
      where: {
        id: attendanceId,
        eventId: eventId,
        email: signeeEmail,
      }
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Check if waiver already signed
    const existingWaiver = await prisma.signedWaiver.findUnique({
      where: { attendanceId }
    })

    if (existingWaiver) {
      return NextResponse.json(
        { error: 'Waiver already signed', signedWaiverId: existingWaiver.id },
        { status: 409 }
      )
    }

    // Get request metadata for legal records
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || null
    const userAgent = headersList.get('user-agent') || null

    // Determine template info
    const templateId = event.waiverTemplate?.id || null
    const templateVersion = event.waiverTemplate?.version || null
    const customWaiverText = !templateId ? event.waiverCustomText : null

    // Create the signed waiver record
    const signedWaiver = await prisma.signedWaiver.create({
      data: {
        eventId,
        attendanceId,
        templateId,
        templateVersion,
        customWaiverText,
        signeeEmail,
        signeeName: signeeName || null,
        signatureType,
        signatureData: signatureData || null,
        agreedText,
        ipAddress,
        userAgent,
        signedAt: new Date(),
      }
    })

    // Update the attendance record with waiver signed timestamp
    await prisma.eventAttendance.update({
      where: { id: attendanceId },
      data: {
        waiverSignedAt: new Date(),
        waiverRequired: true,
      }
    })

    return NextResponse.json({
      success: true,
      signedWaiverId: signedWaiver.id,
      signedAt: signedWaiver.signedAt,
    })
  } catch (error) {
    console.error('Error signing waiver:', error)
    return NextResponse.json(
      { error: 'Failed to sign waiver' },
      { status: 500 }
    )
  }
}
