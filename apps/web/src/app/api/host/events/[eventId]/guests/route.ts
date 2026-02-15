import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/host/events/[eventId]/guests
 * Returns attendees with search/filter/sort/pagination
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || 'all'
    const paymentStatus = url.searchParams.get('paymentStatus') || 'all'
    const sort = url.searchParams.get('sort') || 'timestamp'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Verify host owns event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { organizerInstagram: true, maxTickets: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build where clause
    const where: Record<string, unknown> = { eventId }

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by attendance status
    if (status === 'checked-in') {
      where.checkedInAt = { not: null }
    } else if (status === 'no-show') {
      where.actuallyAttended = false
    } else if (status === 'attended') {
      where.actuallyAttended = true
    }

    // Filter by payment status
    if (paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus
    }

    // Sort options
    type SortOrder = 'asc' | 'desc'
    let orderBy: Record<string, SortOrder> = { timestamp: 'desc' }
    if (sort === 'name') orderBy = { name: 'asc' }
    else if (sort === 'payment') orderBy = { paymentStatus: 'asc' }
    else if (sort === 'newest') orderBy = { timestamp: 'desc' }
    else if (sort === 'oldest') orderBy = { timestamp: 'asc' }

    // Get total count for pagination
    const total = await prisma.eventAttendance.count({ where: where as never })

    // Get attendees
    const attendees = await prisma.eventAttendance.findMany({
      where: where as never,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get waitlist count
    const waitlistCount = await prisma.eventWaitlist.count({
      where: { eventId, status: 'WAITING' },
    })

    // Calculate stats
    const allAttendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      select: {
        paymentStatus: true,
        checkedInAt: true,
        actuallyAttended: true,
      },
    })

    const stats = {
      total: allAttendees.length,
      checkedIn: allAttendees.filter(a => a.checkedInAt).length,
      noShow: allAttendees.filter(a => a.actuallyAttended === false).length,
      attended: allAttendees.filter(a => a.actuallyAttended === true).length,
      paid: allAttendees.filter(a => a.paymentStatus === 'paid').length,
      free: allAttendees.filter(a => a.paymentStatus === 'free').length,
      refunded: allAttendees.filter(a => a.paymentStatus === 'refunded').length,
      waitlisted: waitlistCount,
    }

    return NextResponse.json({
      attendees,
      total,
      page,
      pageSize: limit,
      stats,
    })
  } catch (error) {
    console.error('Guest list error:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}

/**
 * PATCH /api/host/events/[eventId]/guests
 * Update notes, tags, or attendance for a single attendee
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const body = await request.json()
    const { attendeeId, hostNotes, taggedAs, actuallyAttended } = body

    if (!attendeeId) {
      return NextResponse.json({ error: 'attendeeId is required' }, { status: 400 })
    }

    // Verify host owns event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { organizerInstagram: true },
    })

    if (!event || event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (hostNotes !== undefined) updateData.hostNotes = hostNotes
    if (taggedAs !== undefined) updateData.taggedAs = taggedAs
    if (actuallyAttended !== undefined) {
      updateData.actuallyAttended = actuallyAttended
      updateData.markedAttendedAt = new Date()
      updateData.markedAttendedBy = session.email
    }

    const updated = await prisma.eventAttendance.update({
      where: { id: attendeeId },
      data: updateData,
    })

    return NextResponse.json({ success: true, attendee: updated })
  } catch (error) {
    console.error('Update guest error:', error)
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
  }
}

/**
 * POST /api/host/events/[eventId]/guests
 * Bulk actions: mark attended, mark no-show, export CSV
 */
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
    const body = await request.json()
    const { action, attendeeIds } = body

    // Verify host owns event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: { organizerInstagram: true },
    })

    if (!event || event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: Record<string, unknown> = { eventId }
    if (attendeeIds && attendeeIds.length > 0) {
      where.id = { in: attendeeIds }
    }

    if (action === 'mark_attended') {
      const result = await prisma.eventAttendance.updateMany({
        where: where as never,
        data: {
          actuallyAttended: true,
          markedAttendedAt: new Date(),
          markedAttendedBy: session.email,
        },
      })
      return NextResponse.json({ success: true, updated: result.count })
    }

    if (action === 'mark_no_show') {
      const result = await prisma.eventAttendance.updateMany({
        where: where as never,
        data: {
          actuallyAttended: false,
          markedAttendedAt: new Date(),
          markedAttendedBy: session.email,
        },
      })
      return NextResponse.json({ success: true, updated: result.count })
    }

    if (action === 'export_csv') {
      const attendees = await prisma.eventAttendance.findMany({
        where: where as never,
        orderBy: { timestamp: 'asc' },
      })

      const headers = ['Name', 'Email', 'Payment Status', 'Payment Amount', 'Checked In', 'Attended', 'Signed Up']
      const rows = attendees.map(a => [
        a.name || '',
        a.email,
        a.paymentStatus || 'free',
        a.paymentAmount ? (a.paymentAmount / 100).toFixed(2) : '0.00',
        a.checkedInAt ? 'Yes' : 'No',
        a.actuallyAttended === true ? 'Yes' : a.actuallyAttended === false ? 'No' : 'Unmarked',
        new Date(a.timestamp).toISOString(),
      ])

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')

      return NextResponse.json({ success: true, csv })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
