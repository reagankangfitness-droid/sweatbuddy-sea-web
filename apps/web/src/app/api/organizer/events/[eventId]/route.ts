import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizerSession } from '@/lib/organizer-session'

// Get single event details for editing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await getOrganizerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the submission
    const submission = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify ownership
    if (submission.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      event: {
        id: submission.id,
        eventName: submission.eventName,
        category: submission.category,
        day: submission.day,
        eventDate: submission.eventDate?.toISOString() || null,
        time: submission.time,
        location: submission.location,
        latitude: submission.latitude,
        longitude: submission.longitude,
        placeId: submission.placeId,
        description: submission.description,
        imageUrl: submission.imageUrl,
        recurring: submission.recurring,
        organizerName: submission.organizerName,
        organizerInstagram: submission.organizerInstagram,
        contactEmail: submission.contactEmail,
        status: submission.status.toLowerCase(),
        rejectionReason: submission.rejectionReason,
      },
    })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json({ error: 'Failed to get event' }, { status: 500 })
  }
}

// Update event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await getOrganizerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the submission
    const submission = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify ownership
    if (submission.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      eventName,
      category,
      day,
      eventDate,
      time,
      location,
      latitude,
      longitude,
      placeId,
      description,
      imageUrl,
      recurring,
    } = body

    // Update the event
    const updated = await prisma.eventSubmission.update({
      where: { id: eventId },
      data: {
        eventName: eventName || submission.eventName,
        category: category || submission.category,
        day: day || submission.day,
        eventDate: eventDate ? new Date(eventDate) : submission.eventDate,
        time: time || submission.time,
        location: location || submission.location,
        latitude: latitude ?? submission.latitude,
        longitude: longitude ?? submission.longitude,
        placeId: placeId ?? submission.placeId,
        description: description ?? submission.description,
        imageUrl: imageUrl ?? submission.imageUrl,
        recurring: recurring ?? submission.recurring,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: updated.id,
        eventName: updated.eventName,
        status: updated.status.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// Cancel/delete event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await getOrganizerSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the submission
    const submission = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify ownership
    if (submission.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the event
    await prisma.eventSubmission.delete({
      where: { id: eventId },
    })

    // Also delete related attendance records
    await prisma.eventAttendance.deleteMany({
      where: { eventId },
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
