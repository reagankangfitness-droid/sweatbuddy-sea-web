import { safeGetJSON, safeSetJSON, safeRemove } from './safe-storage'

interface Preferences {
  city: string
  categories: string[]
  timePreference: string
  completedAt: string
}

interface Event {
  id: string
  name: string
  category: string
  day: string
  time: string
  location: string
  description?: string | null
  organizer: string
  imageUrl?: string | null
  recurring: boolean
}

/**
 * Get user preferences from localStorage
 */
export function getPreferences(): Preferences | null {
  return safeGetJSON<Preferences | null>('sweatbuddies_preferences', null)
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  return safeGetJSON<Preferences | null>('sweatbuddies_preferences', null) !== null
}

/**
 * Reset user preferences (for "Update Preferences" feature)
 */
export function resetPreferences(): void {
  if (typeof window === 'undefined') return
  safeRemove('sweatbuddies_preferences')
  window.dispatchEvent(new Event('preferencesUpdated'))
}

/**
 * Map category names to preference IDs
 */
const CATEGORY_MAPPING: Record<string, string[]> = {
  running: ['Running', 'Run Club', 'Trail Running'],
  yoga: ['Yoga', 'Pilates', 'Stretching', 'Meditation', 'Breathwork'],
  hiit: ['HIIT', 'Bootcamp', 'CrossFit', 'Functional Fitness'],
  dance: ['Dance', 'Dance Fitness'],
  outdoor: ['Outdoor', 'Outdoor Fitness', 'Hiking', 'Beach Workout', 'Climbing'],
  combat: ['Combat', 'Boxing', 'Martial Arts', 'Kickboxing'],
}

/**
 * Check if an event category matches a preference category
 */
function categoryMatchesPreference(eventCategory: string, preferenceCategory: string): boolean {
  const mappedCategories = CATEGORY_MAPPING[preferenceCategory] || []
  return mappedCategories.some(
    (cat) => eventCategory.toLowerCase().includes(cat.toLowerCase())
  )
}

/**
 * Parse time string to hour number
 */
function parseTimeToHour(timeStr: string): number {
  const match = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i)
  if (!match) return 12 // Default to noon

  let hour = parseInt(match[1])
  const isPM = match[3]?.toLowerCase() === 'pm'
  const isAM = match[3]?.toLowerCase() === 'am'

  if (isPM && hour !== 12) hour += 12
  if (isAM && hour === 12) hour = 0

  return hour
}

/**
 * Check if event time matches preference
 */
function timeMatchesPreference(event: Event, timePreference: string): boolean {
  const hour = parseTimeToHour(event.time)
  const day = event.day.toLowerCase()

  switch (timePreference) {
    case 'early':
      return hour < 8
    case 'lunch':
      return hour >= 11 && hour <= 14
    case 'evening':
      return hour >= 17 && hour <= 20
    case 'weekend':
      return day.includes('sat') || day.includes('sun')
    default:
      return true
  }
}

/**
 * Sort events by user preferences
 * Higher scored events appear first
 */
export function sortEventsByPreference(events: Event[]): Event[] {
  const prefs = getPreferences()
  if (!prefs || (!prefs.categories.length && !prefs.timePreference)) {
    return events
  }

  return [...events].sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // Boost events matching preferred categories (10 points each)
    prefs.categories.forEach((prefCat) => {
      if (categoryMatchesPreference(a.category, prefCat)) scoreA += 10
      if (categoryMatchesPreference(b.category, prefCat)) scoreB += 10
    })

    // Boost events matching time preference (5 points)
    if (prefs.timePreference && prefs.timePreference !== 'any') {
      if (timeMatchesPreference(a, prefs.timePreference)) scoreA += 5
      if (timeMatchesPreference(b, prefs.timePreference)) scoreB += 5
    }

    return scoreB - scoreA // Higher score first
  })
}

/**
 * Get a personalized greeting based on time of day and preferences
 */
export function getPersonalizedGreeting(): string {
  const prefs = getPreferences()
  const hour = new Date().getHours()

  let timeGreeting = ''
  if (hour < 12) timeGreeting = 'Good morning'
  else if (hour < 17) timeGreeting = 'Good afternoon'
  else timeGreeting = 'Good evening'

  if (!prefs || !prefs.categories.length) {
    return `${timeGreeting}! Here's what's on`
  }

  // Get first preferred category name
  const categoryNames: Record<string, string> = {
    running: 'running',
    yoga: 'yoga & mindfulness',
    hiit: 'HIIT & strength',
    dance: 'dance',
    outdoor: 'outdoor',
    combat: 'combat',
  }

  const firstPref = prefs.categories[0]
  const categoryName = categoryNames[firstPref] || firstPref

  return `${timeGreeting}! Here's your ${categoryName} events`
}

/**
 * Get saved event IDs
 */
export function getSavedEventIds(): string[] {
  return safeGetJSON<string[]>('sweatbuddies_saved', [])
}

/**
 * Get going event IDs
 */
export function getGoingEventIds(): string[] {
  return safeGetJSON<string[]>('sweatbuddies_going', [])
}

/**
 * Check if user is interested in an event (saved or going)
 */
export function isInterestedInEvent(eventId: string): boolean {
  const saved = getSavedEventIds()
  const going = getGoingEventIds()
  return saved.includes(eventId) || going.includes(eventId)
}

/**
 * Get preference summary for display
 */
export function getPreferenceSummary(): string | null {
  const prefs = getPreferences()
  if (!prefs) return null

  const parts: string[] = []

  if (prefs.categories.length > 0) {
    const categoryNames: Record<string, string> = {
      running: 'Running',
      yoga: 'Yoga',
      hiit: 'HIIT',
      dance: 'Dance',
      outdoor: 'Outdoor',
      combat: 'Combat',
    }
    const cats = prefs.categories.map((c) => categoryNames[c] || c).join(', ')
    parts.push(cats)
  }

  if (prefs.timePreference && prefs.timePreference !== 'any') {
    const timeNames: Record<string, string> = {
      early: 'mornings',
      lunch: 'lunch',
      evening: 'evenings',
      weekend: 'weekends',
    }
    parts.push(timeNames[prefs.timePreference] || prefs.timePreference)
  }

  return parts.length > 0 ? parts.join(' • ') : null
}
