type ListingModerationStatus = 'LIVE' | 'LIMITED' | 'UNDER_REVIEW' | 'BLOCKED'

type ListingDecision = {
  status: ListingModerationStatus
  riskScore: number
  riskFlags: string[]
  moderationNotes: string | null
}

type CommunityListingInput = {
  communityName: string
  city: string
  category: string | null
  sourceUrl: string
  note: string | null
  submitterEmail: string | null
  submitterUserId: string | null
  duplicateCommunity: boolean
  recentSubmissionCount: number
}

type SessionListingInput = {
  title: string
  description: string | null
  categorySlug: string
  address: string | null
  price: number
  acceptPayNow: boolean
  acceptStripe: boolean
  imageUrl: string | null
  hostTier: string | null
  hostSessionCount: number
  duplicateUpcomingCount: number
}

const TRUSTED_SOURCE_HOSTS = [
  'instagram.com',
  'www.instagram.com',
  'strava.com',
  'www.strava.com',
  'meetup.com',
  'www.meetup.com',
  'eventbrite.com',
  'www.eventbrite.com',
  'peatix.com',
  'www.peatix.com',
  'linktr.ee',
  'linktree.com',
  't.me',
  'telegram.me',
  'whatsapp.com',
  'chat.whatsapp.com',
]

const SHORTENER_HOSTS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly']

const BLOCKED_PATTERNS = [
  /\b(casino|gambling|lottery|bitcoin|crypto\s*trading|forex)\b/i,
  /\b(earn\s*money|make\s*money\s*fast|get\s*rich|guaranteed\s*income)\b/i,
  /\b(adult|xxx|porn|escort|happy\s*ending)\b/i,
  /\b(fake\s*passport|illegal\s*drugs|weapons)\b/i,
]

const FITNESS_TERMS = [
  'run',
  'running',
  'walk',
  'yoga',
  'pilates',
  'gym',
  'strength',
  'hiit',
  'fitness',
  'cycling',
  'bike',
  'hike',
  'pickleball',
  'badminton',
  'basketball',
  'dance',
  'stretch',
  'swim',
  'wellness',
  'training',
  'bootcamp',
]

export function scoreCommunityListing(input: CommunityListingInput): ListingDecision {
  const flags: string[] = []
  let score = 0
  const joinedText = [
    input.communityName,
    input.city,
    input.category ?? '',
    input.note ?? '',
    input.sourceUrl,
  ].join(' ')

  if (containsBlockedPattern(joinedText)) {
    return decision('BLOCKED', 100, ['blocked_content'])
  }

  if (!input.submitterUserId) addRisk(flags, 'anonymous_submitter', 25)
  if (!input.submitterEmail) addRisk(flags, 'missing_submitter_email', 10)
  if (!input.category) addRisk(flags, 'missing_category', 18)
  if (!input.note || input.note.length < 20) addRisk(flags, 'thin_context', 10)
  if (input.duplicateCommunity) addRisk(flags, 'possible_duplicate', 45)
  if (input.recentSubmissionCount >= 3) addRisk(flags, 'submission_velocity', 25)
  if (!looksFitnessRelated(joinedText)) addRisk(flags, 'fitness_relevance_unclear', 18)

  const sourceHost = getHostname(input.sourceUrl)
  if (!sourceHost) {
    addRisk(flags, 'invalid_source_host', 35)
  } else {
    if (SHORTENER_HOSTS.includes(sourceHost)) addRisk(flags, 'shortened_source_link', 35)
    if (!isTrustedSourceHost(sourceHost)) addRisk(flags, 'unrecognized_source_host', 12)
  }

  score = calculateScore(flags)
  return decision(statusForScore(score), score, flags)
}

export function scoreSessionListing(input: SessionListingInput): ListingDecision {
  const flags: string[] = []
  const joinedText = [
    input.title,
    input.description ?? '',
    input.categorySlug,
    input.address ?? '',
  ].join(' ')

  if (containsBlockedPattern(joinedText)) {
    return decision('BLOCKED', 100, ['blocked_content'])
  }

  if (input.hostTier === 'NEW') addRisk(flags, 'new_host', 12)
  if (input.hostSessionCount === 0) addRisk(flags, 'first_session', 18)
  if (!input.description || input.description.length < 20) addRisk(flags, 'thin_description', 10)
  if (!input.imageUrl) addRisk(flags, 'missing_cover_image', 8)
  if (!looksFitnessRelated(joinedText)) addRisk(flags, 'fitness_relevance_unclear', 20)
  if (input.duplicateUpcomingCount > 0) addRisk(flags, 'possible_duplicate_session', 25)
  if (hasExternalLink(input.description)) addRisk(flags, 'external_link_in_description', 18)

  if (input.price > 0) {
    if (!input.acceptPayNow && !input.acceptStripe) addRisk(flags, 'missing_payment_method', 50)
    if (input.hostTier === 'NEW' && input.price > 50) addRisk(flags, 'high_price_new_host', 30)
    if (input.price > 150) addRisk(flags, 'unusually_high_price', 30)
  }

  const score = calculateScore(flags)
  return decision(statusForScore(score), score, flags)
}

function addRisk(flags: string[], flag: string, weight: number) {
  flags.push(`${flag}:${weight}`)
}

function calculateScore(flags: string[]): number {
  return Math.min(100, flags.reduce((total, flag) => {
    const weight = Number(flag.split(':').at(-1))
    return total + (Number.isFinite(weight) ? weight : 0)
  }, 0))
}

function statusForScore(score: number): ListingModerationStatus {
  if (score >= 70) return 'UNDER_REVIEW'
  if (score >= 40) return 'LIMITED'
  return 'LIVE'
}

function decision(
  status: ListingModerationStatus,
  riskScore: number,
  weightedFlags: string[],
): ListingDecision {
  const riskFlags = weightedFlags.map((flag) => flag.split(':')[0])
  return {
    status,
    riskScore,
    riskFlags,
    moderationNotes: riskFlags.length ? `Risk flags: ${riskFlags.join(', ')}` : null,
  }
}

function containsBlockedPattern(value: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(value))
}

function looksFitnessRelated(value: string): boolean {
  const normalized = value.toLowerCase()
  return FITNESS_TERMS.some((term) => normalized.includes(term))
}

function hasExternalLink(value: string | null): boolean {
  if (!value) return false
  return /https?:\/\/|www\./i.test(value)
}

function getHostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function isTrustedSourceHost(hostname: string): boolean {
  return TRUSTED_SOURCE_HOSTS.some((trustedHost) => hostname === trustedHost || hostname.endsWith(`.${trustedHost}`))
}
