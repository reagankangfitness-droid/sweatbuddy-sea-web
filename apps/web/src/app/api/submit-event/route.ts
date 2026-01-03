import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEventSubmittedEmail } from '@/lib/event-confirmation-email'

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

  // Check if slug exists, if so add suffix
  while (await prisma.eventSubmission.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

interface EventSubmission {
  eventName: string
  category: string
  day: string
  eventDate?: string // ISO date string (e.g., "2024-01-15")
  time: string
  recurring: boolean
  location: string
  latitude?: number
  longitude?: number
  placeId?: string
  description?: string
  imageUrl?: string
  communityLink?: string | null
  organizerName: string
  organizerInstagram: string
  contactEmail: string
  // Pricing fields
  isFree?: boolean
  price?: number | null // Amount in cents
  paynowEnabled?: boolean
  paynowQrCode?: string | null
  paynowNumber?: string | null
  paynowName?: string | null
  stripeEnabled?: boolean
}

export async function POST(request: Request) {
  try {
    const data: EventSubmission = await request.json()
    console.log('Event submission received:', JSON.stringify(data, null, 2))

    // Validate required fields
    const requiredFields: (keyof EventSubmission)[] = [
      'eventName',
      'category',
      'day',
      'time',
      'location',
      'organizerName',
      'organizerInstagram',
      'contactEmail',
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Clean up Instagram handle (remove @ prefix and extract from full URLs)
    let cleanInstagram = data.organizerInstagram
      .replace(/^@/, '') // Remove @ prefix
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '') // Remove Instagram URL prefix
      .replace(/\/$/, '') // Remove trailing slash

    // If it still looks like a URL, try to extract the handle
    if (cleanInstagram.includes('/')) {
      cleanInstagram = cleanInstagram.split('/')[0]
    }

    // Generate URL-friendly slug for shareable links
    const slug = await generateUniqueSlug(data.eventName)

    // Save to database
    const submission = await prisma.eventSubmission.create({
      data: {
        eventName: data.eventName,
        slug,
        category: data.category,
        day: data.day,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        time: data.time,
        recurring: data.recurring ?? true,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        placeId: data.placeId || null,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        communityLink: data.communityLink || null,
        organizerName: data.organizerName,
        organizerInstagram: cleanInstagram,
        contactEmail: data.contactEmail,
        status: 'PENDING',
        // Pricing fields
        isFree: data.isFree ?? true,
        price: data.price || null,
        paynowEnabled: data.paynowEnabled ?? false,
        paynowQrCode: data.paynowQrCode || null,
        paynowNumber: data.paynowNumber || null,
        paynowName: data.paynowName || null,
        stripeEnabled: data.stripeEnabled ?? false,
      },
    })

    console.log('Event submission saved:', {
      id: submission.id,
      eventName: submission.eventName,
      category: submission.category,
      organizer: submission.organizerInstagram,
    })

    // Send confirmation email to host (fire and forget)
    sendEventSubmittedEmail({
      to: submission.contactEmail,
      hostName: submission.organizerName,
      eventName: submission.eventName,
      eventId: submission.id,
    }).catch((err) => {
      console.error('Failed to send submission confirmation email:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully',
      id: submission.id,
    })
  } catch (error) {
    console.error('Error submitting event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to submit event: ${errorMessage}` },
      { status: 500 }
    )
  }
}
