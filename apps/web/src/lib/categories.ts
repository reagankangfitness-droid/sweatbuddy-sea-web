/**
 * Activity Categories - Comprehensive Taxonomy
 *
 * This file contains the complete activity category system for SweatBuddies.
 * Used for filters, discovery UI, host onboarding, and event curation.
 */

export interface CategoryGroup {
  slug: string
  name: string
  description: string
  emoji: string
  color: string
  displayOrder: number
}

export interface ActivityCategory {
  slug: string
  name: string
  description?: string
  emoji: string
  icon: string
  color: string
  groupSlug: string | null
  displayOrder: number
  featured: boolean
}

// =====================================================
// CATEGORY GROUPS
// =====================================================

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    slug: 'cardio',
    name: 'Cardio & Endurance',
    description: 'Heart-pumping activities to build stamina',
    emoji: '❤️‍🔥',
    color: '#EF4444',
    displayOrder: 1,
  },
  {
    slug: 'strength',
    name: 'Strength & Power',
    description: 'Build muscle and functional fitness',
    emoji: '💪',
    color: '#F59E0B',
    displayOrder: 2,
  },
  {
    slug: 'mind_body',
    name: 'Mind & Body',
    description: 'Connect movement with mindfulness',
    emoji: '🧘',
    color: '#8B5CF6',
    displayOrder: 3,
  },
  {
    slug: 'outdoor',
    name: 'Outdoor & Adventure',
    description: 'Get outside and explore',
    emoji: '🏔️',
    color: '#10B981',
    displayOrder: 4,
  },
  {
    slug: 'recovery',
    name: 'Recovery & Wellness',
    description: 'Rest, recover, and rejuvenate',
    emoji: '🧊',
    color: '#06B6D4',
    displayOrder: 5,
  },
  {
    slug: 'social',
    name: 'Social & Community',
    description: 'Connect through movement',
    emoji: '🤝',
    color: '#EC4899',
    displayOrder: 6,
  },
  {
    slug: 'skills',
    name: 'Skills & Learning',
    description: 'Learn new techniques and sports',
    emoji: '🎯',
    color: '#6366F1',
    displayOrder: 7,
  },
]

