import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidInviteCodeFormat } from '@/lib/invite-code'

// GET /api/invites/[code] - Get invite details by code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: inviteCode } = await params

    // Validate code format
    if (!isValidInviteCodeFormat(inviteCode)) {
      return NextResponse.json(
        { error: 'Invalid invite code format' },
        { status: 400 }
      )
    }

    // Fetch invite with related data
    const invite = await prisma.referralInvite.findUnique({
      where: { inviteCode },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            city: true,
            startTime: true,
            endTime: true,
            price: true,
            currency: true,
            imageUrl: true,
            maxPeople: true,
            userActivities: {
              where: { status: 'JOINED' },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Check if expired
    const isExpired = new Date() > new Date(invite.expiresAt)
    if (isExpired && invite.status !== 'EXPIRED') {
      // Update status to expired
      await prisma.referralInvite.update({
        where: { inviteCode },
        data: { status: 'EXPIRED' },
      })
    }

    // Calculate spots remaining
    const currentParticipants = invite.activity.userActivities.length
    const spotsRemaining = invite.activity.maxPeople
      ? invite.activity.maxPeople - currentParticipants
      : null

    return NextResponse.json({
      invite_id: invite.id,
      invite_code: invite.inviteCode,
      status: isExpired ? 'EXPIRED' : invite.status,
      expires_at: invite.expiresAt.toISOString(),
      created_at: invite.createdAt.toISOString(),
      referrer: {
        id: invite.referrer.id,
        name: invite.referrer.name,
        image_url: invite.referrer.imageUrl,
      },
      activity: {
        id: invite.activity.id,
        title: invite.activity.title,
        description: invite.activity.description,
        type: invite.activity.type,
        city: invite.activity.city,
        start_time: invite.activity.startTime?.toISOString(),
        end_time: invite.activity.endTime?.toISOString(),
        price: invite.activity.price,
        currency: invite.activity.currency,
        image_url: invite.activity.imageUrl,
        max_people: invite.activity.maxPeople,
        current_participants: currentParticipants,
        spots_remaining: spotsRemaining,
      },
      discount: {
        type: 'PERCENTAGE',
        value: 50,
        description: '50% off for first-time participants',
      },
    })
  } catch (error) {
    console.error('Error fetching invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
