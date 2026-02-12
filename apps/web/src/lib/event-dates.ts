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

/**
 * Get "now" in Singapore timezone as a Date object.
 * Use this instead of `new Date()` for date comparisons on the server.
 */
export function getSGNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: EVENT_TIMEZONE }))
}

/**
 * Get today at midnight in Singapore timezone.
 */
export function getSGToday(): Date {
  const sg = getSGNow()
  sg.setHours(0, 0, 0, 0)
  return sg
}

/**
 * Format a Date as YYYY-MM-DD in Singapore timezone.
 * Use this instead of `date.toISOString().slice(0, 10)` which extracts the UTC date.
 */
export function toSGDateStr(d: Date): string {
  const sg = new Date(d.toLocaleString('en-US', { timeZone: EVENT_TIMEZONE }))
  const y = sg.getFullYear()
  const m = String(sg.getMonth() + 1).padStart(2, '0')
  const day = String(sg.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Check if a date is today in Singapore timezone.
 */
export function isTodaySG(date: Date | null): boolean {
  if (!date) return false
  return toSGDateStr(date) === toSGDateStr(getSGNow())
}

/**
 * Check if a date falls on the upcoming weekend (Sat/Sun) in Singapore timezone.
 */
export function isThisWeekendSG(date: Date | null): boolean {
  if (!date) return false
  const sg = new Date(date.toLocaleString('en-US', { timeZone: EVENT_TIMEZONE }))
  const today = getSGToday()
  const dayOfWeek = sg.getDay()
  const daysUntil = Math.ceil((sg.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return (dayOfWeek === 0 || dayOfWeek === 6) && daysUntil <= 7
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

  const sgNow = getSGNow()
  const today = getSGToday()
  const todayDay = sgNow.getDay()

  let daysUntil = targetDay - todayDay
  if (daysUntil < 0) daysUntil += 7
  if (daysUntil === 0) return today

  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysUntil)
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

  // Get the calendar date in Singapore timezone to avoid UTC day-shift
  const dateStr = toSGDateStr(date)
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  return new Date(`${dateStr}T${h}:${m}:00${EVENT_TZ_OFFSET}`)
}
