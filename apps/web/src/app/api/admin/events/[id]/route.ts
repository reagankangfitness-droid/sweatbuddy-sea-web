import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/events'
import { getAdminActorId, isAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

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
    const adminId = await getAdminActorId(request) ?? 'admin'

    // Get existing event to check if name changed
    const existing = await prisma.eventSubmission.findUnique({
      where: { id },
      select: { eventName: true, slug: true, status: true, eventDate: true, location: true },
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

    // Build update data
    const updateData: Record<string, unknown> = {
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
    }

    // Payment fields (only update if provided)
    if (body.isFree !== undefined) updateData.isFree = body.isFree
    if (body.price !== undefined) updateData.price = body.price ? parseInt(body.price) : null
    if (body.paynowEnabled !== undefined) updateData.paynowEnabled = body.paynowEnabled
    if (body.paynowQrCode !== undefined) updateData.paynowQrCode = body.paynowQrCode || null
    if (body.paynowNumber !== undefined) updateData.paynowNumber = body.paynowNumber || null
    if (body.communityLink !== undefined) updateData.communityLink = body.communityLink || null
    if (body.capacity !== undefined) updateData.maxTickets = body.capacity ? parseInt(body.capacity) : null

    // Update database event
    const updated = await prisma.eventSubmission.update({
      where: { id },
      data: updateData,
    })

    await logAdminAction({
      action: 'update_event_submission',
      targetType: 'event_submission',
      targetId: id,
      adminId,
      details: {
        previous: existing,
        next: {
          eventName: updated.eventName,
          slug: updated.slug,
          status: updated.status,
          eventDate: updated.eventDate?.toISOString() ?? null,
          location: updated.location,
        },
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
    const adminId = await getAdminActorId(request) ?? 'admin'
    const existing = await prisma.eventSubmission.findUnique({
      where: { id },
      select: { eventName: true, slug: true, status: true, eventDate: true, location: true },
    })

    // Set to rejected in database
    await prisma.eventSubmission.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    await logAdminAction({
      action: 'remove_event_submission',
      targetType: 'event_submission',
      targetId: id,
      adminId,
      details: { previous: existing },
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
