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
  BUDDY_MAP_DRAWER_OPENED: 'buddy_map_drawer_opened',
  BUDDY_MAP_LIST_ITEM_CLICKED: 'buddy_map_list_item_clicked',
  BUDDY_QUICK_INTENT_SELECTED: 'buddy_quick_intent_selected',
  BUDDY_QUICK_RSVP_JOINED: 'buddy_quick_rsvp_joined',
  BUDDY_QUICK_RSVP_CANCELLED: 'buddy_quick_rsvp_cancelled',
  BUDDY_POST_RSVP_FOLLOWED_HOST: 'buddy_post_rsvp_followed_host',
  BUDDY_GOING_SOLO_ANSWERED: 'buddy_going_solo_answered',
  BUDDY_GOING_SOLO_DISMISSED: 'buddy_going_solo_dismissed',
  ACTIVITY_DETAIL_VIEWED: 'activity_detail_viewed',
  ACTIVITY_JOIN_CTA_CLICKED: 'activity_join_cta_clicked',
  ACTIVITY_WAITLIST_CTA_VIEWED: 'activity_waitlist_cta_viewed',
  OFFICIAL_JOIN_CLICKED: 'official_join_clicked',
  COMMUNITY_VIEWED: 'community_viewed',
  COMMUNITY_SAVED: 'community_saved',
  COMMUNITY_REPORT_OUTDATED_CLICKED: 'community_report_outdated_clicked',
  COMMUNITY_CLAIM_INTENT_CLICKED: 'community_claim_intent_clicked',
  COMMUNITY_DIRECTORY_FILTER_USED: 'community_directory_filter_used',
  COMMUNITY_DIRECTORY_SEARCH_USED: 'community_directory_search_used',
  COMMUNITY_OUTBOUND_JOIN_CONFIRMED: 'community_outbound_join_confirmed',
  COMMUNITY_WEEKLY_PICKS_SUBMITTED: 'community_weekly_picks_submitted',
  COMMUNITY_SHARE_CLICKED: 'community_share_clicked',
  COMMUNITY_JOINED: 'community_joined',
  COMMUNITY_CREATED: 'community_created',
  COMMUNITY_LEFT: 'community_left',
  SIGNUP: 'signup',
  SEARCH_USED: 'search_used',
  COMMUNITY_SEEDED: 'community_seeded',
  COMMUNITY_CLAIMED: 'community_claimed',
} as const
