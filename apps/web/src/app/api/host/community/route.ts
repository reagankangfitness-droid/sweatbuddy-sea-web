import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/host/community - Get all attendees across all host's events
export async function GET(request: NextRequest) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // 'all' | 'attended'
    const sort = searchParams.get('sort') || 'lastSeen' // 'name' | 'events' | 'lastSeen'
    const order = searchParams.get('order') || 'desc' // 'asc' | 'desc'
    const search = searchParams.get('search') || ''

    // Get all host's events
    const hostEvents = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        status: 'APPROVED',
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        communityLink: true,
      },
      orderBy: { eventDate: 'desc' },
    })

    const eventIds = hostEvents.map(e => e.id)

    if (eventIds.length === 0) {
      return NextResponse.json({
        attendees: [],
        stats: { totalPeople: 0, totalAttended: 0, regulars: 0 },
        events: hostEvents,
      })
    }

    // Get all attendance records for host's events
    const allAttendances = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        // Filter by payment status to only include confirmed RSVPs
        OR: [
          { paymentStatus: 'paid' },
          { paymentStatus: 'free' },
          { paymentStatus: null },
        ],
      },
      select: {
        id: true,
        eventId: true,
        eventName: true,
        email: true,
        name: true,
        timestamp: true,
        paymentStatus: true,
        paymentAmount: true,
        actuallyAttended: true,
      },
    })

    // Get notes for all attendees
    const attendeeEmails = [...new Set(allAttendances.map(a => a.email.toLowerCase()))]
    const notes = await prisma.hostAttendeeNotes.findMany({
      where: {
        hostInstagram: { equals: session.instagramHandle, mode: 'insensitive' },
        attendeeEmail: { in: attendeeEmails, mode: 'insensitive' },
      },
    })
    const notesMap = new Map(notes.map(n => [n.attendeeEmail.toLowerCase(), n.notes]))

    // Aggregate by email
    const attendeeMap = new Map<string, {
      email: string
      name: string | null
      eventsRSVPd: number
      eventsAttended: number
      lastEventDate: Date | null
      lastEventName: string | null
      totalSpent: number
      notes: string | null
      hasAttended: boolean
    }>()

    for (const attendance of allAttendances) {
      const emailKey = attendance.email.toLowerCase()
      const existing = attendeeMap.get(emailKey)

      if (existing) {
        existing.eventsRSVPd++
        if (attendance.actuallyAttended === true) {
          existing.eventsAttended++
          existing.hasAttended = true
        }
        if (attendance.timestamp && (!existing.lastEventDate || attendance.timestamp > existing.lastEventDate)) {
          existing.lastEventDate = attendance.timestamp
          existing.lastEventName = attendance.eventName
        }
        if (attendance.paymentAmount) {
          existing.totalSpent += attendance.paymentAmount
        }
        // Use latest non-null name
        if (attendance.name && !existing.name) {
          existing.name = attendance.name
        }
      } else {
        attendeeMap.set(emailKey, {
          email: attendance.email,
          name: attendance.name,
          eventsRSVPd: 1,
          eventsAttended: attendance.actuallyAttended === true ? 1 : 0,
          lastEventDate: attendance.timestamp,
          lastEventName: attendance.eventName,
          totalSpent: attendance.paymentAmount || 0,
          notes: notesMap.get(emailKey) || null,
          hasAttended: attendance.actuallyAttended === true,
        })
      }
    }

    // Convert to array and apply filters
    let attendees = Array.from(attendeeMap.values())

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      attendees = attendees.filter(a =>
        a.email.toLowerCase().includes(searchLower) ||
        (a.name && a.name.toLowerCase().includes(searchLower))
      )
    }

    // Apply attended filter
    if (filter === 'attended') {
      attendees = attendees.filter(a => a.hasAttended)
    }

    // Calculate stats before sorting
    const stats = {
      totalPeople: attendeeMap.size,
      totalAttended: Array.from(attendeeMap.values()).filter(a => a.hasAttended).length,
      regulars: Array.from(attendeeMap.values()).filter(a => a.eventsRSVPd >= 3).length,
    }

    // Sort
    attendees.sort((a, b) => {
      let comparison = 0
      switch (sort) {
        case 'name':
          comparison = (a.name || a.email).localeCompare(b.name || b.email)
          break
        case 'events':
          comparison = a.eventsRSVPd - b.eventsRSVPd
          break
        case 'lastSeen':
        default:
          const dateA = a.lastEventDate?.getTime() || 0
          const dateB = b.lastEventDate?.getTime() || 0
          comparison = dateA - dateB
          break
      }
      return order === 'desc' ? -comparison : comparison
    })

    // Format response
    const formattedAttendees = attendees.map(a => ({
      email: a.email,
      name: a.name,
      eventsRSVPd: a.eventsRSVPd,
      eventsAttended: a.eventsAttended,
      lastEventDate: a.lastEventDate?.toISOString() || null,
      lastEventName: a.lastEventName,
      totalSpent: a.totalSpent,
      notes: a.notes,
    }))

    return NextResponse.json({
      attendees: formattedAttendees,
      stats,
      events: hostEvents.map(e => ({
        id: e.id,
        name: e.eventName,
        date: e.eventDate?.toISOString() || null,
      })),
      communityLink: hostEvents.find(e => e.communityLink)?.communityLink || null,
    })
  } catch (error) {
    console.error('Community API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community data' },
      { status: 500 }
    )
  }
}
