export type ListingIntent =
  | 'show_up_today'
  | 'join_a_crew'
  | 'try_social_sport'
  | 'train_solo'
  | 'generic_inventory'

export type ListingJoinPath =
  | 'SweatBuddies RSVP'
  | 'Crew linked'
  | 'Drop-in friendly'
  | 'External booking'
  | 'Official source'
  | 'Source only'

export type ListingSocialSignal = 'Strong' | 'Medium' | 'Weak' | 'None'
export type ListingPublicPriority = 'Featured' | 'Normal' | 'Supporting' | 'Hidden'

export interface ListingPositioningInput {
  placeType?: string | null
  activities?: string[] | null
  vibeTags?: string[] | null
  communityTypes?: string[] | null
  beginnerFriendly?: boolean | null
  dropInFriendly?: boolean | null
  socialScore?: number | null
  averageRating?: number | null
  reviewCount?: number | null
  googleRating?: number | null
  googleReviewCount?: number | null
  trustScore?: number | null
  photoQualityScore?: number | null
  isFeatured?: boolean | null
  websiteUrl?: string | null
  bookingUrl?: string | null
  sourceUrl?: string | null
  lastVerifiedAt?: string | Date | null
  communityLinkCount?: number | null
  relatedCommunities?: unknown[] | null
  upcomingPlanCount?: number | null
}

export interface ListingPositioning {
  intent: ListingIntent
  joinPath: ListingJoinPath
  socialSignal: ListingSocialSignal
  publicPriority: ListingPublicPriority
  score: number
  badges: string[]
  reason: string
}

const RUN_TERMS = new Set(['running', 'run', 'run_club', 'walk', 'walking', 'trail_running'])
const SOCIAL_SPORT_TERMS = new Set([
  'badminton',
  'basketball',
  'beach_workout',
  'beach_volleyball',
  'climbing',
  'football',
  'futsal',
  'pickleball',
  'social_sports',
  'sports',
  'tennis',
  'volleyball',
])
const STRENGTH_TERMS = new Set(['boxing', 'calisthenics', 'crossfit', 'functional', 'hiit', 'hyrox', 'muay-thai', 'strength'])
const SOFT_ENTRY_TERMS = new Set(['breathwork', 'meditation', 'mobility', 'pilates', 'recovery', 'sauna', 'stretching', 'yoga'])

function normalizeValues(values: Array<string | null | undefined> = []) {
  return values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase().replace(/\s+/g, '_'))
}

function hasAny(values: string[], terms: Set<string>) {
  return values.some((value) => terms.has(value))
}

function hasRecentVerification(value: string | Date | null | undefined) {
  if (!value) return false
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 120
}

