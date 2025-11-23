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
