import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params

  const members = await prisma.crewChatMember.findMany({
    where: { chatId },
    include: {
      user: { select: { id: true, name: true, firstName: true, imageUrl: true } },
    },
  })

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.firstName || m.user.name || 'Anonymous',
      imageUrl: m.user.imageUrl,
    })),
  })
}
