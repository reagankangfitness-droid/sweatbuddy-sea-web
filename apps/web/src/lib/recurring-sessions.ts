import {
  DEFAULT_CITY_LOCATION_CONFIG,
  getCityLocationConfigForPointOrText,
  getNearestCityLocationConfig,
  getUtcDateForLocalDateTime,
} from '@/lib/location-config'

export const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function normalizeTimezone(timezone: string | null | undefined): string {
  if (!timezone) return DEFAULT_CITY_LOCATION_CONFIG.timezone

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
    return timezone
  } catch {
    return DEFAULT_CITY_LOCATION_CONFIG.timezone
  }
}

function getLocalDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    dayOfWeek: WEEKDAY_INDEX[values.weekday] ?? 0,
  }
}

function toLocalDateString(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10)
}

function parseLocalTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  return { hour, minute }
}

export function getNextDatesForTimezone(
  dayOfWeek: number,
  startTime: string,
  fromDate: Date,
  count: number,
  timezone: string,
): Date[] {
  const parsedTime = parseLocalTime(startTime)
  if (!parsedTime || count <= 0) return []

  const safeTimezone = normalizeTimezone(timezone)
  const localNow = getLocalDateParts(fromDate, safeTimezone)

  let daysUntil = dayOfWeek - localNow.dayOfWeek
  if (daysUntil < 0) daysUntil += 7

  if (daysUntil === 0) {
    const todayDateStr = toLocalDateString(localNow.year, localNow.month, localNow.day)
    const todayStart = getUtcDateForLocalDateTime(
      todayDateStr,
      parsedTime.hour,
      parsedTime.minute,
      safeTimezone,
    )
    if (!todayStart || todayStart.getTime() <= fromDate.getTime()) daysUntil = 7
  }

  const dates: Date[] = []
  for (let i = 0; i < count; i++) {
    const targetDateStr = toLocalDateString(
      localNow.year,
      localNow.month,
      localNow.day + daysUntil + i * 7,
    )
    const utcDate = getUtcDateForLocalDateTime(
      targetDateStr,
      parsedTime.hour,
      parsedTime.minute,
      safeTimezone,
    )
    if (utcDate) dates.push(utcDate)
  }

  return dates
}

export function getLocalDateString(utcDate: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(utcDate)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function inferSessionTimezone(params: {
  timezone?: string | null
  city?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}): string {
  if (params.timezone) return normalizeTimezone(params.timezone)

  const hasPoint =
    typeof params.latitude === 'number' &&
    Number.isFinite(params.latitude) &&
    typeof params.longitude === 'number' &&
    Number.isFinite(params.longitude)

  if (hasPoint) {
    return getNearestCityLocationConfig(params.latitude!, params.longitude!).timezone
  }

  const city = getCityLocationConfigForPointOrText(
    null,
    [params.city, params.address].filter(Boolean).join(' '),
  )

  return city.timezone
}
