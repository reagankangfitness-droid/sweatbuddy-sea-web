export interface ActivityTypeConfig {
  key: string          // e.g. 'pickleball' — matches categorySlug in DB
  label: string        // Display name
  emoji: string
  description: string
  trending?: boolean
  isNew?: boolean
  tier: 1 | 2 | 3     // 1 = always visible, 2 = prominent, 3 = expandable
}

export const ACTIVITY_TYPES: ActivityTypeConfig[] = [
  // Tier 1 — always visible
  { key: 'running',        label: 'Running',            emoji: '🏃', description: 'Morning routes. Evening pace groups. Weekend long runs.', trending: true, tier: 1 },
  { key: 'pickleball',     label: 'Pickleball',         emoji: '🏓', description: 'Fast-growing racket sport. Social, all ages, low-impact.', trending: true, isNew: true, tier: 1 },
  { key: 'yoga',           label: 'Yoga',               emoji: '🧘', description: 'Morning flows. Evening wind-downs. Community practice.', tier: 1 },
  { key: 'bootcamp',       label: 'HIIT / Bootcamp',    emoji: '💪', description: 'High-intensity circuits. Push each other harder.', trending: true, tier: 1 },
  { key: 'gym',            label: 'Gym / Strength',     emoji: '🏋️', description: 'Lifting partners. Circuit crews. Accountability buddies.', tier: 1 },
  { key: 'cycling',        label: 'Cycling',            emoji: '🚴', description: 'Casual rides. Hill climbs. Weekend loops.', tier: 1 },
  // Tier 2 — prominent
  { key: 'badminton',      label: 'Badminton',          emoji: '🏸', description: 'Doubles play. Courts everywhere. Quick matches.', isNew: true, tier: 2 },
  { key: 'combat_fitness', label: 'Combat / Muay Thai', emoji: '🥊', description: 'Muay Thai, boxing, kickboxing. Train together, get strong.', isNew: true, tier: 2 },
  { key: 'pilates',        label: 'Pilates',            emoji: '🤸', description: 'Low-impact strength. Flexibility. Core work.', tier: 2 },
  { key: 'hiking',         label: 'Hiking',             emoji: '🥾', description: 'Trail groups. Summit pushes. Nature walks.', tier: 2 },
  { key: 'swimming',       label: 'Swimming',           emoji: '🏊', description: 'Pool laps. Open water. Aqua fitness.', tier: 2 },
  // Tier 3 — expandable
  { key: 'padel',          label: 'Padel',              emoji: '🎾', description: 'Doubles racket sport. Easier than tennis.', isNew: true, tier: 3 },
  { key: 'dance_fitness',  label: 'Dance Fitness',      emoji: '💃', description: 'Zumba, dance cardio. Move to the beat.', tier: 3 },
  { key: 'volleyball',     label: 'Volleyball',         emoji: '🏐', description: 'Beach or court. Team rallies.', tier: 3 },
  { key: 'basketball',     label: 'Basketball',         emoji: '🏀', description: 'Pick-up games. Court runs.', tier: 3 },
  { key: 'cold_plunge',    label: 'Cold Plunge',        emoji: '🧊', description: 'Ice baths. Recovery circles.', tier: 3 },
]

export const ACTIVITY_TYPE_MAP = Object.fromEntries(ACTIVITY_TYPES.map(a => [a.key, a]))

export function getActivityConfig(key: string): ActivityTypeConfig | undefined {
  return ACTIVITY_TYPE_MAP[key.toLowerCase()]
}
