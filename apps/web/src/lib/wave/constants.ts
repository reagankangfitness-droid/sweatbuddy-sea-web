import type { WaveActivityType } from '@prisma/client'

export const WAVE_ACTIVITIES: Record<WaveActivityType, { label: string; emoji: string }> = {
  // Cardio & Endurance
  RUN: { label: 'Run', emoji: '🏃' },
  WALK: { label: 'Walk', emoji: '🚶' },
  CYCLE: { label: 'Cycle', emoji: '🚴' },
  SWIM: { label: 'Swim', emoji: '🏊' },
  HIKE: { label: 'Hike', emoji: '🥾' },
  ROWING: { label: 'Rowing', emoji: '🚣' },
  SURFING: { label: 'Surfing', emoji: '🏄' },
  SPINNING: { label: 'Spinning', emoji: '🚲' },

  // Strength & Conditioning
  GYM: { label: 'Gym', emoji: '💪' },
  CROSSFIT: { label: 'CrossFit', emoji: '🏋️' },
  HYROX: { label: 'Hyrox', emoji: '🔥' },
  STRETCHING: { label: 'Stretching', emoji: '🧎' },
  PILATES: { label: 'Pilates', emoji: '🤸' },

  // Racquet Sports
  TENNIS: { label: 'Tennis', emoji: '🎾' },
  PICKLEBALL: { label: 'Pickleball', emoji: '🏓' },
  BADMINTON: { label: 'Badminton', emoji: '🏸' },
  SQUASH: { label: 'Squash', emoji: '🎾' },

  // Team Sports
  BASKETBALL: { label: 'Basketball', emoji: '🏀' },
  FOOTBALL: { label: 'Football', emoji: '⚽' },
  VOLLEYBALL: { label: 'Volleyball', emoji: '🏐' },
  FRISBEE: { label: 'Frisbee', emoji: '🥏' },

  // Combat & Martial Arts
  BOXING: { label: 'Boxing', emoji: '🥊' },
  MARTIAL_ARTS: { label: 'Martial Arts', emoji: '🥋' },

  // Other Sports
  CLIMB: { label: 'Climb', emoji: '🧗' },
  GOLF: { label: 'Golf', emoji: '⛳' },
  SKATEBOARD: { label: 'Skateboard', emoji: '🛹' },
  DANCE: { label: 'Dance', emoji: '💃' },

  // Wellness & Recovery
  YOGA: { label: 'Yoga', emoji: '🧘' },
  MEDITATION: { label: 'Meditation', emoji: '🧘‍♂️' },
  BREATHWORK: { label: 'Breathwork', emoji: '🌬️' },
  ICE_BATH: { label: 'Ice Bath', emoji: '🧊' },
  SAUNA: { label: 'Sauna', emoji: '🧖' },

  // Self-Improvement
  BOOK_CLUB: { label: 'Book Club', emoji: '📚' },
  NUTRITION: { label: 'Nutrition', emoji: '🥗' },

  // Flexible
  ANYTHING: { label: 'Anything', emoji: '🙌' },
}

export const WAVE_ACTIVITY_TYPES = Object.keys(WAVE_ACTIVITIES) as WaveActivityType[]

export const WAVE_QUICK_PROMPTS: Record<WaveActivityType, string[]> = {
  // Cardio & Endurance
  RUN: ['First timer, be gentle', 'Training for a race', 'Chill pace, no pressure', 'Exploring new routes'],
  WALK: ['Coffee walk', 'Nature walk', 'Walking meeting', 'Evening stroll'],
  CYCLE: ['Casual ride', 'Scenic route vibes', 'Training mode', 'Coffee stop included'],
  SWIM: ['Lap swimming', 'Just want to float', 'Open water curious', 'Learning freestyle'],
  HIKE: ['Easy trail', 'Sunrise mission', 'Nature therapy', 'Photography stops'],
  ROWING: ['Dragon boat practice', 'Kayaking trip', 'Calm water paddle', 'First timer welcome'],
  SURFING: ['Beginner waves', 'Dawn patrol', 'Paddleboard session', 'Learning to surf'],
  SPINNING: ['High intensity', 'Recovery ride', 'Music-driven class', 'Beginner friendly'],

  // Strength & Conditioning
  GYM: ['Leg day today', 'Need a spotter', "Let's push each other", 'Just started lifting'],
  CROSSFIT: ['WOD buddy', 'Open gym session', 'Competition prep', 'Scaled workouts welcome'],
  HYROX: ['Training partner', 'Race prep', 'First timer', 'Workout buddy'],
  STRETCHING: ['Mobility session', 'Post-workout stretch', 'Flexibility goals', 'Recovery focused'],
  PILATES: ['Mat pilates', 'Reformer session', 'Core focus', 'Beginner friendly'],

  // Racquet Sports
  TENNIS: ['Casual rally', 'Looking for doubles partner', 'Any skill level', 'Want to improve'],
  PICKLEBALL: ['Just learned, be patient', 'Competitive game', 'Social doubles', 'Morning session'],
  BADMINTON: ['Casual game', 'Looking for doubles', 'Any level welcome', 'Weekly session'],
  SQUASH: ['Friendly match', 'Practice session', 'Any level', 'Looking to improve'],

  // Team Sports
  BASKETBALL: ['Casual shooting', 'Need players for 3v3', 'Just for fun', 'Regular pickup game'],
  FOOTBALL: ['Casual kickabout', 'Need players', '5-a-side', 'Just for fun'],
  VOLLEYBALL: ['Beach volleyball', 'Indoor game', 'Need players', 'Casual rally'],
  FRISBEE: ['Ultimate frisbee', 'Casual throw', 'Learning the game', 'Pickup game'],

  // Combat & Martial Arts
  BOXING: ['Bag work buddy', 'Sparring partner', 'Beginner friendly', 'Cardio boxing'],
  MARTIAL_ARTS: ['Training partner', 'Sparring session', 'Learning together', 'Any discipline'],

  // Other Sports
  CLIMB: ['Bouldering buddy', 'First time climber', 'Outdoor climbing', 'Belay partner needed'],
  GOLF: ['Casual round', 'Driving range', 'Learning the game', 'Social golf'],
  SKATEBOARD: ['Cruising around', 'Learning tricks', 'Skatepark session', 'Beginner welcome'],
  DANCE: ['Social dancing', 'Learning together', 'Any style', 'Just for fun'],

  // Wellness & Recovery
  YOGA: ['Beginner friendly please', 'Need to destress', 'Outdoor session preferred', 'Morning stretch'],
  MEDITATION: ['Guided session', 'Silent sit', 'Mindfulness practice', 'Beginner welcome'],
  BREATHWORK: ['Wim Hof style', 'Relaxation focused', 'Energy boost', 'First timer'],
  ICE_BATH: ['First timer', 'Post-workout recovery', 'Building cold tolerance', 'Regular practice'],
  SAUNA: ['Post-workout session', 'Relaxation time', 'Heat therapy', 'Recovery day'],

  // Self-Improvement
  BOOK_CLUB: ['Fiction lovers', 'Self-help books', 'Business books', 'Monthly meetup'],
  NUTRITION: ['Meal prep together', 'Healthy cooking', 'Diet accountability', 'Recipe exchange'],

  // Flexible
  ANYTHING: ['Open to suggestions', 'Surprise me', 'Whatever works', 'Flexible on activity'],
}

export const WAVE_EXPIRY_MS = 8 * 60 * 60 * 1000 // 8 hours
export const WAVE_THRESHOLD = 3
export const WAVE_POLL_INTERVAL = 15_000 // 15 seconds
export const DEFAULT_RADIUS_KM = 5