// =====================================================
// ACTIVITY CATEGORIES
// =====================================================

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  // CARDIO & ENDURANCE
  { slug: 'running', name: 'Running', description: 'Running clubs, trail runs, and run/walk meetups', emoji: '🏃', icon: 'footprints', color: '#EF4444', groupSlug: 'cardio', displayOrder: 1, featured: true },
  { slug: 'cycling', name: 'Cycling', description: 'Group bike rides, spin classes, and cycling clubs', emoji: '🚴', icon: 'bike', color: '#F97316', groupSlug: 'cardio', displayOrder: 2, featured: true },
  { slug: 'hiit', name: 'HIIT', description: 'High-intensity interval training and circuit workouts', emoji: '⚡', icon: 'zap', color: '#FBBF24', groupSlug: 'cardio', displayOrder: 3, featured: true },
  { slug: 'swimming', name: 'Swimming', description: 'Pool workouts, lake swims, and water-based fitness', emoji: '🏊', icon: 'waves', color: '#0EA5E9', groupSlug: 'cardio', displayOrder: 4, featured: false },
  { slug: 'dance', name: 'Dance Fitness', description: 'Cardio dance, Zumba, and social dance workouts', emoji: '💃', icon: 'music', color: '#EC4899', groupSlug: 'cardio', displayOrder: 5, featured: true },
  { slug: 'jump_rope', name: 'Jump Rope', description: 'Jump rope workouts and skipping sessions', emoji: '🪢', icon: 'repeat', color: '#F43F5E', groupSlug: 'cardio', displayOrder: 6, featured: false },

  // STRENGTH & POWER
  { slug: 'strength', name: 'Strength Training', description: 'Weight training, resistance workouts, and lifting', emoji: '🏋️', icon: 'dumbbell', color: '#F59E0B', groupSlug: 'strength', displayOrder: 10, featured: true },
  { slug: 'bootcamp', name: 'Bootcamp', description: 'Military-style fitness bootcamps', emoji: '🎖️', icon: 'shield', color: '#D97706', groupSlug: 'strength', displayOrder: 11, featured: true },
  { slug: 'crossfit', name: 'CrossFit', description: 'CrossFit workouts and functional fitness', emoji: '🔥', icon: 'flame', color: '#EA580C', groupSlug: 'strength', displayOrder: 12, featured: true },
  { slug: 'hyrox', name: 'Hyrox', description: 'Hyrox training and competition prep', emoji: '🏆', icon: 'trophy', color: '#B45309', groupSlug: 'strength', displayOrder: 13, featured: false },
  { slug: 'functional', name: 'Functional Fitness', description: 'Functional movement and athletic training', emoji: '⚙️', icon: 'settings', color: '#CA8A04', groupSlug: 'strength', displayOrder: 14, featured: false },
  { slug: 'calisthenics', name: 'Calisthenics', description: 'Bodyweight training and street workout', emoji: '🤸', icon: 'user', color: '#EAB308', groupSlug: 'strength', displayOrder: 15, featured: false },

  // MIND & BODY
  { slug: 'yoga', name: 'Yoga', description: 'All styles - vinyasa, hatha, yin, hot yoga, and more', emoji: '🧘', icon: 'flower-2', color: '#8B5CF6', groupSlug: 'mind_body', displayOrder: 20, featured: true },
  { slug: 'pilates', name: 'Pilates', description: 'Mat pilates, reformer, and core-focused workouts', emoji: '🦢', icon: 'circle', color: '#A855F7', groupSlug: 'mind_body', displayOrder: 21, featured: true },
  { slug: 'breathwork', name: 'Breathwork', description: 'Guided breathing exercises and pranayama', emoji: '🌬️', icon: 'wind', color: '#C084FC', groupSlug: 'mind_body', displayOrder: 22, featured: true },
  { slug: 'meditation', name: 'Meditation', description: 'Guided meditation and mindfulness sessions', emoji: '🧠', icon: 'brain', color: '#D8B4FE', groupSlug: 'mind_body', displayOrder: 23, featured: true },
  { slug: 'tai_chi', name: 'Tai Chi', description: 'Tai chi, qigong, and moving meditation', emoji: '☯️', icon: 'infinity', color: '#E9D5FF', groupSlug: 'mind_body', displayOrder: 24, featured: false },
  { slug: 'stretching', name: 'Stretching', description: 'Flexibility, mobility, and stretch sessions', emoji: '🤸‍♀️', icon: 'move', color: '#F3E8FF', groupSlug: 'mind_body', displayOrder: 25, featured: false },

  // OUTDOOR & ADVENTURE
  { slug: 'hiking', name: 'Hiking', description: 'Trail hikes, nature walks, and trekking', emoji: '🥾', icon: 'mountain', color: '#10B981', groupSlug: 'outdoor', displayOrder: 30, featured: true },
  { slug: 'climbing', name: 'Climbing', description: 'Bouldering, rock climbing, and climbing clubs', emoji: '🧗', icon: 'mountain-snow', color: '#059669', groupSlug: 'outdoor', displayOrder: 31, featured: true },
  { slug: 'outdoor_fitness', name: 'Outdoor Fitness', description: 'Park workouts, outdoor gyms, and green exercise', emoji: '🌳', icon: 'tree-pine', color: '#34D399', groupSlug: 'outdoor', displayOrder: 32, featured: false },
  { slug: 'beach_workout', name: 'Beach Workout', description: 'Sand training, beach runs, and coastal fitness', emoji: '🏖️', icon: 'sun', color: '#6EE7B7', groupSlug: 'outdoor', displayOrder: 33, featured: false },
  { slug: 'trail_running', name: 'Trail Running', description: 'Off-road running and trail adventures', emoji: '🏞️', icon: 'map', color: '#A7F3D0', groupSlug: 'outdoor', displayOrder: 34, featured: false },
  { slug: 'snowboarding', name: 'Snowboarding', description: 'Snowboarding meetups and mountain sessions', emoji: '🏂', icon: 'mountain-snow', color: '#64748B', groupSlug: 'outdoor', displayOrder: 35, featured: false },

  // SPORTS
  { slug: 'volleyball', name: 'Volleyball', description: 'Beach volleyball and indoor volleyball', emoji: '🏐', icon: 'circle', color: '#F97316', groupSlug: 'outdoor', displayOrder: 40, featured: true },
  { slug: 'pickleball', name: 'Pickleball', description: 'Pickleball games and social play', emoji: '🏓', icon: 'target', color: '#FB923C', groupSlug: 'outdoor', displayOrder: 41, featured: true },
  { slug: 'tennis', name: 'Tennis', description: 'Tennis sessions and racquet sports', emoji: '🎾', icon: 'circle-dot', color: '#FDBA74', groupSlug: 'outdoor', displayOrder: 42, featured: false },
  { slug: 'badminton', name: 'Badminton', description: 'Badminton games and shuttlecock sessions', emoji: '🏸', icon: 'feather', color: '#FED7AA', groupSlug: 'outdoor', displayOrder: 43, featured: false },
  { slug: 'basketball', name: 'Basketball', description: 'Pickup basketball and hoops sessions', emoji: '🏀', icon: 'circle', color: '#F97316', groupSlug: 'outdoor', displayOrder: 44, featured: false },
  { slug: 'soccer', name: 'Soccer', description: 'Football/soccer games and futsal', emoji: '⚽', icon: 'circle', color: '#22C55E', groupSlug: 'outdoor', displayOrder: 45, featured: false },
  { slug: 'frisbee', name: 'Frisbee', description: 'Ultimate frisbee and disc sports', emoji: '🥏', icon: 'disc', color: '#3B82F6', groupSlug: 'outdoor', displayOrder: 46, featured: false },

  // RECOVERY & WELLNESS
  { slug: 'cold_plunge', name: 'Cold Plunge', description: 'Ice baths, cold water immersion, and Wim Hof', emoji: '🧊', icon: 'snowflake', color: '#06B6D4', groupSlug: 'recovery', displayOrder: 50, featured: true },
  { slug: 'sauna', name: 'Sauna', description: 'Sauna sessions, contrast therapy, and heat exposure', emoji: '🔥', icon: 'thermometer', color: '#0891B2', groupSlug: 'recovery', displayOrder: 51, featured: true },
  { slug: 'sound_bath', name: 'Sound Bath', description: 'Sound healing, gong baths, and sound therapy', emoji: '🔔', icon: 'bell', color: '#22D3EE', groupSlug: 'recovery', displayOrder: 52, featured: true },
  { slug: 'massage', name: 'Massage', description: 'Partner stretching, Thai massage, and bodywork', emoji: '💆', icon: 'hand', color: '#67E8F9', groupSlug: 'recovery', displayOrder: 53, featured: false },
  { slug: 'foam_rolling', name: 'Foam Rolling', description: 'Self-myofascial release and recovery tools', emoji: '🧴', icon: 'cylinder', color: '#A5F3FC', groupSlug: 'recovery', displayOrder: 54, featured: false },
  { slug: 'wellness_circle', name: 'Wellness Circle', description: 'Mindfulness circles and wellness discussions', emoji: '⭕', icon: 'users', color: '#CFFAFE', groupSlug: 'recovery', displayOrder: 55, featured: false },

  // SOCIAL & COMMUNITY
  { slug: 'fitness_social', name: 'Fitness Social', description: 'Social fitness events and workout meetups', emoji: '🤝', icon: 'users', color: '#EC4899', groupSlug: 'social', displayOrder: 60, featured: true },
  { slug: 'run_club', name: 'Run Club', description: 'Weekly run clubs and running communities', emoji: '👟', icon: 'footprints', color: '#F472B6', groupSlug: 'social', displayOrder: 61, featured: true },
  { slug: 'sweat_date', name: 'Sweat Date', description: 'Partner workouts and fitness dating', emoji: '💕', icon: 'heart', color: '#FB7185', groupSlug: 'social', displayOrder: 62, featured: false },
  { slug: 'corporate_wellness', name: 'Corporate Wellness', description: 'Team building and office fitness', emoji: '🏢', icon: 'building', color: '#FDA4AF', groupSlug: 'social', displayOrder: 63, featured: false },

  // SKILLS & LEARNING
  { slug: 'workshop', name: 'Workshop', description: 'Skill clinics, technique sessions, and learning', emoji: '🎯', icon: 'target', color: '#6366F1', groupSlug: 'skills', displayOrder: 70, featured: true },
  { slug: 'retreat', name: 'Retreat', description: 'Day retreats, wellness retreats, and immersives', emoji: '🏕️', icon: 'tent', color: '#818CF8', groupSlug: 'skills', displayOrder: 71, featured: true },
  { slug: 'festival', name: 'Fitness Festival', description: 'Multi-activity events and sweat schedules', emoji: '🎪', icon: 'calendar', color: '#A5B4FC', groupSlug: 'skills', displayOrder: 72, featured: false },
  { slug: 'nutrition', name: 'Nutrition', description: 'Nutrition workshops and healthy eating sessions', emoji: '🥗', icon: 'apple', color: '#C7D2FE', groupSlug: 'skills', displayOrder: 73, featured: false },
  { slug: 'coaching', name: 'Coaching', description: 'Personal training intro and fitness coaching', emoji: '📋', icon: 'clipboard', color: '#E0E7FF', groupSlug: 'skills', displayOrder: 74, featured: false },

  // OTHER
  { slug: 'other', name: 'Other', description: 'Other fitness and wellness activities', emoji: '✨', icon: 'sparkles', color: '#9CA3AF', groupSlug: null, displayOrder: 99, featured: false },
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): ActivityCategory | undefined {
  return ACTIVITY_CATEGORIES.find(c => c.slug === slug)
}

