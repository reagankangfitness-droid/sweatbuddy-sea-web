import Anthropic from '@anthropic-ai/sdk'
import type { PrismaClient } from '@prisma/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ModerationResult {
  approved: boolean
  reason?: string
  flags: string[]
}

interface EventContent {
  eventName: string
  description?: string
  organizerName: string
  organizerInstagram: string
  location: string
  communityLink?: string | null
}

/**
 * Check if host is trusted (has previous approved events)
 */
export async function isHostTrusted(
  prisma: PrismaClient,
  contactEmail: string,
  submittedByUserId: string | null
): Promise<{ trusted: boolean; approvedCount: number }> {
  // Check by user ID first (more reliable)
  if (submittedByUserId) {
    const approvedEvents = await prisma.eventSubmission.count({
      where: {
        submittedByUserId,
        status: 'APPROVED',
      },
    })

    if (approvedEvents > 0) {
      return { trusted: true, approvedCount: approvedEvents }
    }
  }

  // Fallback to email check
  const approvedByEmail = await prisma.eventSubmission.count({
    where: {
      contactEmail: contactEmail.toLowerCase(),
      status: 'APPROVED',
    },
  })

  return {
    trusted: approvedByEmail > 0,
    approvedCount: approvedByEmail,
  }
}

/**
 * AI-powered content moderation for new host submissions
 * Uses Claude to check for inappropriate content, spam, or policy violations
 */
export async function moderateEventContent(
  content: EventContent
): Promise<ModerationResult> {
  // If no API key configured, approve by default (fail open)
  if (!process.env.ANTHROPIC_API_KEY) {
    return { approved: true, flags: [] }
  }

  try {
    const prompt = `You are a content moderator for SweatBuddies, a fitness event platform in Singapore. Review this event submission and determine if it should be approved or flagged for manual review.

EVENT DETAILS:
- Event Name: ${content.eventName}
- Description: ${content.description || '(none provided)'}
- Organizer Name: ${content.organizerName}
- Organizer Instagram: @${content.organizerInstagram}
- Location: ${content.location}
- Community Link: ${content.communityLink || '(none)'}

APPROVE the event if it appears to be a legitimate fitness/wellness event (running, yoga, HIIT, swimming, hiking, cycling, martial arts, dance, etc.)

FLAG for manual review if you detect ANY of these:
1. Adult/sexual content or suggestive language
2. Spam, scams, or promotional content unrelated to fitness
3. Hate speech, discrimination, or offensive language
4. Illegal activities or dangerous practices
5. Fake/misleading event information
6. Suspicious links or phishing attempts
7. Events clearly not related to fitness/wellness
8. Excessive profanity

Respond in this exact JSON format:
{
  "approved": true or false,
  "reason": "brief explanation if not approved",
  "flags": ["list", "of", "specific", "concerns"] or []
}

Only output the JSON, nothing else.`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cheap for moderation
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    // Parse response
    const textContent = response.content[0]
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const result = JSON.parse(textContent.text) as ModerationResult
    return result
  } catch {
    // Fail closed - flag for manual review if AI check fails
    return {
      approved: false,
      reason: 'AI moderation unavailable - requires manual review',
      flags: ['moderation_error'],
    }
  }
}

/**
 * Simple keyword-based pre-filter (runs before AI for obvious cases)
 * Returns true if content should be blocked immediately
 */
export function containsBlockedContent(content: EventContent): {
  blocked: boolean
  reason?: string
} {
  const blockedPatterns = [
    // Obvious spam/scam patterns
    /\b(casino|gambling|lottery|bitcoin|crypto\s*trading)\b/i,
    /\b(earn\s*money|make\s*money\s*fast|get\s*rich)\b/i,
    /\b(adult|xxx|porn|escort|massage\s*parlor)\b/i,
    // Suspicious URLs
    /\b(bit\.ly|tinyurl|t\.co)\/\w+/i, // Shortened URLs in description
  ]

  const textToCheck = [
    content.eventName,
    content.description || '',
    content.organizerName,
  ].join(' ')

  for (const pattern of blockedPatterns) {
    if (pattern.test(textToCheck)) {
      return {
        blocked: true,
        reason: 'Content matches blocked pattern',
      }
    }
  }

  return { blocked: false }
}
