import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCommunityMember } from '@/lib/community-system'
import { getBlockedUserIds } from '@/lib/blocks'

// GET /api/communities/[slug]/chat - Get chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // cursor for pagination

    const community = await prisma.community.findUnique({
      where: { slug },
      include: { chat: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Must be a member to view chat
    if (!(await isCommunityMember(community.id, userId))) {
      return NextResponse.json({ error: 'Must be a member to view chat' }, { status: 403 })
    }

    if (!community.chat) {
      return NextResponse.json({ messages: [], hasMore: false })
    }

    // Get blocked user IDs to filter messages
    const blockedUserIds = await getBlockedUserIds(userId)

    const where: Record<string, unknown> = {
      chatId: community.chat.id,
    }

    if (blockedUserIds.size > 0) {
      where.senderId = { notIn: Array.from(blockedUserIds) }
    }

    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    const messages = await prisma.communityMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
    })

    const hasMore = messages.length > limit
    if (hasMore) {
      messages.pop()
    }

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore,
    })
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/communities/[slug]/chat - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const community = await prisma.community.findUnique({
      where: { slug },
      include: { chat: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Must be a member to send messages
    if (!(await isCommunityMember(community.id, userId))) {
      return NextResponse.json({ error: 'Must be a member to send messages' }, { status: 403 })
    }

    // Create chat if it doesn't exist
    let chatId = community.chat?.id
    if (!chatId) {
      const chat = await prisma.communityChat.create({
        data: { communityId: community.id },
      })
      chatId = chat.id
    }

    // Create message
    const message = await prisma.communityMessage.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
          },
        },
      },
    })

    // Update last message timestamp
    await prisma.communityChat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
