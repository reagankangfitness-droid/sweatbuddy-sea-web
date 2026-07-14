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
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
  LANDING_INTENT_OPENED: 'landing_intent_opened',
  LANDING_INTENT_SUBMITTED: 'landing_intent_submitted',
  LANDING_INTENT_ABANDONED: 'landing_intent_abandoned',
  BUDDY_FILTER_USED: 'buddy_filter_used',
  BUDDY_VIEW_CHANGED: 'buddy_view_changed',
  BUDDY_SESSION_CLICKED: 'buddy_session_clicked',
  BUDDY_MAP_PIN_CLICKED: 'buddy_map_pin_clicked',
  OFFICIAL_JOIN_CLICKED: 'official_join_clicked',
  COMMUNITY_VIEWED: 'community_viewed',
  COMMUNITY_JOINED: 'community_joined',
  COMMUNITY_CREATED: 'community_created',
  COMMUNITY_LEFT: 'community_left',
  SIGNUP: 'signup',
  SEARCH_USED: 'search_used',
  COMMUNITY_SEEDED: 'community_seeded',
  COMMUNITY_CLAIMED: 'community_claimed',
} as const
