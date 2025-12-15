import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sweatbuddies-admin-2024'

function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  return authHeader === ADMIN_SECRET
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
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
      imageUrl: event.imageUrl,
      recurring: event.recurring,
      source: 'database' as const,
    }))

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