export function getListingPositioning(place: ListingPositioningInput): ListingPositioning {
  const activities = normalizeValues(place.activities ?? [])
  const vibes = normalizeValues(place.vibeTags ?? [])
  const communityTypes = normalizeValues(place.communityTypes ?? [])
  const placeType = String(place.placeType ?? '').toLowerCase()
  const upcomingPlanCount = place.upcomingPlanCount ?? 0
  const communityLinkCount =
    place.communityLinkCount ?? place.relatedCommunities?.length ?? (communityTypes.length > 0 ? 1 : 0)
  const reviewCount = (place.reviewCount ?? 0) + (place.googleReviewCount ?? 0)
  const trustScore = place.trustScore ?? 0
  const photoQualityScore = place.photoQualityScore ?? 0
  const socialScore = place.socialScore ?? 0
  const linkedCommunity = communityLinkCount > 0 || communityTypes.length > 0
  const beginnerFriendly = Boolean(place.beginnerFriendly)
  const dropInFriendly = Boolean(place.dropInFriendly)
  const officialSource = Boolean(place.websiteUrl || place.sourceUrl)
  const externalBooking = Boolean(place.bookingUrl)
  const recentlyVerified = hasRecentVerification(place.lastVerifiedAt)

  let intent: ListingIntent = 'generic_inventory'
  if (upcomingPlanCount > 0) intent = 'show_up_today'
  else if (linkedCommunity || vibes.includes('social')) intent = 'join_a_crew'
  else if (hasAny(activities, SOCIAL_SPORT_TERMS) || placeType === 'sports_facility') intent = 'try_social_sport'
  else if (hasAny(activities, RUN_TERMS)) intent = 'join_a_crew'
  else if (hasAny(activities, STRENGTH_TERMS) || placeType === 'gym') intent = 'train_solo'
  else if (hasAny(activities, SOFT_ENTRY_TERMS) && (beginnerFriendly || dropInFriendly)) intent = 'join_a_crew'

  const joinPath: ListingJoinPath =
    upcomingPlanCount > 0
      ? 'SweatBuddies RSVP'
      : linkedCommunity
        ? 'Crew linked'
        : dropInFriendly
          ? 'Drop-in friendly'
          : externalBooking
            ? 'External booking'
            : officialSource
              ? 'Official source'
              : 'Source only'

  let score = 0
  if (upcomingPlanCount > 0) score += 36
  if (linkedCommunity) score += 24
  if (place.isFeatured) score += 18
  if (beginnerFriendly) score += 12
  if (dropInFriendly) score += 10
  if (officialSource) score += 8
  if (externalBooking) score += 6
  if (recentlyVerified) score += 8
  score += Math.min(18, Math.floor(socialScore / 5))
  score += Math.min(12, Math.floor(trustScore / 8))
  score += Math.min(8, Math.floor(photoQualityScore / 13))
  score += Math.min(10, Math.floor(reviewCount / 20))

  if (intent === 'try_social_sport') score += 10
  if (intent === 'join_a_crew') score += 8
  if (intent === 'train_solo' && !linkedCommunity && !dropInFriendly) score -= 18
  if (intent === 'generic_inventory') score -= 28

  score = Math.max(0, Math.min(100, score))

  const socialSignal: ListingSocialSignal =
    score >= 78 || linkedCommunity || upcomingPlanCount > 0
      ? 'Strong'
      : score >= 55 || beginnerFriendly || dropInFriendly
        ? 'Medium'
        : score >= 34 || officialSource || reviewCount > 0
          ? 'Weak'
          : 'None'

  const publicPriority: ListingPublicPriority =
    score >= 82 || place.isFeatured
      ? 'Featured'
      : score >= 58
        ? 'Normal'
        : score >= 34
          ? 'Supporting'
          : 'Hidden'

  const badges = [
    joinPath,
    socialSignal !== 'None' ? `${socialSignal} social signal` : null,
    beginnerFriendly ? 'Beginner-friendly' : null,
    dropInFriendly ? 'Drop-in friendly' : null,
    recentlyVerified ? 'Recently verified' : null,
  ].filter(Boolean) as string[]

  const reason =
    intent === 'show_up_today'
      ? 'Has a current SweatBuddies plan people can join.'
      : intent === 'join_a_crew'
        ? 'Shows a community or first-timer path, not just inventory.'
        : intent === 'try_social_sport'
          ? 'Useful for pickup games, partner finding, or social play.'
          : intent === 'train_solo'
            ? 'Training-focused listing; needs drop-in or community proof to rank higher.'
            : 'Generic inventory with limited evidence that someone can show up socially.'

  return { intent, joinPath, socialSignal, publicPriority, score, badges, reason }
}

export function compareListingsBySocialUsefulness<T extends ListingPositioningInput>(a: T, b: T) {
  const aPositioning = getListingPositioning(a)
  const bPositioning = getListingPositioning(b)
  if (aPositioning.score !== bPositioning.score) return bPositioning.score - aPositioning.score

  const aReviewScore = (a.reviewCount ?? 0) + (a.googleReviewCount ?? 0)
  const bReviewScore = (b.reviewCount ?? 0) + (b.googleReviewCount ?? 0)
  if (aReviewScore !== bReviewScore) return bReviewScore - aReviewScore

  return String('name' in a ? a.name : '').localeCompare(String('name' in b ? b.name : ''))
}
