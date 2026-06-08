import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { EVENTS, trackEvent } from '@/lib/analytics'

const ALLOWED_EVENTS = new Set<string>([
  EVENTS.LANDING_CTA_CLICKED,
  EVENTS.LANDING_INTENT_OPENED,
  EVENTS.LANDING_INTENT_SUBMITTED,
  EVENTS.LANDING_INTENT_ABANDONED,
  EVENTS.BUDDY_FILTER_USED,
])

type AnalyticsPayload = {
  event?: unknown
  metadata?: unknown
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({})) as AnalyticsPayload
    const event = typeof payload.event === 'string' ? payload.event : ''

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const metadata = normalizeMetadata(payload.metadata)
    const { userId } = await auth()

    await trackEvent(event, userId, {
      ...metadata,
      referrer: request.headers.get('referer') ?? null,
      userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 20)
      .map(([key, raw]) => {
        if (typeof raw === 'string') return [key, raw.slice(0, 300)]
        if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) return [key, raw]
        return [key, String(raw).slice(0, 300)]
      })
  )
}
