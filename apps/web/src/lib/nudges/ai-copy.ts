// AI-powered nudge copy generation

import { anthropic, AGENT_MODEL } from '@/lib/ai/client'
import type { NudgeContext, NudgeCopy, NudgeSignalType } from './signals'

const SYSTEM_PROMPT = `You are a friendly fitness community assistant in Singapore. Generate short notification copy for nudge cards.

Rules:
- Title: max 60 characters, action-oriented
- Body: max 140 characters, warm and encouraging
- Be concise and specific
- Use Singapore-appropriate language (no slang)
- Output valid JSON only: {"title": "...", "body": "..."}`

function buildUserMessage(context: NudgeContext): string {
  switch (context.signalType) {
    case 'EVENT_RECOMMENDATION':
      return `A host the user has attended before (${context.organizerName}) just posted a new event: "${context.eventName}". Write a nudge encouraging them to check it out.`

    case 'INACTIVITY_REENGAGEMENT':
      return `User "${context.userName || 'there'}" hasn't joined any fitness activity in ${context.daysSinceLastActivity} days. Write a warm re-engagement nudge to bring them back.`

    case 'LOW_FILL_RATE':
      return `Host's event "${context.eventName}" is ${context.daysUntilEvent} days away but only ${context.fillPercent}% filled (${context.currentAttendees} attendees). Write an alert nudge for the host.`

    case 'REGULARS_NOT_SIGNED_UP':
      return `${context.regularCount} regulars (${context.regularNames?.slice(0, 3).join(', ')}${(context.regularCount || 0) > 3 ? '...' : ''}) haven't RSVP'd for the host's upcoming event "${context.eventName}". Write a nudge alerting the host.`

    default:
      return 'Write a friendly fitness activity nudge.'
  }
}

const STATIC_FALLBACKS: Record<NudgeSignalType, NudgeCopy> = {
  EVENT_RECOMMENDATION: {
    title: 'A host you know just posted something new',
    body: 'Check out this new experience from a community you\'ve joined before. Spots may be limited!',
  },
  INACTIVITY_REENGAGEMENT: {
    title: 'We miss you! Time to get moving?',
    body: 'It\'s been a while since your last activity. Browse upcoming experiences near you.',
  },
  LOW_FILL_RATE: {
    title: 'Your event needs a boost',
    body: 'Sign-ups are lower than usual. Consider sharing it with your community or adjusting the details.',
  },
  REGULARS_NOT_SIGNED_UP: {
    title: 'Your regulars haven\'t signed up yet',
    body: 'Some of your most loyal attendees haven\'t RSVP\'d. A quick reminder might help!',
  },
}

/**
 * Generate nudge copy using Claude AI with static fallbacks.
 */
export async function generateNudgeCopy(context: NudgeContext): Promise<NudgeCopy> {
  try {
    const response = await anthropic.messages.create({
      model: AGENT_MODEL,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserMessage(context) },
      ],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text) as NudgeCopy

    // Enforce length limits
    return {
      title: (parsed.title || '').slice(0, 60),
      body: (parsed.body || '').slice(0, 140),
    }
  } catch (error) {
    console.error('AI nudge copy generation failed, using fallback:', error)
    return STATIC_FALLBACKS[context.signalType]
  }
}
