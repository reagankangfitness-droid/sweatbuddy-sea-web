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

export const WAVE_QUICK_PROMPTS: Record<WaveActivityType, string[]> = {
  RUN: ['First timer, be gentle', 'Training for a race', 'Chill pace, no pressure', 'Exploring new routes'],
  YOGA: ['Beginner friendly please', 'Need to destress', 'Outdoor session preferred', 'Morning stretch'],
  GYM: ['Leg day today', 'Need a spotter', "Let's push each other", 'Just started lifting'],
  CYCLE: ['Casual ride', 'Scenic route vibes', 'Training mode', 'Coffee stop included'],
  SWIM: ['Lap swimming', 'Just want to float', 'Open water curious', 'Learning freestyle'],
  HIKE: ['Easy trail', 'Sunrise mission', 'Nature therapy', 'Photography stops'],
  TENNIS: ['Casual rally', 'Looking for doubles partner', 'Any skill level', 'Want to improve'],
  PICKLEBALL: ['Just learned, be patient', 'Competitive game', 'Social doubles', 'Morning session'],
  BASKETBALL: ['Casual shooting', 'Need players for 3v3', 'Just for fun', 'Regular pickup game'],
  BADMINTON: ['Casual game', 'Looking for doubles', 'Any level welcome', 'Weekly session'],
  FOOTBALL: ['Casual kickabout', 'Need players', '5-a-side', 'Just for fun'],
  CLIMB: ['Bouldering buddy', 'First time climber', 'Outdoor climbing', 'Belay partner needed'],
  BOXING: ['Bag work buddy', 'Sparring partner', 'Beginner friendly', 'Cardio boxing'],
  HYROX: ['Training partner', 'Race prep', 'First timer', 'Workout buddy'],
  DANCE: ['Social dancing', 'Learning together', 'Any style', 'Just for fun'],
  PILATES: ['Mat pilates', 'Reformer session', 'Core focus', 'Beginner friendly'],
  WALK: ['Coffee walk', 'Nature walk', 'Walking meeting', 'Evening stroll'],
  ANYTHING: ['Open to suggestions', 'Surprise me', 'Whatever works', 'Flexible on activity'],
}

export const WAVE_EXPIRY_MS = 8 * 60 * 60 * 1000 // 8 hours
export const WAVE_THRESHOLD = 3
export const WAVE_POLL_INTERVAL = 15_000 // 15 seconds
export const DEFAULT_RADIUS_KM = 5
