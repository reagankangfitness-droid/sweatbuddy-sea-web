import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT /api/host/community/notes - Update notes for an attendee
export async function PUT(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, notes } = await request.json() as {
      email: string
      notes: string | null
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Upsert the notes record
    const record = await prisma.hostAttendeeNotes.upsert({
      where: {
        hostInstagram_attendeeEmail: {
          hostInstagram: session.instagramHandle,
          attendeeEmail: email.toLowerCase(),
        },
      },
      create: {
        hostInstagram: session.instagramHandle,
        attendeeEmail: email.toLowerCase(),
        notes: notes || null,
      },
      update: {
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      notes: record.notes,
    })
  } catch (error) {
    console.error('Notes API error:', error)
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    )
  }
}
