/**
 * Centralized event date/time utilities for SweatBuddies.
 *
 * All events are treated as Singapore-local (Asia/Singapore, UTC+8).
 * Every date display and computation should go through these helpers
 * to avoid per-component timezone bugs.
 */

export const EVENT_TIMEZONE = 'Asia/Singapore'
export const EVENT_TZ_ABBR = 'SGT'
export const EVENT_TZ_OFFSET = '+08:00'

// ─── Display formatting ──────────────────────────────────────────────

const RECURRING_DAY_MAP: Record<string, string> = {
  'Sundays': 'Every Sun', 'Mondays': 'Every Mon', 'Tuesdays': 'Every Tue',
  'Wednesdays': 'Every Wed', 'Thursdays': 'Every Thu', 'Fridays': 'Every Fri',
  'Saturdays': 'Every Sat',
  'Every Sunday': 'Every Sun', 'Every Monday': 'Every Mon', 'Every Tuesday': 'Every Tue',
  'Every Wednesday': 'Every Wed', 'Every Thursday': 'Every Thu', 'Every Friday': 'Every Fri',
  'Every Saturday': 'Every Sat',
}

/**
 * Format an event date for display. Single source of truth for all components.
 *
 * - Recurring events → "Every Mon", "Every Sat", etc.
 * - One-time events  → "Sat, Feb 14" (always in Singapore timezone)
 * - Fallback         → raw `day` field
 */
export function formatEventDate(
  eventDate: string | null | undefined,
  day: string,
  recurring: boolean,
  options: {
    weekday?: 'short' | 'long'
    month?: 'short' | 'long'
    year?: boolean
  } = {},
): string {
  // Recurring events: show "Every [Day]"
  if (recurring) {
    return RECURRING_DAY_MAP[day] || day
  }

  // One-time events: format from eventDate
  if (!eventDate) return day

  try {
    const date = new Date(eventDate)
    if (isNaN(date.getTime())) return day

    return date.toLocaleDateString('en-US', {
      weekday: options.weekday ?? 'short',
      month: options.month ?? 'short',
      day: 'numeric',
      year: options.year ? 'numeric' : undefined,
      timeZone: EVENT_TIMEZONE,
    })
  } catch {
    return day
  }
}

/**
 * Parse a YYYY-MM-DD string into a local Date without UTC day-shift.
 * Use this instead of `new Date("2026-02-17")` which parses as UTC midnight.
 */
export function parseLocalDate(dateStr: string): Date {
  const iso = dateStr.split('T')[0]
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

// ─── Server-side Singapore-aware helpers ──────────────────────────────
// IMPORTANT: These use Intl.DateTimeFormat to extract SGT date parts directly
// from Date objects. This avoids the double-conversion bug where
// `new Date(date.toLocaleString(...))` applies the timezone offset twice
// on UTC servers (Vercel), causing dates to shift after 4 PM SGT.

/** Reusable formatter for YYYY-MM-DD in SGT */
const sgDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Reusable formatter for SGT day of week */
const sgWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIMEZONE,
  weekday: 'short',
})

/**
 * Format a Date as YYYY-MM-DD in Singapore timezone.
 * Uses Intl.DateTimeFormat to avoid double-conversion bugs.
 */
export function toSGDateStr(d: Date): string {
  const parts = sgDateFormatter.formatToParts(d)
  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
  return `${y}-${m}-${day}`
}

/**
 * Get the SGT day of week (0=Sun, 1=Mon, ..., 6=Sat) for a Date.
 */
function getSGDayOfWeek(d: Date): number {
  const dayName = sgWeekdayFormatter.format(d)
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return dayMap[dayName] ?? 0
}

/**
 * Get today at midnight in Singapore timezone.
 * Returns a Date suitable for Prisma queries (where eventDate is stored as midnight UTC).
 */
export function getSGToday(): Date {
  const todayStr = toSGDateStr(new Date())
  return new Date(todayStr + 'T00:00:00Z')
}

/**
 * Check if a date is today in Singapore timezone.
 */
export function isTodaySG(date: Date | null): boolean {
  if (!date) return false
  return toSGDateStr(date) === toSGDateStr(new Date())
}

/**
 * Check if a date falls on the upcoming weekend (Sat/Sun) in Singapore timezone.
 */
export function isThisWeekendSG(date: Date | null): boolean {
  if (!date) return false
  const dayOfWeek = getSGDayOfWeek(date)
  if (dayOfWeek !== 0 && dayOfWeek !== 6) return false
  // Check within next 7 days
  const eventStr = toSGDateStr(date)
  const todayStr = toSGDateStr(new Date())
  const diffMs = new Date(eventStr).getTime() - new Date(todayStr).getTime()
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return daysUntil >= 0 && daysUntil <= 7
}

/**
 * Get the next occurrence of a named day (e.g., "Saturday", "Every Tuesday")
 * in Singapore timezone.
 */
export function getNextOccurrenceSG(day: string): Date | null {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const cleanDay = day.toLowerCase().replace('every ', '').trim()
  const targetDay = days.findIndex(d => d.toLowerCase().startsWith(cleanDay.slice(0, 3)))
  if (targetDay === -1) return null

  const todayDay = getSGDayOfWeek(new Date())
  const today = getSGToday()

  let daysUntil = targetDay - todayDay
  if (daysUntil < 0) daysUntil += 7
  if (daysUntil === 0) return today

  const nextDate = new Date(today)
  nextDate.setUTCDate(today.getUTCDate() + daysUntil)
  return nextDate
}

/**
 * Combine a Date and a time string (e.g., "3:00 PM") into a proper Date
 * in Singapore timezone.
 */
export function combineDateTimeSG(date: Date | null, timeStr: string | null): Date | null {
  if (!date) return null
  if (!timeStr) return date

  const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!timeParts) return date

  let hours = parseInt(timeParts[1], 10)
  const minutes = parseInt(timeParts[2], 10)
  const period = timeParts[3]?.toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  // Get the calendar date in Singapore timezone
  const dateStr = toSGDateStr(date)
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  return new Date(`${dateStr}T${h}:${m}:00${EVENT_TZ_OFFSET}`)
}
