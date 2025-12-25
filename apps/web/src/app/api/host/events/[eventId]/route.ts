import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch single event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Find the event submission
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        description: true,
        imageUrl: true,
        communityLink: true,
        recurring: true,
        organizerInstagram: true,
        status: true,
        // Pricing fields
        isFree: true,
        price: true,
        paynowEnabled: true,
        paynowQrCode: true,
        paynowNumber: true,
        paynowName: true,
        stripeEnabled: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify ownership - compare Instagram handles (case-insensitive)
    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      id: event.id,
      name: event.eventName,
      category: event.category,
      day: event.day,
      date: event.eventDate?.toISOString().split('T')[0] || null,
      time: event.time,
      location: event.location,
      description: event.description,
      imageUrl: event.imageUrl,
      communityLink: event.communityLink,
      recurring: event.recurring,
      status: event.status,
      // Pricing fields
      isFree: event.isFree,
      price: event.price,
      paynowEnabled: event.paynowEnabled,
      paynowQrCode: event.paynowQrCode,
      paynowNumber: event.paynowNumber,
      paynowName: event.paynowName,
      stripeEnabled: event.stripeEnabled,
    })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PUT - Update event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const updates = await request.json()

    // Find the event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify ownership
    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update allowed fields
    const updateData: Record<string, unknown> = {}

    if (updates.name !== undefined) updateData.eventName = updates.name
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.day !== undefined) updateData.day = updates.day
    if (updates.date !== undefined) updateData.eventDate = updates.date ? new Date(updates.date) : null
    if (updates.time !== undefined) updateData.time = updates.time
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.recurring !== undefined) updateData.recurring = updates.recurring
    if (updates.communityLink !== undefined) updateData.communityLink = updates.communityLink || null
    // Pricing fields
    if (updates.isFree !== undefined) updateData.isFree = updates.isFree
    if (updates.price !== undefined) updateData.price = updates.price
    if (updates.paynowEnabled !== undefined) updateData.paynowEnabled = updates.paynowEnabled
    if (updates.paynowQrCode !== undefined) updateData.paynowQrCode = updates.paynowQrCode || null
    if (updates.paynowNumber !== undefined) updateData.paynowNumber = updates.paynowNumber || null
    if (updates.paynowName !== undefined) updateData.paynowName = updates.paynowName || null
    if (updates.stripeEnabled !== undefined) updateData.stripeEnabled = updates.stripeEnabled

    const updatedEvent = await prisma.eventSubmission.update({
      where: { id: eventId },
      data: updateData,
    })

    return NextResponse.json({
      id: updatedEvent.id,
      name: updatedEvent.eventName,
      category: updatedEvent.category,
      day: updatedEvent.day,
      date: updatedEvent.eventDate?.toISOString().split('T')[0] || null,
      time: updatedEvent.time,
      location: updatedEvent.location,
      description: updatedEvent.description,
      imageUrl: updatedEvent.imageUrl,
      communityLink: updatedEvent.communityLink,
      recurring: updatedEvent.recurring,
      // Pricing fields
      isFree: updatedEvent.isFree,
      price: updatedEvent.price,
      paynowEnabled: updatedEvent.paynowEnabled,
      paynowQrCode: updatedEvent.paynowQrCode,
      paynowNumber: updatedEvent.paynowNumber,
      paynowName: updatedEvent.paynowName,
      stripeEnabled: updatedEvent.stripeEnabled,
    })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}
