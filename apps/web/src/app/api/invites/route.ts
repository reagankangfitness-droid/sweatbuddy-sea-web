import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInviteCode, generateInviteLink } from '@/lib/invite-code'

// POST /api/invites - Create a new referral invite
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activity_id, friend_email, friend_name } = body

    if (!activity_id) {
      return NextResponse.json(
        { error: 'activity_id is required' },
        { status: 400 }
      )
    }

    // Verify activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activity_id, deletedAt: null },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Ensure user exists in database
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    })

    // Generate unique invite code
    const inviteCode = await generateInviteCode()
    const inviteLink = generateInviteLink(inviteCode)

    // Set expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create invite and update stats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the invite
      const invite = await tx.referralInvite.create({
        data: {
          referrerId: userId,
          activityId: activity_id,
          inviteCode,
          inviteLink,
          expiresAt,
          friendEmail: friend_email || null,
          friendName: friend_name || null,
          status: 'PENDING',
        },
      })

      // Initialize or update user referral stats
      await tx.userReferralStats.upsert({
        where: { userId },
        create: {
          userId,
          totalInvitesSent: 1,
          totalClicks: 0,
          totalConversions: 0,
          totalCreditsEarned: 0,
          currentCreditBalance: 0,
          badges: [],
          currentStreak: 0,
          longestStreak: 0,
        },
        update: {
          totalInvitesSent: {
            increment: 1,
          },
        },
      })

      return invite
    })

    // Return response in the format specified
    return NextResponse.json(
      {
        invite_id: result.id,
        invite_code: result.inviteCode,
        invite_link: result.inviteLink,
        expires_at: result.expiresAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
