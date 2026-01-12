import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[eventId]/waiver - Get waiver requirements for an event
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params

    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        waiverEnabled: true,
        waiverTemplateId: true,
        waiverCustomText: true,
        waiverTemplate: {
          select: {
            id: true,
            name: true,
            content: true,
            version: true,
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

    // If waiver is not enabled, return early
    if (!event.waiverEnabled) {
      return NextResponse.json({
        enabled: false,
        eventId: event.id,
        eventName: event.eventName,
      })
    }

    // Determine waiver content
    let waiverContent: string | null = null
    let templateId: string | null = null
    let templateVersion: number | null = null

    if (event.waiverTemplate) {
      waiverContent = event.waiverTemplate.content
      templateId = event.waiverTemplate.id
      templateVersion = event.waiverTemplate.version
    } else if (event.waiverCustomText) {
      waiverContent = event.waiverCustomText
    }

    return NextResponse.json({
      enabled: true,
      eventId: event.id,
      eventName: event.eventName,
      templateId,
      templateVersion,
      templateName: event.waiverTemplate?.name || null,
      content: waiverContent,
      isCustom: !event.waiverTemplateId && !!event.waiverCustomText,
    })
  } catch (error) {
    console.error('Error fetching event waiver:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiver' },
      { status: 500 }
    )
  }
}
