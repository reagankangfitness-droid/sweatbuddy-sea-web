export type ShowUpConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface ShowUpConfidenceInput {
  title?: string | null
  description?: string | null
  activityMode?: string | null
  categorySlug?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  startTime?: string | Date | null
  maxPeople?: number | null
  fitnessLevel?: string | null
  requiresApproval?: boolean | null
  isFeatured?: boolean | null
  attendeeCount?: number | null
  goingSoloCount?: number | null
  userStatus?: string | null
  officialJoinUrl?: string | null
  lastVerifiedAt?: string | Date | null
  community?: {
    id?: string | null
    name?: string | null
    lastVerifiedAt?: string | Date | null
    communityLink?: string | null
    websiteUrl?: string | null
    sourceUrl?: string | null
  } | null
  host?: {
    sessionsHostedCount?: number | null
    isCoach?: boolean | null
    coachVerificationStatus?: string | null
  } | null
}

export interface ShowUpConfidence {
  score: number
  level: ShowUpConfidenceLevel
  soloFriendly: boolean
  beginnerFriendly: boolean
  clearPlan: boolean
  clearJoinPath: boolean
  peopleGoing: boolean
  verifiedSource: boolean
  recurringSignal: boolean
  badges: string[]
  reason: string
}

const RECURRING_TERMS = /\b(weekly|every\s+(mon|tue|wed|thu|fri|sat|sun|week)|recurring|regular|club|crew)\b/i
const SOLO_FRIENDLY_TERMS = /\b(solo|first[-\s]?timer|beginner|newcomer|all levels|easy|social|welcome)\b/i

function hasRecentVerification(value: string | Date | null | undefined) {
  if (!value) return false
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 120
}

function hasDate(value: string | Date | null | undefined) {
  if (!value) return false
  const date = value instanceof Date ? value : new Date(value)
  return !Number.isNaN(date.getTime())
}

function hasCoordinates(input: ShowUpConfidenceInput) {
  return typeof input.latitude === 'number' && typeof input.longitude === 'number'
}

export function getShowUpConfidence(input: ShowUpConfidenceInput): ShowUpConfidence {
  const text = [input.title, input.description, input.categorySlug].filter(Boolean).join(' ')
  const attendeeCount = input.attendeeCount ?? 0
  const goingSoloCount = input.goingSoloCount ?? 0
  const beginnerFriendly =
    input.fitnessLevel === 'ALL' ||
    SOLO_FRIENDLY_TERMS.test(text)
  const peopleGoing = attendeeCount > 0
  const recurringSignal = Boolean(input.community?.id || RECURRING_TERMS.test(text))
  const verifiedSource = Boolean(
    input.host?.coachVerificationStatus === 'VERIFIED' ||
      input.host?.isCoach ||
      hasRecentVerification(input.lastVerifiedAt) ||
      hasRecentVerification(input.community?.lastVerifiedAt),
  )
  const clearPlan = Boolean(input.title && hasDate(input.startTime) && input.address && hasCoordinates(input))
  const clearJoinPath = Boolean(
    input.activityMode === 'P2P_FREE' ||
      input.activityMode === 'P2P_PAID' ||
      input.officialJoinUrl ||
      input.community?.communityLink ||
      input.community?.websiteUrl ||
      input.community?.sourceUrl,
  )
  const soloFriendly = Boolean(
    beginnerFriendly ||
      goingSoloCount > 0 ||
      input.maxPeople === null ||
      (typeof input.maxPeople === 'number' && input.maxPeople >= 4) ||
      SOLO_FRIENDLY_TERMS.test(text),
  )

  let score = 0
  if (clearPlan) score += 22
  if (clearJoinPath) score += 18
  if (soloFriendly) score += 16
  if (beginnerFriendly) score += 12
  if (peopleGoing) score += Math.min(18, 8 + attendeeCount * 2)
  if (goingSoloCount > 0) score += Math.min(12, 6 + goingSoloCount * 2)
  if (recurringSignal) score += 10
  if (verifiedSource) score += 8
  if (input.isFeatured) score += 6
  if (input.host?.sessionsHostedCount) score += Math.min(6, Math.floor(input.host.sessionsHostedCount / 2))
  if (input.requiresApproval) score -= 6
  if (!clearPlan) score -= 12
  if (!clearJoinPath) score -= 18

  score = Math.max(0, Math.min(100, score))

  const level: ShowUpConfidenceLevel =
    score >= 72 ? 'High' : score >= 44 ? 'Medium' : 'Low'

  const badges = [
    soloFriendly ? 'Good solo' : null,
    peopleGoing ? 'People going' : null,
    beginnerFriendly ? 'Beginner-friendly' : null,
    recurringSignal ? 'Recurring crew' : null,
    verifiedSource ? 'Verified source' : null,
    clearJoinPath ? 'Easy join' : null,
  ].filter(Boolean) as string[]

  const reason =
    level === 'High'
      ? 'Clear plan, join path, and social signals make this easy to show up to.'
      : level === 'Medium'
        ? 'Has some show-up signals, but could use stronger solo or join context.'
        : 'Missing enough context for a confident solo show-up.'

  return {
    score,
    level,
    soloFriendly,
    beginnerFriendly,
    clearPlan,
    clearJoinPath,
    peopleGoing,
    verifiedSource,
    recurringSignal,
    badges,
    reason,
  }
}

export function compareByShowUpConfidence<T extends ShowUpConfidenceInput>(a: T, b: T) {
  const aConfidence = getShowUpConfidence(a)
  const bConfidence = getShowUpConfidence(b)
  if (aConfidence.score !== bConfidence.score) return bConfidence.score - aConfidence.score

  const aTime = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER
  const bTime = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER
  if (aTime !== bTime) return aTime - bTime

  return String(a.title ?? '').localeCompare(String(b.title ?? ''))
}
