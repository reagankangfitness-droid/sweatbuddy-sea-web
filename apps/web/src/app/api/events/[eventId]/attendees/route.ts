import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint - returns attendee names (not emails) for display
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      )
    }

    // Get attendees for this event
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      take: 50, // Limit to prevent large responses
      select: {
        id: true,
        name: true,
        timestamp: true,
        // Intentionally NOT selecting email for privacy
      },
    })

    // Format for display - only expose first name and initial
    const publicAttendees = attendees.map((a) => {
      const name = a.name?.trim()
      let displayName = 'Anonymous'

      if (name) {
        // Show first name only, or first name + last initial
        const parts = name.split(' ').filter(Boolean)
        if (parts.length >= 2) {
          displayName = `${parts[0]} ${parts[1][0]}.`
        } else if (parts.length === 1) {
          displayName = parts[0]
        }
      }

      return {
        id: a.id,
        name: displayName,
        // Generate a consistent color based on the id
        color: getColorFromId(a.id),
      }
    })

    return NextResponse.json({
      eventId,
      count: attendees.length,
      attendees: publicAttendees,
    })
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}

// Generate a consistent pastel color from an ID
function getColorFromId(id: string): string {
  const colors = [
    '#FF6B6B', // coral red
    '#4ECDC4', // teal
    '#45B7D1', // sky blue
    '#96CEB4', // sage green
    '#FFEAA7', // soft yellow
    '#DDA0DD', // plum
    '#98D8C8', // mint
    '#F7DC6F', // golden
    '#BB8FCE', // lavender
    '#85C1E9', // light blue
  ]

  // Simple hash from id
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash = hash & hash
  }

  return colors[Math.abs(hash) % colors.length]
}
