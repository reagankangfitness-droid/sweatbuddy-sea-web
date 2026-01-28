import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({ where: { id: userId } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await params

  const wave = await prisma.waveActivity.findUnique({ where: { id } })

  if (!wave) return NextResponse.json({ error: 'Wave not found' }, { status: 404 })
  if (wave.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Wave has expired' }, { status: 410 })
  }

  const result = await prisma.$transaction(async (tx) => {
    // Check if already joined — inside transaction to prevent race
    const existing = await tx.waveParticipant.findUnique({
      where: { waveActivityId_userId: { waveActivityId: id, userId: dbUser.id } },
    })
    if (existing) return { alreadyJoined: true as const }

    // Add participant
    await tx.waveParticipant.create({
      data: { waveActivityId: id, userId: dbUser.id },
    })

    // Re-read state inside transaction for accurate count
    const freshWave = await tx.waveActivity.findUniqueOrThrow({ where: { id } })
    const newCount = await tx.waveParticipant.count({ where: { waveActivityId: id } })

    let chatId = freshWave.chatId
    let unlocked = freshWave.isUnlocked

    // Check if threshold reached — unlock crew chat
    if (!freshWave.isUnlocked && newCount >= freshWave.waveThreshold) {
      // Create crew chat
      const chat = await tx.crewChat.create({
        data: {
          activityType: freshWave.activityType,
          area: freshWave.area,
        },
      })
      chatId = chat.id

      // Add all current participants as members
      const participants = await tx.waveParticipant.findMany({
        where: { waveActivityId: id },
        select: { userId: true },
      })

      await tx.crewChatMember.createMany({
        data: participants.map((p) => ({
          chatId: chat.id,
          userId: p.userId,
        })),
      })

      // Update wave
      await tx.waveActivity.update({
        where: { id },
        data: { isUnlocked: true, chatId: chat.id },
      })

      unlocked = true
    }

    return { alreadyJoined: false as const, participantCount: newCount, isUnlocked: unlocked, chatId }
  })

  if (result.alreadyJoined) {
    return NextResponse.json({ error: 'Already joined this wave' }, { status: 409 })
  }

  return NextResponse.json(result, { status: 201 })
}
