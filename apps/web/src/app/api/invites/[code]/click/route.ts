import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidInviteCodeFormat } from '@/lib/invite-code'

// POST /api/invites/[code]/click - Track invite link clicks
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const inviteCode = params.code

    // Validate code format
    if (!isValidInviteCodeFormat(inviteCode)) {
      return NextResponse.json(
        { error: 'Invalid invite code format' },
        { status: 400 }
      )
    }

    // Find the invite
    const invite = await prisma.referralInvite.findUnique({
      where: { inviteCode },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Check if expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    // Update invite and referral stats in a transaction
    await prisma.$transaction(async (tx) => {
      // Update invite status to CLICKED and set clickedAt timestamp (only if first click)
      if (invite.status === 'PENDING') {
        await tx.referralInvite.update({
          where: { inviteCode },
          data: {
            status: 'CLICKED',
            clickedAt: new Date(),
          },
        })
      }

      // Update referrer's stats
      await tx.userReferralStats.upsert({
        where: { userId: invite.referrerId },
        create: {
          userId: invite.referrerId,
          totalInvitesSent: 0,
          totalClicks: 1,
          totalConversions: 0,
          totalCreditsEarned: 0,
          currentCreditBalance: 0,
          badges: [],
          currentStreak: 0,
          longestStreak: 0,
        },
        update: {
          totalClicks: {
            increment: 1,
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully',
    })
  } catch (error) {
    console.error('Error tracking invite click:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
