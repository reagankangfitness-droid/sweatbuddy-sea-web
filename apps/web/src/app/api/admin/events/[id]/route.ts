import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/events'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sweatbuddies-admin-2024'

function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  return authHeader === ADMIN_SECRET
}

// UPDATE event (database only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Generate slug from event name
    const slug = generateSlug(body.name)

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
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE event (set to rejected)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
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
