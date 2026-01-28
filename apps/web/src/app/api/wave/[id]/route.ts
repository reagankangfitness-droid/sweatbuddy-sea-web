import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const wave = await prisma.waveActivity.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, firstName: true, imageUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, firstName: true, imageUrl: true } },
        },
        orderBy: { wavedAt: 'asc' },
      },
    },
  })

  if (!wave) return NextResponse.json({ error: 'Wave not found' }, { status: 404 })

  const isParticipant = wave.participants.some((p) => p.userId === userId)

  return NextResponse.json({
    wave: {
      id: wave.id,
      creatorId: wave.creatorId,
      activityType: wave.activityType,
      area: wave.area,
      locationName: wave.locationName,
      latitude: wave.latitude,
      longitude: wave.longitude,
      scheduledFor: wave.scheduledFor,
      waveThreshold: wave.waveThreshold,
      isUnlocked: wave.isUnlocked,
      startedAt: wave.startedAt,
      expiresAt: wave.expiresAt,
      chatId: wave.chatId,
      participantCount: wave.participants.length,
      creator: wave.creator,
      // Only show participant details if unlocked
      participants: wave.isUnlocked
        ? wave.participants.map((p) => ({
            userId: p.user.id,
            name: p.user.firstName || p.user.name || 'Anonymous',
            imageUrl: p.user.imageUrl,
            wavedAt: p.wavedAt,
          }))
        : [],
      isParticipant,
    },
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const wave = await prisma.waveActivity.findUnique({ where: { id } })
  if (!wave) return NextResponse.json({ error: 'Wave not found' }, { status: 404 })

  if (wave.creatorId !== userId) {
    return NextResponse.json({ error: 'Only the creator can delete this wave' }, { status: 403 })
  }

  await prisma.$transaction(async (tx) => {
    if (wave.chatId) {
      await tx.crewMessage.deleteMany({ where: { chatId: wave.chatId } })
      await tx.crewChatMember.deleteMany({ where: { chatId: wave.chatId } })
    }

    await tx.waveParticipant.deleteMany({ where: { waveActivityId: id } })

    if (wave.chatId) {
      await tx.waveActivity.update({ where: { id }, data: { chatId: null } })
      await tx.crewChat.delete({ where: { id: wave.chatId } })
    }

    await tx.waveActivity.delete({ where: { id } })
  })

  return new NextResponse(null, { status: 204 })
}
