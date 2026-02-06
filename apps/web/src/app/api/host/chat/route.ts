import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  anthropic,
  AGENT_MODEL,
  buildAgentContext,
  formatContextForChat,
  CHAT_SYSTEM_PROMPT,
} from '@/lib/ai'

export const dynamic = 'force-dynamic'

// Rate limit: max 50 messages per hour per host
const MESSAGE_LIMIT_PER_HOUR = 50

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

/**
 * Ensure organizer record exists for this session
 */
async function ensureOrganizer(session: { id: string; email: string; instagramHandle: string; name: string | null }) {
  let organizer = await prisma.organizer.findFirst({
    where: {
      OR: [
        { email: { equals: session.email, mode: 'insensitive' } },
        { instagramHandle: { equals: session.instagramHandle, mode: 'insensitive' } },
      ],
    },
  })

  if (!organizer) {
    organizer = await prisma.organizer.create({
      data: {
        email: session.email.toLowerCase(),
        instagramHandle: session.instagramHandle.toLowerCase(),
        name: session.name,
      },
    })
  }

  return organizer
}

/**
 * GET /api/host/chat
 * Returns the most recent conversation or creates a new one
 */
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)

    // Get the most recent conversation
    let conversation = await prisma.agentConversation.findFirst({
      where: {
        organizerId: organizer.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.agentConversation.create({
        data: {
          organizerId: organizer.id,
          title: 'New Conversation',
        },
        include: {
          messages: true,
        },
      })
    }

    const messages: ChatMessage[] = conversation.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({
      conversationId: conversation.id,
      messages,
    })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/host/chat
 * Send a message and get AI response
 */
export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const { message, conversationId } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentMessageCount = await prisma.agentMessage.count({
      where: {
        conversation: {
          organizerId: organizer.id,
        },
        role: 'user',
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentMessageCount >= MESSAGE_LIMIT_PER_HOUR) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.agentConversation.findFirst({
          where: {
            id: conversationId,
            organizerId: organizer.id,
          },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 20, // Last 20 messages for context
            },
          },
        })
      : null

    if (!conversation) {
      conversation = await prisma.agentConversation.create({
        data: {
          organizerId: organizer.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: {
          messages: true,
        },
      })
    }

    // Save user message
    const userMessage = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message.trim(),
      },
    })

    // Build context for the agent
    const context = await buildAgentContext(organizer.id)
    const contextStr = formatContextForChat(context)

    // Build message history for Claude
    const messageHistory = conversation.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
    messageHistory.push({ role: 'user', content: message.trim() })

    // Call Claude
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 1500,
      system: `${CHAT_SYSTEM_PROMPT}\n\nHost Context:\n${contextStr}`,
      messages: messageHistory,
    })

    // Extract assistant response
    const textContent = response.content.find((c) => c.type === 'text')
    const assistantContent = textContent && textContent.type === 'text'
      ? textContent.text
      : 'I apologize, but I encountered an issue generating a response. Please try again.'

    // Save assistant message
    const assistantMessage = await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantContent,
      },
    })

    // Update conversation title if this is the first exchange
    if (conversation.messages.length === 0) {
      await prisma.agentConversation.update({
        where: { id: conversation.id },
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
      })
    }

    return NextResponse.json({
      conversationId: conversation.id,
      userMessage: {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        createdAt: userMessage.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/host/chat
 * Clear the current conversation and start fresh
 */
export async function DELETE(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await ensureOrganizer(session)
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Delete specific conversation
      await prisma.agentConversation.deleteMany({
        where: {
          id: conversationId,
          organizerId: organizer.id,
        },
      })
    }

    // Create a new conversation
    const newConversation = await prisma.agentConversation.create({
      data: {
        organizerId: organizer.id,
        title: 'New Conversation',
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({
      success: true,
      conversationId: newConversation.id,
      messages: [],
    })
  } catch (error) {
    console.error('Chat DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    )
  }
}
