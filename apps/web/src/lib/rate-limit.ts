import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================
// Upstash Redis-backed rate limiting (for API route protection)
// ============================================================

// Only create rate limiters if Redis is configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Different rate limit tiers
export const rateLimiters = {
  // Strict: auth endpoints (5 requests per 60 seconds)
  auth: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:auth' })
    : null,
  // Standard: API endpoints (30 requests per 60 seconds)
  api: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '60 s'), prefix: 'rl:api' })
    : null,
  // Strict: payment endpoints (10 requests per 60 seconds)
  payment: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s'), prefix: 'rl:payment' })
    : null,
}

export type RateLimitTier = keyof typeof rateLimiters

const FALLBACK_LIMITS: Record<RateLimitTier, { maxRequests: number; windowMs: number }> = {
  auth: { maxRequests: 5, windowMs: 60_000 },
  api: { maxRequests: 30, windowMs: 60_000 },
  payment: { maxRequests: 10, windowMs: 60_000 },
}

const fallbackApiStore = new Map<string, { timestamps: number[] }>()
let fallbackLastCleanup = Date.now()

function checkFallbackApiRateLimit(
  key: string,
  tier: RateLimitTier,
): { allowed: boolean; limit: number; remaining: number; reset: number } {
  const config = FALLBACK_LIMITS[tier]
  const now = Date.now()
  const cutoff = now - config.windowMs

  if (now - fallbackLastCleanup > 5 * 60_000) {
    fallbackLastCleanup = now
    for (const [entryKey, entry] of fallbackApiStore) {
      entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > cutoff)
      if (entry.timestamps.length === 0) fallbackApiStore.delete(entryKey)
    }
  }

  const entry = fallbackApiStore.get(key) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > cutoff)

  const reset = entry.timestamps[0]
    ? entry.timestamps[0] + config.windowMs
    : now + config.windowMs

  if (entry.timestamps.length >= config.maxRequests) {
    fallbackApiStore.set(key, entry)
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
    }
  }

  entry.timestamps.push(now)
  fallbackApiStore.set(key, entry)

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.timestamps.length),
    reset,
  }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function checkApiRateLimit(
  request: NextRequest,
  tier: RateLimitTier = 'api',
  identifier?: string,
): Promise<NextResponse | null> {
  const limiter = rateLimiters[tier]
  if (!limiter) {
    const id = identifier || getClientIp(request)
    const result = checkFallbackApiRateLimit(`${tier}:${id}`, tier)

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          },
        },
      )
    }

    return null
  }

  const id = identifier || getClientIp(request)
  const { success, limit, reset, remaining } = await limiter.limit(id)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      },
    )
  }

  return null // Not rate limited
}

// ============================================================
// In-memory rate limiting (for AI endpoints)
// ============================================================

/**
 * Simple in-memory rate limiter for serverless AI endpoints.
 * Tracks requests per user with a sliding window.
 * State resets on cold start — acceptable for Vercel serverless.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number | null
}

/**
 * Check rate limit for a user + endpoint combination.
 * @param userId - Unique user identifier
 * @param endpoint - Endpoint name (e.g. 'ai/plan')
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs)

  const key = `${userId}:${endpoint}`
  const now = Date.now()
  const cutoff = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = oldestInWindow + windowMs - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterSeconds: null,
  }
}
