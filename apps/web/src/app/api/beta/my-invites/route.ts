import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserInviteCodes, createUserInviteCodes } from '@/lib/beta'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from our database
    const user = await prisma.user.findFirst({
      where: { id: clerkUserId },
      select: { id: true, betaInvitesRemaining: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const codes = await getUserInviteCodes(user.id)

    return NextResponse.json({
      codes: codes.map((c) => ({
        code: c.code,
        used: c.currentUses >= c.maxUses,
        usedAt: c.firstUsedAt,
        createdAt: c.createdAt,
      })),
      invitesRemaining: user.betaInvitesRemaining,
    })
  } catch (error) {
    console.error('Get invites error:', error)
    return NextResponse.json(
      { error: 'Failed to get invite codes' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from our database
    const user = await prisma.user.findFirst({
      where: { id: clerkUserId },
      select: { id: true, betaInvitesRemaining: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has invites remaining
    if (user.betaInvitesRemaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'No invites remaining' },
        { status: 400 }
      )
    }

    // Create one new invite code
    const codes = await createUserInviteCodes(user.id, 1)

    // Decrement user's remaining invites
    await prisma.user.update({
      where: { id: user.id },
      data: {
        betaInvitesRemaining: { decrement: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      code: codes[0].code,
      invitesRemaining: user.betaInvitesRemaining - 1,
    })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invite code' },
      { status: 500 }
    )
  }
}
