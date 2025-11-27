import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const activityId = params.id

    // Verify activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        title: true,
        description: true,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Simple share URL
    const shareUrl = `https://sweatbuddies.co/activities/${activity.id}`

    return NextResponse.json({
      share_url: shareUrl,
      activity: {
        id: activity.id,
        title: activity.title,
      },
    })
  } catch (error) {
    console.error('Error generating share link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
