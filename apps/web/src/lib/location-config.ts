export interface CityNeighborhood {
  name: string
  lat: number
  lng: number
  radius: number
}

export interface CityLocationConfig {
  slug: string
  name: string
  countryCode: string
  currency: string
  timezone: string
  center: { lat: number; lng: number }
  defaultRadius: number
  detectionRadius: number
  aliases?: string[]
  neighborhoods: CityNeighborhood[]
}

export const CITY_LOCATION_CONFIGS: CityLocationConfig[] = [
  {
    slug: 'singapore',
    name: 'Singapore',
    countryCode: 'SG',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    center: { lat: 1.3521, lng: 103.8198 },
    defaultRadius: 25,
    detectionRadius: 80,
    aliases: ['sg'],
    neighborhoods: [
      { name: 'East Coast', lat: 1.3010, lng: 103.9120, radius: 3 },
      { name: 'Tanjong Pagar', lat: 1.2764, lng: 103.8434, radius: 2 },
      { name: 'Sentosa', lat: 1.2494, lng: 103.8303, radius: 2 },
      { name: 'Marina Bay', lat: 1.2816, lng: 103.8636, radius: 2 },
      { name: 'Tiong Bahru', lat: 1.2867, lng: 103.8273, radius: 2 },
      { name: 'Bukit Timah', lat: 1.3294, lng: 103.7932, radius: 3 },
      { name: 'Punggol', lat: 1.3984, lng: 103.9072, radius: 3 },
      { name: 'Jurong', lat: 1.3329, lng: 103.7436, radius: 3 },
      { name: 'Ang Mo Kio', lat: 1.3691, lng: 103.8454, radius: 2 },
      { name: 'Bedok', lat: 1.3236, lng: 103.9273, radius: 3 },
    ],
  },
  {
    slug: 'bangkok',
    name: 'Bangkok',
    countryCode: 'TH',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    center: { lat: 13.7563, lng: 100.5018 },
    defaultRadius: 25,
    detectionRadius: 90,
    aliases: ['bkk', 'thailand'],
    neighborhoods: [
      { name: 'Lumphini', lat: 13.7314, lng: 100.5417, radius: 2 },
      { name: 'Silom / Sathorn', lat: 13.7246, lng: 100.5297, radius: 3 },
      { name: 'Sukhumvit / Asok', lat: 13.7373, lng: 100.5609, radius: 3 },
      { name: 'Phrom Phong', lat: 13.7306, lng: 100.5697, radius: 2 },
      { name: 'Thonglor / Ekkamai', lat: 13.7248, lng: 100.5854, radius: 3 },
      { name: 'Khlong Toei', lat: 13.7196, lng: 100.5600, radius: 3 },
      { name: 'Ari', lat: 13.7796, lng: 100.5441, radius: 3 },
      { name: 'Chatuchak', lat: 13.8150, lng: 100.5530, radius: 4 },
      { name: 'Rama 9', lat: 13.7586, lng: 100.5656, radius: 3 },
      { name: 'Riverside', lat: 13.7249, lng: 100.5112, radius: 4 },
    ],
  },
]

export const DEFAULT_CITY_LOCATION_CONFIG = CITY_LOCATION_CONFIGS[0]

function toRadians(value: number): number {
  return value * (Math.PI / 180)
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earthRadiusKm = 6371
  const latDelta = toRadians(b.lat - a.lat)
  const lngDelta = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h))
}

export function getCityLocationConfig(slug: string | null | undefined): CityLocationConfig {
  return findCityLocationConfig(slug) ?? DEFAULT_CITY_LOCATION_CONFIG
}

export function findCityLocationConfig(slug: string | null | undefined): CityLocationConfig | null {
  if (!slug) return null
  const normalized = slug.toLowerCase()
  return CITY_LOCATION_CONFIGS.find((city) => city.slug === normalized) ?? null
}

function matchesLocationTerm(normalized: string, tokens: string[], term: string): boolean {
  const normalizedTerm = term.toLowerCase()
  if (!normalizedTerm.includes(' ')) return tokens.includes(normalizedTerm)
  return normalized.includes(normalizedTerm)
}

export function getCityLocationConfigFromText(text: string | null | undefined): CityLocationConfig | null {
  if (!text) return null
  const normalized = text.toLowerCase()
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)

  return CITY_LOCATION_CONFIGS.find((city) => {
    return (
      matchesLocationTerm(normalized, tokens, city.slug) ||
      matchesLocationTerm(normalized, tokens, city.name) ||
      tokens.includes(city.countryCode.toLowerCase()) ||
      city.aliases?.some((alias) => matchesLocationTerm(normalized, tokens, alias))
    )
  }) ?? null
}

export function isPointInsideCityDetectionRadius(
  city: CityLocationConfig,
  point: { lat: number; lng: number },
): boolean {
  return distanceKm(point, city.center) <= city.detectionRadius
}

export function getNearestCityLocationConfig(
  lat: number,
  lng: number,
): CityLocationConfig {
  const point = { lat, lng }
  const nearest = CITY_LOCATION_CONFIGS
    .map((city) => ({
      city,
      distance: distanceKm(point, city.center),
    }))
    .sort((a, b) => a.distance - b.distance)[0]

  if (!nearest || nearest.distance > nearest.city.detectionRadius) {
    return DEFAULT_CITY_LOCATION_CONFIG
  }

  return nearest.city
}

export function getCityLocationConfigForPointOrText(
  point: { lat: number; lng: number } | null | undefined,
  text: string | null | undefined,
): CityLocationConfig {
  const textCity = getCityLocationConfigFromText(text)
  if (textCity) return textCity

  if (point) {
    return getNearestCityLocationConfig(point.lat, point.lng)
  }

  return DEFAULT_CITY_LOCATION_CONFIG
}

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const localAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )

  return localAsUtc - date.getTime()
}

function localDateAtMidnightToUtc(dateStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const offset = getTimeZoneOffsetMs(utcGuess, timezone)
  return new Date(utcGuess.getTime() - offset)
}

export function getUtcDateForLocalDateTime(
  dateStr: string,
  hour: number,
  minute: number,
  timezone: string,
): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const offset = getTimeZoneOffsetMs(utcGuess, timezone)
  return new Date(utcGuess.getTime() - offset)
}

export function getUtcDateRangeForLocalDate(
  dateStr: string,
  timezone: string,
): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null

  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null

  const start = localDateAtMidnightToUtc(dateStr, timezone)
  const nextLocalDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))
  const nextDateStr = nextLocalDate.toISOString().slice(0, 10)
  const end = localDateAtMidnightToUtc(nextDateStr, timezone)

  return { start, end }
}
