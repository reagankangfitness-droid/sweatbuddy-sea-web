import { prisma } from './prisma'

export interface AttendanceRecord {
  id: string
  eventId: string
  eventName: string
  email: string
  name: string | null
  subscribe: boolean
  timestamp: string
  confirmed: boolean
}

export interface NewsletterSubscriber {
  email: string
  name: string | null
  subscribedAt: string
  source: string
}

// Generate unique ID
function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Save attendance to database
export async function saveAttendance(record: Omit<AttendanceRecord, 'id' | 'confirmed'>): Promise<AttendanceRecord> {
  const id = generateId()

  // Check for duplicate (same email + event)
  const existing = await prisma.eventAttendance.findFirst({
    where: {
      email: record.email.toLowerCase(),
      eventId: record.eventId,
    },
  })

  if (existing) {
    throw new Error("You've already registered for this event")
  }

  const attendance = await prisma.eventAttendance.create({
    data: {
      id,
      eventId: record.eventId,
      eventName: record.eventName,
      email: record.email.toLowerCase().trim(),
      name: record.name?.trim() || null,
      subscribe: record.subscribe,
      timestamp: new Date(record.timestamp),
      confirmed: true,
    },
  })

  return {
    id: attendance.id,
    eventId: attendance.eventId,
    eventName: attendance.eventName,
    email: attendance.email,
    name: attendance.name,
    subscribe: attendance.subscribe,
    timestamp: attendance.timestamp.toISOString(),
    confirmed: attendance.confirmed,
  }
}

// Get attendees by event
export async function getAttendeesByEvent(eventId: string): Promise<AttendanceRecord[]> {
  const attendees = await prisma.eventAttendance.findMany({
    where: { eventId },
    orderBy: { timestamp: 'desc' },
  })

  return attendees.map(a => ({
    id: a.id,
    eventId: a.eventId,
    eventName: a.eventName,
    email: a.email,
    name: a.name,
    subscribe: a.subscribe,
    timestamp: a.timestamp.toISOString(),
    confirmed: a.confirmed,
  }))
}

// Get all attendees
export async function getAllAttendees(): Promise<AttendanceRecord[]> {
  const attendees = await prisma.eventAttendance.findMany({
    orderBy: { timestamp: 'desc' },
  })

  return attendees.map(a => ({
    id: a.id,
    eventId: a.eventId,
    eventName: a.eventName,
    email: a.email,
    name: a.name,
    subscribe: a.subscribe,
    timestamp: a.timestamp.toISOString(),
    confirmed: a.confirmed,
  }))
}

// Get going count for an event
export async function getGoingCount(eventId: string): Promise<number> {
  return prisma.eventAttendance.count({
    where: { eventId, confirmed: true },
  })
}

// Add to newsletter subscribers
export async function addToNewsletter(email: string, name: string | null): Promise<void> {
  const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (existingSubscriber) {
    return // Already subscribed
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      subscribedAt: new Date(),
      source: 'event_attendance',
    },
  })
}

// Get newsletter subscribers
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: 'desc' },
  })

  return subscribers.map(s => ({
    email: s.email,
    name: s.name,
    subscribedAt: s.subscribedAt.toISOString(),
    source: s.source,
  }))
}
