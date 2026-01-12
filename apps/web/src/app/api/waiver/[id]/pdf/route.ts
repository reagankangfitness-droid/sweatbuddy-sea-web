import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateWaiverPdf, WaiverPdfData } from '@/lib/waiver-pdf'

// GET /api/waiver/[id]/pdf - Download signed waiver as PDF
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get organizer session from cookie for authorization
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

    // Find the signed waiver
    const signedWaiver = await prisma.signedWaiver.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            eventName: true,
            organizerInstagram: true,
          }
        },
        template: {
          select: {
            name: true,
            version: true,
            content: true,
          }
        }
      }
    })

    if (!signedWaiver) {
      return NextResponse.json(
        { error: 'Waiver not found' },
        { status: 404 }
      )
    }

    // Verify the organizer owns this event
    if (signedWaiver.event.organizerInstagram.toLowerCase() !== organizerInstagram) {
      return NextResponse.json(
        { error: 'You do not have access to this waiver' },
        { status: 403 }
      )
    }

    // Prepare data for PDF generation
    const pdfData: WaiverPdfData = {
      eventName: signedWaiver.event.eventName,
      eventId: signedWaiver.event.id,
      signeeName: signedWaiver.signeeName || 'Anonymous',
      signeeEmail: signedWaiver.signeeEmail,
      signedAt: signedWaiver.signedAt,
      templateName: signedWaiver.template?.name || null,
      templateVersion: signedWaiver.template?.version || signedWaiver.templateVersion,
      waiverContent: signedWaiver.customWaiverText || signedWaiver.template?.content || 'Waiver content not available',
      agreedText: signedWaiver.agreedText,
      signatureType: signedWaiver.signatureType,
      ipAddress: signedWaiver.ipAddress,
      userAgent: signedWaiver.userAgent,
    }

    // Generate PDF
    const pdfBuffer = await generateWaiverPdf(pdfData)

    // Create filename
    const sanitizedName = (signedWaiver.signeeName || 'anonymous').replace(/[^a-zA-Z0-9]/g, '-')
    const dateStr = signedWaiver.signedAt.toISOString().split('T')[0]
    const filename = `waiver-${sanitizedName}-${dateStr}.pdf`

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF as download
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      }
    })
  } catch (error) {
    console.error('Error generating waiver PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
