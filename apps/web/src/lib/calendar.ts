interface CalendarEvent {
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
}

/**
 * Formats a date to the Google Calendar format (YYYYMMDDTHHmmssZ)
 */
function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Generates a Google Calendar URL for an event
 * Opens in a new tab with pre-filled event details
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatGoogleCalendarDate(event.startTime)}/${formatGoogleCalendarDate(event.endTime)}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates an .ics file content for calendar apps (Apple Calendar, Outlook)
 */
export function generateIcsFile(event: CalendarEvent): string {
  const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//sweatbuddies//Calendar//EN
BEGIN:VEVENT
UID:${Date.now()}@sweatbuddies.com
DTSTAMP:${formatIcsDate(new Date())}
DTSTART:${formatIcsDate(event.startTime)}
DTEND:${formatIcsDate(event.endTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`
}

/**
 * Downloads an .ics file to the user's device
 */
export function downloadIcsFile(event: CalendarEvent, filename: string = 'event.ics') {
  const icsContent = generateIcsFile(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * Generate Outlook Web URL (for Office 365 / Outlook.com)
 */
export function generateOutlookWebUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => date.toISOString()

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatDate(event.startTime),
    enddt: formatDate(event.endTime),
    body: event.description || '',
    location: event.location || '',
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate Yahoo Calendar URL
 */
export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  // Calculate duration in HHMM format
  const durationMs = event.endTime.getTime() - event.startTime.getTime()
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
  const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
  const duration = `${String(durationHours).padStart(2, '0')}${String(durationMins).padStart(2, '0')}`

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatDate(event.startTime),
    dur: duration,
    desc: event.description || '',
    in_loc: event.location || '',
  })

  return `https://calendar.yahoo.com/?${params.toString()}`
}

/**
 * Parse event time string to Date object
 * Handles formats like "7:00 AM", "19:00", "7pm"
 */
export function parseEventTime(dateStr: string | null, timeStr: string): Date {
  let date: Date
  if (dateStr) {
    // Parse YYYY-MM-DD as local date to avoid UTC midnight day-shift
    const parts = dateStr.split('T')[0].split('-').map(Number)
    date = new Date(parts[0], parts[1] - 1, parts[2])
  } else {
    date = new Date()
  }
  date.setHours(0, 0, 0, 0) // Reset time part

  // Parse time string
  const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/)
  if (timeMatch) {
    let hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2] || '0')
    const period = timeMatch[3]?.toUpperCase()

    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0

    date.setHours(hours, minutes, 0, 0)
  }

  return date
}

/**
 * Create calendar event from SweatBuddies event data
 */
export function createCalendarEventFromData(
  eventData: {
    name: string
    description?: string | null
    location: string
    eventDate?: string | null
    time: string
    id?: string
    slug?: string | null
  },
  durationHours: number = 1.5
): CalendarEvent {
  const startTime = parseEventTime(eventData.eventDate || null, eventData.time)
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'
  const eventUrl = eventData.slug
    ? `${baseUrl}/e/${eventData.slug}`
    : eventData.id
    ? `${baseUrl}/?event=${eventData.id}`
    : ''

  return {
    title: eventData.name,
    description: `${eventData.description || 'Fitness event on SweatBuddies'}${eventUrl ? `\n\nEvent Link: ${eventUrl}` : ''}`,
    location: eventData.location,
    startTime,
    endTime,
  }
}
