import type { DiscoverySource } from '@prisma/client'

export type DiscoveryCandidate = {
  title: string
  description?: string | null
  category?: string | null
  city: string
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  startTime?: Date | null
  endTime?: Date | null
  timezone: string
  price?: number | null
  currency: string
  signupUrl?: string | null
  sourceUrl: string
  imageUrl?: string | null
  hostName?: string | null
  communityName?: string | null
  confidence: number
  rawData?: unknown
}

const DEFAULT_TIMEOUT_MS = 12000

export async function discoverSessionsFromSource(source: DiscoverySource): Promise<DiscoveryCandidate[]> {
  const response = await fetch(source.url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'SweatBuddiesDiscovery/1.0 (+https://sweatbuddies.co)',
    },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
    throw new Error(`Unsupported content type: ${contentType || 'unknown'}`)
  }

  const body = await response.text()
  const baseUrl = new URL(source.url)
  const jsonLdCandidates = extractJsonLdEvents(body)
    .map((event) => normalizeJsonLdEvent(event, source, baseUrl))
    .filter((candidate): candidate is DiscoveryCandidate => Boolean(candidate))

  if (jsonLdCandidates.length > 0) {
    return dedupeCandidates(jsonLdCandidates)
  }

  const fallbackTitle = extractHtmlTitle(body) || source.name
  return [
    {
      title: fallbackTitle.slice(0, 220),
      description: extractMetaDescription(body),
      category: source.category,
      city: source.city,
      location: null,
      startTime: null,
      endTime: null,
      timezone: timezoneForCity(source.city),
      price: null,
      currency: currencyForCity(source.city),
      signupUrl: source.url,
      sourceUrl: source.url,
      imageUrl: extractMetaImage(body, baseUrl),
      hostName: source.name,
      communityName: source.name,
      confidence: 25,
      rawData: { fallback: true, reason: 'No JSON-LD Event data found' },
    },
  ]
}

function extractJsonLdEvents(html: string): unknown[] {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? []
  const events: unknown[] = []

  for (const script of scripts) {
    const json = script
      .replace(/^<script[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim()

    try {
      collectEvents(JSON.parse(decodeHtmlEntities(json)), events)
    } catch {
      continue
    }
  }

  return events
}

function collectEvents(value: unknown, events: unknown[]) {
  if (!value) return
  if (Array.isArray(value)) {
    value.forEach((entry) => collectEvents(entry, events))
    return
  }
  if (typeof value !== 'object') return

  const record = value as Record<string, unknown>
  const type = record['@type']
  const types = Array.isArray(type) ? type : [type]
  if (types.some((entry) => String(entry).toLowerCase() === 'event')) {
    events.push(record)
  }

  collectEvents(record['@graph'], events)
  collectEvents(record.event, events)
  collectEvents(record.events, events)
}

function normalizeJsonLdEvent(
  event: unknown,
  source: DiscoverySource,
  baseUrl: URL,
): DiscoveryCandidate | null {
  if (!event || typeof event !== 'object') return null
  const record = event as Record<string, unknown>
  const title = cleanText(readString(record.name) || readString(record.headline) || '')
  if (!title) return null

  const startTime = parseDate(readString(record.startDate))
  const endTime = parseDate(readString(record.endDate))
  const sourceUrl = absolutize(readString(record.url) || source.url, baseUrl) || source.url
  const signupUrl = absolutize(readString(record.offers, 'url') || readString(record.url), baseUrl)
  const location = readLocation(record.location)
  const geo = readGeo(record.location)
  const priceInfo = readPrice(record.offers, source.city)

  return {
    title: title.slice(0, 220),
    description: cleanText(readString(record.description) || '') || null,
    category: source.category,
    city: source.city,
    location,
    latitude: geo.lat,
    longitude: geo.lng,
    startTime,
    endTime,
    timezone: timezoneForCity(source.city),
    price: priceInfo.price,
    currency: priceInfo.currency,
    signupUrl,
    sourceUrl,
    imageUrl: readImage(record.image, baseUrl),
    hostName: readString(record.organizer, 'name') || source.name,
    communityName: source.name,
    confidence: scoreCandidate({ title, startTime, location, signupUrl, sourceUrl }),
    rawData: record,
  }
}

function scoreCandidate(candidate: {
  title: string
  startTime?: Date | null
  location?: string | null
  signupUrl?: string | null
  sourceUrl?: string | null
}) {
  let score = 35
  if (candidate.title) score += 15
  if (candidate.startTime) score += 25
  if (candidate.location) score += 15
  if (candidate.signupUrl) score += 5
  if (candidate.sourceUrl) score += 5
  return Math.min(100, score)
}

function readString(value: unknown, nestedKey?: string): string | null {
  if (nestedKey && value && typeof value === 'object') {
    return readString((value as Record<string, unknown>)[nestedKey])
  }
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return readString(value[0])
  return null
}

function readLocation(value: unknown): string | null {
  const plain = readString(value)
  if (plain) return cleanText(plain)
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const name = readString(record.name)
  const address = record.address && typeof record.address === 'object'
    ? [
        readString(record.address, 'streetAddress'),
        readString(record.address, 'addressLocality'),
        readString(record.address, 'addressCountry'),
      ].filter(Boolean).join(', ')
    : readString(record.address)

  return cleanText([name, address].filter(Boolean).join(', ')) || null
}

function readGeo(value: unknown): { lat?: number | null; lng?: number | null } {
  if (!value || typeof value !== 'object') return {}
  const location = value as Record<string, unknown>
  const geo = location.geo && typeof location.geo === 'object'
    ? location.geo as Record<string, unknown>
    : undefined

  return {
    lat: parseNumber(geo?.latitude),
    lng: parseNumber(geo?.longitude),
  }
}

function readPrice(value: unknown, city: string): { price?: number | null; currency: string } {
  const currency = readString(value, 'priceCurrency') || currencyForCity(city)
  const rawPrice = readString(value, 'price')
  const priceNumber = parseNumber(rawPrice)

  return {
    price: typeof priceNumber === 'number' ? Math.round(priceNumber * 100) : null,
    currency: currency.slice(0, 3).toUpperCase(),
  }
}

function readImage(value: unknown, baseUrl: URL): string | null {
  const direct = readString(value)
  if (direct) return absolutize(direct, baseUrl)
  if (Array.isArray(value)) return readImage(value[0], baseUrl)
  if (value && typeof value === 'object') return absolutize(readString(value, 'url') || '', baseUrl)
  return null
}

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function extractHtmlTitle(html: string): string | null {
  return cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '') || null
}

function extractMetaDescription(html: string): string | null {
  return extractMetaContent(html, 'description')
}

function extractMetaImage(html: string, baseUrl: URL): string | null {
  const image = extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image')
  return image ? absolutize(image, baseUrl) : null
}

function extractMetaContent(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return cleanText(pattern.exec(html)?.[1] ?? '') || null
}

function absolutize(value: string | null, baseUrl: URL): string | null {
  if (!value) return null
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return null
  }
}

function dedupeCandidates(candidates: DiscoveryCandidate[]) {
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    const key = `${candidate.sourceUrl}|${candidate.title}|${candidate.startTime?.toISOString() ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function cleanText(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function timezoneForCity(city: string): string {
  return city.toLowerCase().includes('bangkok') ? 'Asia/Bangkok' : 'Asia/Singapore'
}

function currencyForCity(city: string): string {
  return city.toLowerCase().includes('bangkok') ? 'THB' : 'SGD'
}
