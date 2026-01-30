import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBlockedUserIds } from '@/lib/blocks'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params

  // Validate membership
  const member = await prisma.crewChatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  })
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  // Get blocked user IDs to filter their messages
  const blockedUserIds = await getBlockedUserIds(userId)

  const messages = await prisma.crewMessage.findMany({
    where: {
      chatId,
      // Filter out messages from blocked users
      ...(blockedUserIds.size > 0 && { senderId: { notIn: Array.from(blockedUserIds) } }),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      sender: { select: { id: true, name: true, firstName: true, imageUrl: true } },
    },
  })

  return NextResponse.json({
    messages: messages.reverse().map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      senderName: m.sender.firstName || m.sender.name || 'Anonymous',
      senderImageUrl: m.sender.imageUrl || null,
    })),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { content } = body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  // Validate membership
  const member = await prisma.crewChatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  })
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.crewMessage.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: { select: { name: true, firstName: true, imageUrl: true } },
      },
    })

    await tx.crewChat.update({
      where: { id: chatId },
      data: { lastMessageAt: message.createdAt },
    })

    return message
  })

  return NextResponse.json({
    message: {
      id: result.id,
      chatId: result.chatId,
      senderId: result.senderId,
      content: result.content,
      createdAt: result.createdAt.toISOString(),
      senderName: result.sender.firstName || result.sender.name || 'Anonymous',
      senderImageUrl: result.sender.imageUrl || null,
    },
  })
}
