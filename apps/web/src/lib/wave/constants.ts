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
  RUN: ['Easy 5K around the area', 'Looking for a running buddy!', 'Interval training session', 'Long run -any pace welcome'],
  YOGA: ['Morning flow session', 'Sunset yoga in the park', 'Anyone for hot yoga?', 'Beginner-friendly stretching'],
  GYM: ['Push day - need a spotter', 'Leg day, who is in?', 'Full body workout session', 'Looking for a gym buddy'],
  CYCLE: ['Casual road ride', 'Morning spin around the bay', 'Hill repeats anyone?', 'Recovery ride -easy pace'],
  SWIM: ['Lap swim at the pool', 'Open water swim anyone?', 'Easy freestyle session', 'Looking for swim buddies'],
  HIKE: ['Morning trail hike', 'Exploring new trails!', 'Easy nature walk + hike', 'Weekend hike -all levels'],
  TENNIS: ['Looking for a hitting partner', 'Doubles match anyone?', 'Casual rally session', 'Beginner-friendly game'],
  PICKLEBALL: ['Doubles game anyone?', 'Casual pickleball session', 'Looking for players!', 'Beginner-friendly match'],
  BASKETBALL: ['Pick-up game anyone?', 'Shooting around -join me!', 'Need players for 3v3', 'Casual hoops session'],
  BADMINTON: ['Doubles match anyone?', 'Casual rally session', 'Looking for players!', 'Beginner-friendly game'],
  FOOTBALL: ['Pick-up game -need players', 'Casual kick-about', '5-a-side anyone?', 'Looking for players!'],
  CLIMB: ['Bouldering session anyone?', 'Top rope climbing today', 'Beginner-friendly climbing', 'Looking for a belay partner'],
  BOXING: ['Pad work session anyone?', 'Sparring partner needed', 'Shadow boxing + cardio', 'Beginner-friendly session'],
  HYROX: ['HYROX training session', 'Functional fitness workout', 'Race prep -all levels', 'Partner workout anyone?'],
  DANCE: ['Dance session anyone?', 'Freestyle jam -all styles', 'Learning choreo together', 'Social dance practice'],
  PILATES: ['Mat Pilates session', 'Core workout anyone?', 'Beginner-friendly Pilates', 'Morning Pilates flow'],
  WALK: ['Morning walk around the area', 'Evening stroll anyone?', 'Walking buddy needed', 'Exploring the neighborhood'],
  ANYTHING: ['Down for anything active!', 'Surprise me -any sport works', 'Looking for workout buddies', 'Open to any activity!'],
}

export const WAVE_EXPIRY_MS = 8 * 60 * 60 * 1000 // 8 hours
export const WAVE_THRESHOLD = 3
export const WAVE_POLL_INTERVAL = 15_000 // 15 seconds
export const DEFAULT_RADIUS_KM = 5
