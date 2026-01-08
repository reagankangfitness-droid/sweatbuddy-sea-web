import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/events'
import { isAdminRequest } from '@/lib/admin-auth'

// UPDATE event (database only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Get existing event to check if name changed
    const existing = await prisma.eventSubmission.findUnique({
      where: { id },
      select: { eventName: true, slug: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Only regenerate slug if name changed
    let slug = existing.slug
    if (body.name !== existing.eventName) {
      const baseSlug = generateSlug(body.name)
      // Check if slug exists for another event
      const slugExists = await prisma.eventSubmission.findFirst({
        where: { slug: baseSlug, id: { not: id } },
      })
      slug = slugExists ? `${baseSlug}-${id.slice(-6)}` : baseSlug
    }

    // Update database event
    const updated = await prisma.eventSubmission.update({
      where: { id },
      data: {
        eventName: body.name,
        category: body.category,
        day: body.day,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        time: body.time,
        location: body.location,
        description: body.description || null,
        organizerInstagram: body.organizer,
        imageUrl: body.imageUrl || null,
        recurring: body.recurring,
        slug: slug,
      },
    })

    // Revalidate the homepage and event pages to show updated data
    revalidatePath('/')
    revalidatePath('/e/[id]', 'page')

    return NextResponse.json({
      success: true,
      message: 'Event updated',
      event: updated,
    })
  } catch (error) {
    console.error('Error updating event:', error)
    const message = error instanceof Error ? error.message : 'Failed to update event'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE event (set to rejected)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Set to rejected in database
    await prisma.eventSubmission.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    // Revalidate the homepage to remove the event
    revalidatePath('/')
    revalidatePath('/e/[id]', 'page')

    return NextResponse.json({
      success: true,
      message: 'Event removed from listing',
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
