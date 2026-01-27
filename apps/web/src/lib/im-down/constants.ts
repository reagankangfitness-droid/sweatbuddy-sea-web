import type { ImDownActivity } from '@prisma/client'

export const ACTIVITIES: Record<ImDownActivity, { label: string; emoji: string }> = {
  RUN: { label: 'Run', emoji: '🏃' },
  YOGA: { label: 'Yoga', emoji: '🧘' },
  GYM: { label: 'Gym', emoji: '🏋️' },
  CYCLE: { label: 'Cycle', emoji: '🚴' },
  SWIM: { label: 'Swim', emoji: '🏊' },
  ANYTHING: { label: 'Anything', emoji: '🤙' },
}

export const STATUS_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours
export const NEARBY_POLL_INTERVAL = 30_000 // 30 seconds
export const DEFAULT_RADIUS_KM = 5
