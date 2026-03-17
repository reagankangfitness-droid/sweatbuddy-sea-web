import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export async function trackEvent(event: string, userId?: string | null, metadata?: Record<string, unknown>) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        userId: userId || null,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch {
    // Don't fail the user action if tracking fails
    console.error('Analytics tracking failed')
  }
}

// Event constants
export const EVENTS = {
  PAGE_VIEW: 'page_view',
  COMMUNITY_VIEWED: 'community_viewed',
  COMMUNITY_JOINED: 'community_joined',
  COMMUNITY_CREATED: 'community_created',
  COMMUNITY_LEFT: 'community_left',
  SIGNUP: 'signup',
  SEARCH_USED: 'search_used',
  COMMUNITY_SEEDED: 'community_seeded',
  COMMUNITY_CLAIMED: 'community_claimed',
} as const
