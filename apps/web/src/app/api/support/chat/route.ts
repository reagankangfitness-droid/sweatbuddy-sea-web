import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { anthropic, AGENT_MODEL } from '@/lib/ai/client'
import { checkApiRateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `You are the SweatBuddies support assistant. SweatBuddies is a fitness and wellness platform where people discover and join sessions like running, yoga, HIIT, cold plunge, cycling, and more.

Your role:
- Answer questions about using the app (joining sessions, creating sessions, communities, payments, account)
- Be warm, friendly, and concise — match the brand tone (raw, real, earned)
- Use the user's context to give personalized answers
- If you can't resolve something, say "I'll flag this to the team — they'll get back to you within 24 hours"
- Never make up features that don't exist
- Keep answers short (2-3 sentences max unless the user needs more detail)

Key features to know about:
- Sessions: Users browse sessions on a map, join with "I'm in" button
- Communities (Crews): Groups organized around activities (running clubs, yoga groups, etc.)
- Quick Post: Hosts create sessions in seconds via a bottom sheet
- Safety: Hosts have reliability scores, attendees can report issues after sessions
- Host Tiers: NEW (3 session cap, 8 attendees) → COMMUNITY (unlimited) → VERIFIED (manual)
- Location: Sessions are filtered by GPS (25km radius)
- Onboarding: Users pick interests when they first join a session (join gate)

Common questions:
- "How do I cancel?" → Go to the session, tap the "Going" button to leave
- "Why can't I see sessions?" → Check location permissions, sessions are GPS-filtered
- "How do I host?" → Tap the + button on the map, fill out the quick post
- "How do I claim my community?" → Go to the community page, tap "Claim this community" if you're the owner
- "Is it free?" → Most sessions are free. Some hosts charge via PayNow or Stripe.
- "How do I get verified?" → Host 5+ sessions with good reliability to reach COMMUNITY tier

Do not discuss:
- Internal implementation details, database schemas, or API endpoints
- Other users' private data
- Pricing or business model details beyond what's visible in the app`

export async function POST(request: import('next/server').NextRequest) {
  try {
    const rateLimited = await checkApiRateLimit(request, 'api')
    if (rateLimited) return rateLimited

    const { messages } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    // Get user context if authenticated
    let userContext = ''
    try {
      const { userId } = await auth()
      if (userId) {
        const clerkUser = await currentUser()
        const email = clerkUser?.primaryEmailAddress?.emailAddress
        if (email) {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              name: true,
              sessionsHostedCount: true,
              sessionsAttendedCount: true,
              hostTier: true,
              reliabilityScore: true,
              fitnessInterests: true,
              p2pOnboardingCompleted: true,
              _count: { select: { communityMemberships: true } },
            },
          })
          if (user) {
            userContext = `\n\nUser context:
- Name: ${user.name ?? 'Not set'}
- Sessions attended: ${user.sessionsAttendedCount}
- Sessions hosted: ${user.sessionsHostedCount}
- Host tier: ${user.hostTier}
- Reliability: ${user.reliabilityScore}%
- Interests: ${user.fitnessInterests.join(', ') || 'Not set'}
- Communities: ${user._count.communityMemberships}
- Onboarded: ${user.p2pOnboardingCompleted ? 'Yes' : 'No'}`
          }
        }
      }
    } catch {
      // No auth context — that's fine
    }

    // Stream the response
    const stream = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT + userContext,
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          console.error('[support/chat] Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('[support/chat] Error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
