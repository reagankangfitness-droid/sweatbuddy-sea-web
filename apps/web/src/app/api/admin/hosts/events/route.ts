import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { generateSlug } from '@/lib/events'
import { getCityLocationConfigForPointOrText } from '@/lib/location-config'

// POST: Create an event on behalf of a host
export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      // Host info
      hostEmail,
      hostInstagram,
      hostName,
      // Event info
      eventName,
      category,
      day,
      eventDate,
      time,
      location,
      description,
      imageUrl,
      communityLink,
      recurring,
      // Pricing
      isFree,
      price,
      currency,
      // Settings
      autoApprove,
    } = body

    // Validate required fields
    if (!hostEmail || !hostInstagram) {
      return NextResponse.json(
        { error: 'Host email and Instagram handle are required' },
        { status: 400 }
      )
    }

    if (!eventName || !category || !day || !time || !location) {
      return NextResponse.json(
        { error: 'Event name, category, day, time, and location are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = hostEmail.toLowerCase().trim()
    const normalizedInstagram = hostInstagram.replace('@', '').trim()

    // Generate slug from event name
    const baseSlug = generateSlug(eventName)
    let slug = baseSlug
    let slugSuffix = 1

    // Ensure unique slug
    while (await prisma.eventSubmission.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${slugSuffix}`
      slugSuffix++
    }

    // Parse event date if provided
    let parsedEventDate: Date | null = null
    if (eventDate) {
      parsedEventDate = new Date(eventDate)
      if (isNaN(parsedEventDate.getTime())) {
        parsedEventDate = null
      }
    }

    const cityConfig = getCityLocationConfigForPointOrText(null, location)

    // Create the event submission
    const event = await prisma.eventSubmission.create({
      data: {
        slug,
        eventName,
        category,
        day,
        eventDate: parsedEventDate,
        time,
        location,
        city: cityConfig.slug,
        timezone: cityConfig.timezone,
        description: description || null,
        imageUrl: imageUrl || null,
        communityLink: communityLink || null,
        recurring: recurring ?? true,
        organizerName: hostName || normalizedInstagram,
        organizerInstagram: normalizedInstagram,
        contactEmail: normalizedEmail,
        status: autoApprove ? 'APPROVED' : 'PENDING',
        isFree: isFree ?? true,
        price: price ? Math.round(price * 100) : null, // Convert to cents
        currency: currency || cityConfig.currency,
      },
    })

    // Also ensure the host account exists
    await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        instagram: normalizedInstagram,
        isHost: true,
      },
      create: {
        email: normalizedEmail,
        name: hostName || normalizedInstagram,
        instagram: normalizedInstagram,
        isHost: true,
      },
    })

    await prisma.organizer.upsert({
      where: { email: normalizedEmail },
      update: {
        instagramHandle: normalizedInstagram,
        name: hostName || normalizedInstagram,
      },
      create: {
        email: normalizedEmail,
        instagramHandle: normalizedInstagram,
        name: hostName || normalizedInstagram,
        isVerified: true,
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        eventName: event.eventName,
        status: event.status,
        hostEmail: normalizedEmail,
        hostInstagram: normalizedInstagram,
      },
      message: autoApprove
        ? 'Event created and auto-approved'
        : 'Event created (pending approval)',
      eventUrl: `/event/${event.slug}`,
    })
  } catch (error) {
    console.error('Error creating event for host:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// GET: List events for a specific host
export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const instagram = searchParams.get('instagram')

    if (!email && !instagram) {
      return NextResponse.json(
        { error: 'Email or Instagram handle required' },
        { status: 400 }
      )
    }

    const whereClause: Prisma.EventSubmissionWhereInput = {}
    if (email) {
      whereClause.contactEmail = { equals: email, mode: 'insensitive' }
    }
    if (instagram) {
      whereClause.organizerInstagram = { equals: instagram.replace('@', ''), mode: 'insensitive' }
    }

    const events = await prisma.eventSubmission.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        status: true,
        recurring: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    })
  } catch (error) {
    console.error('Error fetching host events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