/**
 * Get all categories in a group
 */
export function getCategoriesByGroup(groupSlug: string): ActivityCategory[] {
  return ACTIVITY_CATEGORIES.filter(c => c.groupSlug === groupSlug)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Get all featured categories
 */
export function getFeaturedCategories(): ActivityCategory[] {
  return ACTIVITY_CATEGORIES.filter(c => c.featured)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Get group by slug
 */
export function getGroupBySlug(slug: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find(g => g.slug === slug)
}

/**
 * Get category display info
 */
export function getCategoryDisplay(slug: string): { name: string; emoji: string; color: string } {
  const category = getCategoryBySlug(slug)
  if (!category) return { name: 'Other', emoji: '✨', color: '#9CA3AF' }
  return { name: category.name, emoji: category.emoji, color: category.color }
}

/**
 * Format category name with emoji
 */
export function formatCategoryName(slug: string): string {
  const category = getCategoryBySlug(slug)
  return category ? `${category.emoji} ${category.name}` : slug
}

/**
 * Get grouped category options for dropdowns
 */
export function getCategoryOptions(): { label: string; options: { value: string; label: string }[] }[] {
  return CATEGORY_GROUPS.map(group => ({
    label: `${group.emoji} ${group.name}`,
    options: getCategoriesByGroup(group.slug).map(cat => ({
      value: cat.slug,
      label: `${cat.emoji} ${cat.name}`,
    })),
  }))
}

/**
 * Get flat list of category options
 */
export function getFlatCategoryOptions(): { value: string; label: string; group: string | null }[] {
  return ACTIVITY_CATEGORIES
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(cat => ({
      value: cat.slug,
      label: `${cat.emoji} ${cat.name}`,
      group: cat.groupSlug,
    }))
}

/**
 * Map legacy ActivityType enum to new category slug
 */
export function mapLegacyTypeToCategory(type: string): string {
  const typeMap: Record<string, string> = {
    'RUN': 'running',
    'GYM': 'strength',
    'YOGA': 'yoga',
    'HIKE': 'hiking',
    'CYCLING': 'cycling',
    'OTHER': 'other',
  }
  return typeMap[type] || 'other'
}

/**
 * Map new category slug to legacy ActivityType enum (for backwards compatibility)
 */
export function mapCategoryToLegacyType(slug: string): string {
  const category = getCategoryBySlug(slug)
  if (!category) return 'OTHER'

  // Map category groups to legacy types
  switch (category.groupSlug) {
    case 'cardio':
      if (slug === 'running' || slug === 'run_club' || slug === 'trail_running') return 'RUN'
      if (slug === 'cycling') return 'CYCLING'
      return 'OTHER'
    case 'strength':
      return 'GYM'
    case 'mind_body':
      if (slug === 'yoga') return 'YOGA'
      return 'OTHER'
    case 'outdoor':
      if (slug === 'hiking') return 'HIKE'
      if (slug === 'cycling') return 'CYCLING'
      return 'OTHER'
    default:
      return 'OTHER'
  }
}

/**
 * Get categories grouped by their group
 */
export function getCategoriesGrouped(): { group: CategoryGroup; categories: ActivityCategory[] }[] {
  return CATEGORY_GROUPS.map(group => ({
    group,
    categories: getCategoriesByGroup(group.slug),
  }))
}

// Pre-built lookup maps for fast emoji/color resolution from any category format
// Keyed by slug (underscored), hyphenated slug, and display name (lowercase)
const _emojiMap: Record<string, string> = {}
const _colorMap: Record<string, string> = {}
for (const cat of ACTIVITY_CATEGORIES) {
  _emojiMap[cat.slug] = cat.emoji
  _emojiMap[cat.slug.replace(/_/g, '-')] = cat.emoji
  _emojiMap[cat.name.toLowerCase()] = cat.emoji
  _colorMap[cat.slug] = cat.color
  _colorMap[cat.slug.replace(/_/g, '-')] = cat.color
  _colorMap[cat.name.toLowerCase()] = cat.color
}

/**
 * Get emoji for a category — accepts slug, hyphenated slug, or display name
 */
export function getCategoryEmoji(category: string | null | undefined): string {
  if (!category) return '✨'
  return _emojiMap[category] || _emojiMap[category.toLowerCase()] || '✨'
}

/**
 * Get color for a category — accepts slug, hyphenated slug, or display name
 */
export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return '#9CA3AF'
  return _colorMap[category] || _colorMap[category.toLowerCase()] || '#9CA3AF'
}

/**
 * Search categories by name
 */
export function searchCategories(query: string): ActivityCategory[] {
  const searchLower = query.toLowerCase()
  return ACTIVITY_CATEGORIES.filter(c =>
    c.name.toLowerCase().includes(searchLower) ||
    c.slug.toLowerCase().includes(searchLower) ||
    c.description?.toLowerCase().includes(searchLower)
  )
}
