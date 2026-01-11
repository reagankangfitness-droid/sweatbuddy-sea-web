import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get approved events from database only
    const dbEvents = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    })

    // Convert database events to common format
    const events = dbEvents.map(event => ({
      id: event.id,
      name: event.eventName,
      category: event.category,
      day: event.day,
      eventDate: event.eventDate?.toISOString().split('T')[0] || null,
      time: event.time,
      location: event.location,
      description: event.description,
      organizer: event.organizerInstagram,
      organizerName: event.organizerName,
      contactEmail: event.contactEmail,
      imageUrl: event.imageUrl,
      recurring: event.recurring,
      // Payment fields
      isFree: event.isFree,
      price: event.price,
      paynowEnabled: event.paynowEnabled,
      paynowQrCode: event.paynowQrCode,
      paynowNumber: event.paynowNumber,
      // Community & capacity
      communityLink: event.communityLink,
      capacity: event.maxTickets,
      source: 'database' as const,
    }))

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
