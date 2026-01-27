import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ImDownActivity } from '@prisma/client'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({ where: { id: userId } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const { recipientId, activityType } = body as {
    recipientId: string
    activityType: ImDownActivity
  }

  if (!recipientId || !activityType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate recipient has an active status
  const recipientStatus = await prisma.userStatus.findUnique({
    where: { userId: recipientId },
  })

  if (!recipientStatus || recipientStatus.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Recipient status has expired' }, { status: 400 })
  }

  // Check no existing match in either direction
  const existing = await prisma.buddyMatch.findFirst({
    where: {
      OR: [
        { initiatorId: dbUser.id, recipientId },
        { initiatorId: recipientId, recipientId: dbUser.id },
      ],
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already matched' }, { status: 409 })
  }

  // Create match + chat in transaction
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.buddyMatch.create({
      data: {
        initiatorId: dbUser.id,
        recipientId,
        activityType,
      },
    })

    const chat = await tx.buddyChat.create({
      data: { matchId: match.id },
    })

    return { match, chat }
  })

  return NextResponse.json(result, { status: 201 })
}
