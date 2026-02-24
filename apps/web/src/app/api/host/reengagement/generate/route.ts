import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { anthropic, AGENT_MODEL } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/host/reengagement/generate
 * Generates a Claude-written nudge message for a specific cold member.
 * Body: { memberName, memberEmail, daysSince, attendanceCount, upcomingEventName? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberName, daysSince, attendanceCount, upcomingEventName } = await request.json()

    const hostName = session.name || session.instagramHandle
    const displayName = memberName || 'there'

    let eventContext = ''
    if (upcomingEventName) {
      eventContext = `\nThe host has an upcoming event: "${upcomingEventName}". Mention it naturally as a reason to come back.`
    }

    const prompt = `You're writing a short, personal re-engagement email from a fitness community host to a member who's gone cold.

Host: ${hostName} (@${session.instagramHandle})
Member: ${displayName}
Times attended: ${attendanceCount}
Days since last attendance: ${daysSince}${eventContext}

Write ONLY the email body (no subject line, no greeting header, no sign-off). The message should:
- Be 2-4 sentences, warm and casual
- Acknowledge they've been missed without guilt-tripping
- Reference their past participation naturally
- If there's an upcoming event, mention it as a reason to come back
- Sound like a real person, not a marketing email
- End with something inviting, not pushy

Output the message text only. No quotes, no formatting.`

    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content.find((c) => c.type === 'text')
    if (!text || text.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const subject = upcomingEventName
      ? `We'd love to see you at ${upcomingEventName}`
      : `Hey ${displayName}, we miss you!`

    return NextResponse.json({
      subject,
      message: text.text.trim(),
    })
  } catch (error) {
    console.error('Reengagement generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    )
  }
}
