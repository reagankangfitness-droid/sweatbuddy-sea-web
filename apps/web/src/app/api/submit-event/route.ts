import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEventSubmittedEmail } from '@/lib/event-confirmation-email'
import {
  isHostTrusted,
  moderateEventContent,
  containsBlockedContent,
} from '@/lib/content-moderation'

// Geocode a location string to get coordinates
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || !location) return null

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location
    }
    return null
  } catch {
    return null
  }
}

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
// Note: This function provides a best-effort unique slug, but the actual
// uniqueness is enforced by the database constraint. The caller should
// handle unique constraint violations and retry if needed.
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

// Create event with retry on slug collision
async function createEventWithUniqueSlug(
  data: Parameters<typeof prisma.eventSubmission.create>[0]['data'],
  eventName: string,
  maxRetries = 3
): Promise<ReturnType<typeof prisma.eventSubmission.create>> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Generate a new slug (with random suffix on retry)
      let slug = await generateUniqueSlug(eventName)
      if (attempt > 0) {
        // Add random suffix on retry to avoid collision
        slug = `${slug}-${Date.now().toString(36).slice(-4)}`
      }

      return await prisma.eventSubmission.create({
        data: {
          ...data,
          slug,
        },
      })
    } catch (error) {
      lastError = error as Error
      // Check if this is a unique constraint violation on slug
      const isSlugConflict =
        error instanceof Error &&
        error.message.includes('Unique constraint') &&
        error.message.includes('slug')

      if (!isSlugConflict) {
        throw error // Re-throw non-slug errors
      }
      // Otherwise, retry with a new slug
    }
  }

  throw lastError || new Error('Failed to create event after max retries')
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
  // User account link
  clerkUserId?: string | null
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to submit an event.' },
        { status: 401 }
      )
    }

    const data: EventSubmission = await request.json()

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

    // Get or create User record for this Clerk user
    const clerkUser = await currentUser()
    let dbUserId: string | null = null

    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase()
      if (email) {
        // Try to find existing user by email
        let user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })

        // Create user if doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
              imageUrl: clerkUser.imageUrl || null,
              instagram: cleanInstagram || null,
              isHost: true, // Mark as host since they're submitting an event
            },
          })
        } else {
          // Update user to mark as host and add instagram if not set
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isHost: true,
              instagram: cleanInstagram || undefined,
            },
          })
        }

        dbUserId = user.id
      }
    }

    // === HYBRID MODERATION SYSTEM ===
    // 1. Check if host is trusted (has previous approved events)
    // 2. If new host, check keyword blocklist
    // 3. If passes blocklist, run AI moderation
    // 4. Only flagged content goes to manual review

    let status: 'APPROVED' | 'PENDING' | 'REJECTED' = 'PENDING'
    let moderationNotes: string | null = null

    const eventContent = {
      eventName: data.eventName,
      description: data.description,
      organizerName: data.organizerName,
      organizerInstagram: cleanInstagram,
      location: data.location,
      communityLink: data.communityLink,
    }

    // Step 1: Check if host is trusted
    const { trusted, approvedCount } = await isHostTrusted(
      prisma,
      data.contactEmail,
      dbUserId
    )

    if (trusted) {
      // Trusted host - auto-approve
      status = 'APPROVED'
      moderationNotes = `Auto-approved: Trusted host with ${approvedCount} previous approved event(s)`
    } else {
      // Step 2: Check keyword blocklist (fast pre-filter)
      const blockCheck = containsBlockedContent(eventContent)

      if (blockCheck.blocked) {
        // Blocked content - reject immediately
        status = 'REJECTED'
        moderationNotes = `Auto-rejected: ${blockCheck.reason}`
      } else {
        // Step 3: Run AI moderation for new hosts
        const aiResult = await moderateEventContent(eventContent)

        if (aiResult.approved) {
          // AI approved - auto-approve new host
          status = 'APPROVED'
          moderationNotes = 'Auto-approved: Passed AI moderation'
        } else {
          // AI flagged - send to manual review
          status = 'PENDING'
          moderationNotes = `Pending review: ${aiResult.reason || 'AI flagged for review'}. Flags: ${aiResult.flags.join(', ') || 'none'}`
        }
      }
    }

    // Geocode location if coordinates are missing
    let latitude = data.latitude || null
    let longitude = data.longitude || null

    if (!latitude || !longitude) {
      const coords = await geocodeLocation(data.location)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
      }
    }

    // Save to database with unique slug (handles race conditions)
    const submission = await createEventWithUniqueSlug(
      {
        eventName: data.eventName,
        category: data.category,
        day: data.day,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        time: data.time,
        recurring: data.recurring ?? true,
        location: data.location,
        latitude,
        longitude,
        placeId: data.placeId || null,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        communityLink: data.communityLink || null,
        organizerName: data.organizerName,
        organizerInstagram: cleanInstagram,
        contactEmail: data.contactEmail,
        status,
        moderationNotes,
        // Pricing fields
        isFree: data.isFree ?? true,
        price: data.price || null,
        paynowEnabled: data.paynowEnabled ?? false,
        paynowQrCode: data.paynowQrCode || null,
        paynowNumber: data.paynowNumber || null,
        paynowName: data.paynowName || null,
        stripeEnabled: data.stripeEnabled ?? false,
        // Link to user account
        submittedByUserId: dbUserId,
      },
      data.eventName
    )

    // Send confirmation email to host (fire and forget)
    sendEventSubmittedEmail({
      to: submission.contactEmail,
      hostName: submission.organizerName,
      eventName: submission.eventName,
      eventId: submission.id,
    }).catch(() => {
      // Email errors handled silently
    })

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully',
      id: submission.id,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to submit event: ${errorMessage}` },
      { status: 500 }
    )
  }
}
