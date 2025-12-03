import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface EventSubmission {
  eventName: string
  category: string
  day: string
  time: string
  recurring: boolean
  location: string
  latitude?: number
  longitude?: number
  placeId?: string
  description?: string
  organizerName: string
  organizerInstagram: string
  contactEmail: string
}

export async function POST(request: Request) {
  try {
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

    // Clean up Instagram handle (remove @ if present)
    const cleanInstagram = data.organizerInstagram.replace(/^@/, '')

    // Save to database
    const submission = await prisma.eventSubmission.create({
      data: {
        eventName: data.eventName,
        category: data.category,
        day: data.day,
        time: data.time,
        recurring: data.recurring ?? true,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        placeId: data.placeId || null,
        description: data.description || null,
        organizerName: data.organizerName,
        organizerInstagram: cleanInstagram,
        contactEmail: data.contactEmail,
        status: 'PENDING',
      },
    })

    console.log('Event submission saved:', {
      id: submission.id,
      eventName: submission.eventName,
      category: submission.category,
      organizer: submission.organizerInstagram,
    })

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully',
      id: submission.id,
    })
  } catch (error) {
    console.error('Error submitting event:', error)
    return NextResponse.json(
      { error: 'Failed to submit event' },
      { status: 500 }
    )
  }
}
