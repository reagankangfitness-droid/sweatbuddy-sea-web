import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Prevent creator from leaving their own wave
  const wave = await prisma.waveActivity.findUnique({ where: { id } })
  if (!wave) return NextResponse.json({ error: 'Wave not found' }, { status: 404 })
  if (wave.creatorId === userId) {
    return NextResponse.json({ error: 'Creator cannot leave their own wave' }, { status: 403 })
  }

  const participant = await prisma.waveParticipant.findUnique({
    where: { waveActivityId_userId: { waveActivityId: id, userId } },
  })

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 404 })
  }

  // Remove participant and crew chat membership atomically
  await prisma.$transaction(async (tx) => {
    await tx.waveParticipant.delete({ where: { id: participant.id } })

    if (wave.chatId) {
      await tx.crewChatMember.deleteMany({
        where: { chatId: wave.chatId, userId },
      })
    }
  })

  return new NextResponse(null, { status: 204 })
}
