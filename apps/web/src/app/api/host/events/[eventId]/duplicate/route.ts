import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Generate URL-friendly slug from event name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Remove consecutive hyphens
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
    .substring(0, 50)         // Limit length
}

// Generate unique slug by checking existing ones
async function generateUniqueSlug(eventName: string): Promise<string> {
  const baseSlug = generateSlug(eventName)
  let slug = baseSlug
  let counter = 2

  while (await prisma.eventSubmission.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params

    // Find the original event
    const originalEvent = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
    })

    if (!originalEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify ownership - compare Instagram handles (case-insensitive)
    if (originalEvent.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate next occurrence date for recurring events
    let newEventDate: Date | null = null
    if (originalEvent.recurring && originalEvent.day) {
      newEventDate = calculateNextDate(originalEvent.day)
    } else if (originalEvent.eventDate) {
      // For non-recurring events, set date to next week
      const nextWeek = new Date(originalEvent.eventDate)
      nextWeek.setDate(nextWeek.getDate() + 7)
      newEventDate = nextWeek
    }

    // Generate slug for the duplicate
    const newEventName = `${originalEvent.eventName} (Copy)`
    const slug = await generateUniqueSlug(newEventName)

    // Create duplicate event
    const duplicatedEvent = await prisma.eventSubmission.create({
      data: {
        eventName: newEventName,
        slug,
        category: originalEvent.category,
        day: originalEvent.day,
        eventDate: newEventDate,
        time: originalEvent.time,
        location: originalEvent.location,
        latitude: originalEvent.latitude,
        longitude: originalEvent.longitude,
        placeId: originalEvent.placeId,
        description: originalEvent.description,
        imageUrl: originalEvent.imageUrl,
        communityLink: originalEvent.communityLink,
        recurring: originalEvent.recurring,
        organizerName: originalEvent.organizerName,
        organizerInstagram: originalEvent.organizerInstagram,
        contactEmail: originalEvent.contactEmail,
        // Pricing fields
        isFree: originalEvent.isFree,
        price: originalEvent.price,
        paynowEnabled: originalEvent.paynowEnabled,
        paynowQrCode: originalEvent.paynowQrCode,
        paynowNumber: originalEvent.paynowNumber,
        paynowName: originalEvent.paynowName,
        stripeEnabled: originalEvent.stripeEnabled,
        // Status - needs re-approval
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: duplicatedEvent.id,
        name: duplicatedEvent.eventName,
        status: duplicatedEvent.status,
      },
      message: 'Event duplicated! It will be reviewed before going live.',
    })
  } catch (error) {
    console.error('Duplicate event error:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate event' },
      { status: 500 }
    )
  }
}

function calculateNextDate(dayOfWeek: string): Date {
  const days: Record<string, number> = {
    'sundays': 0, 'sunday': 0,
    'mondays': 1, 'monday': 1,
    'tuesdays': 2, 'tuesday': 2,
    'wednesdays': 3, 'wednesday': 3,
    'thursdays': 4, 'thursday': 4,
    'fridays': 5, 'friday': 5,
    'saturdays': 6, 'saturday': 6,
  }

  const targetDay = days[dayOfWeek.toLowerCase()]
  if (targetDay === undefined) {
    // Default to next week if day not recognized
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek
  }

  const today = new Date()
  const currentDay = today.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7

  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysUntilTarget)
  nextDate.setHours(0, 0, 0, 0)

  return nextDate
}
