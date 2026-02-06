import { NextResponse } from 'next/server'
import { anthropic, AGENT_MODEL } from '@/lib/ai'

export const dynamic = 'force-dynamic'

/**
 * GET /api/test/ai
 * Simple test endpoint to verify Anthropic API is working
 */
export async function GET() {
  try {
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from SweatBuddies AI!" in a fun, fitness-themed way. Keep it to one sentence.',
        },
      ],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    const message = textContent && textContent.type === 'text'
      ? textContent.text
      : 'No response'

    return NextResponse.json({
      success: true,
      model: AGENT_MODEL,
      message,
      usage: response.usage,
    })
  } catch (error) {
    console.error('AI test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
