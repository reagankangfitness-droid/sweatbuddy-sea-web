import type { WaveActivityType } from '@prisma/client'

export const WAVE_ACTIVITIES: Record<WaveActivityType, { label: string; emoji: string }> = {
  RUN: { label: 'Run', emoji: '🏃' },
  YOGA: { label: 'Yoga', emoji: '🧘' },
  GYM: { label: 'Gym', emoji: '💪' },
  CYCLE: { label: 'Cycle', emoji: '🚴' },
  SWIM: { label: 'Swim', emoji: '🏊' },
  HIKE: { label: 'Hike', emoji: '🥾' },
  TENNIS: { label: 'Tennis', emoji: '🎾' },
  PICKLEBALL: { label: 'Pickleball', emoji: '🏓' },
  BASKETBALL: { label: 'Basketball', emoji: '🏀' },
  BADMINTON: { label: 'Badminton', emoji: '🏸' },
  FOOTBALL: { label: 'Football', emoji: '⚽' },
  CLIMB: { label: 'Climb', emoji: '🧗' },
  BOXING: { label: 'Boxing', emoji: '🥊' },
  HYROX: { label: 'Hyrox', emoji: '🔥' },
  DANCE: { label: 'Dance', emoji: '💃' },
  PILATES: { label: 'Pilates', emoji: '🤸' },
  WALK: { label: 'Walk', emoji: '🚶' },
  ANYTHING: { label: 'Anything', emoji: '🙌' },
}

export const WAVE_ACTIVITY_TYPES = Object.keys(WAVE_ACTIVITIES) as WaveActivityType[]

export const WAVE_EXPIRY_MS = 8 * 60 * 60 * 1000 // 8 hours
export const WAVE_THRESHOLD = 3
export const WAVE_POLL_INTERVAL = 15_000 // 15 seconds
export const DEFAULT_RADIUS_KM = 5
