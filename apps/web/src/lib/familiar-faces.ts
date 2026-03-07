import { prisma } from '@/lib/prisma'

export interface FamiliarFace {
  name: string | null
  firstName: string | null
  imageUrl: string | null
  sharedEventCount: number
}

interface FamiliarFacesResult {
  familiarFaces: FamiliarFace[]
  totalGoing: number
}

/**
 * Get familiar faces for a single event — people the user has previously
 * attended events with who are also going to the target event.
 */
export async function getFamiliarFaces(
  userEmail: string,
  targetEventId: string
): Promise<FamiliarFacesResult> {
  // 1. Get user's past event IDs (most recent 50)
  const userAttendances = await prisma.eventAttendance.findMany({
    where: { email: { equals: userEmail, mode: 'insensitive' } },
    orderBy: { timestamp: 'desc' },
    take: 50,
    select: { eventId: true },
  })

  const userEventIds = userAttendances.map((a) => a.eventId)

  if (userEventIds.length === 0) {
    const totalGoing = await prisma.eventAttendance.count({
      where: { eventId: targetEventId },
    })
    return { familiarFaces: [], totalGoing }
  }

  // 2. Get co-attendee emails from those events (excluding self)
  const coAttendees = await prisma.eventAttendance.findMany({
    where: {
      eventId: { in: userEventIds },
      NOT: { email: { equals: userEmail, mode: 'insensitive' } },
    },
    select: { email: true, eventId: true },
  })

  // Build map: email → number of shared events
  const sharedCountMap = new Map<string, number>()
  for (const ca of coAttendees) {
    const emailLower = ca.email.toLowerCase()
    sharedCountMap.set(emailLower, (sharedCountMap.get(emailLower) || 0) + 1)
  }

  if (sharedCountMap.size === 0) {
    const totalGoing = await prisma.eventAttendance.count({
      where: { eventId: targetEventId },
    })
    return { familiarFaces: [], totalGoing }
  }

  // 3. Check which co-attendees are going to the target event
  const [targetAttendees, totalGoing] = await Promise.all([
    prisma.eventAttendance.findMany({
      where: {
        eventId: targetEventId,
        email: { in: Array.from(sharedCountMap.keys()), mode: 'insensitive' },
      },
      select: { email: true },
    }),
    prisma.eventAttendance.count({
      where: { eventId: targetEventId },
    }),
  ])

  if (targetAttendees.length === 0) {
    return { familiarFaces: [], totalGoing }
  }

  const matchingEmails = targetAttendees.map((a) => a.email.toLowerCase())

  // 4. Resolve to User profiles
  const users = await prisma.user.findMany({
    where: { email: { in: matchingEmails, mode: 'insensitive' } },
    select: { email: true, name: true, firstName: true, imageUrl: true },
  })

  // 5. Sort by shared event count desc, limit to 5
  const familiarFaces: FamiliarFace[] = users
    .map((u) => ({
      name: u.name,
      firstName: u.firstName,
      imageUrl: u.imageUrl,
      sharedEventCount: sharedCountMap.get(u.email.toLowerCase()) || 0,
    }))
    .sort((a, b) => b.sharedEventCount - a.sharedEventCount)
    .slice(0, 5)

  return { familiarFaces, totalGoing }
}

/**
 * Batch version: get familiar faces for multiple events at once.
 * Used on the events listing page to avoid N+1 queries.
 */
export async function getFamiliarFacesForEvents(
  userEmail: string,
  eventIds: string[]
): Promise<Map<string, FamiliarFace[]>> {
  const result = new Map<string, FamiliarFace[]>()

  if (eventIds.length === 0) return result

  // 1. Get user's past event IDs (most recent 50)
  const userAttendances = await prisma.eventAttendance.findMany({
    where: { email: { equals: userEmail, mode: 'insensitive' } },
    orderBy: { timestamp: 'desc' },
    take: 50,
    select: { eventId: true },
  })

  const userEventIds = userAttendances.map((a) => a.eventId)
  if (userEventIds.length === 0) return result

  // 2. Get co-attendee emails from those events (excluding self)
  const coAttendees = await prisma.eventAttendance.findMany({
    where: {
      eventId: { in: userEventIds },
      NOT: { email: { equals: userEmail, mode: 'insensitive' } },
    },
    select: { email: true, eventId: true },
  })

  const sharedCountMap = new Map<string, number>()
  for (const ca of coAttendees) {
    const emailLower = ca.email.toLowerCase()
    sharedCountMap.set(emailLower, (sharedCountMap.get(emailLower) || 0) + 1)
  }

  if (sharedCountMap.size === 0) return result

  // 3. Check which co-attendees are going to any of the target events
  const targetAttendees = await prisma.eventAttendance.findMany({
    where: {
      eventId: { in: eventIds },
      email: { in: Array.from(sharedCountMap.keys()), mode: 'insensitive' },
    },
    select: { eventId: true, email: true },
  })

  if (targetAttendees.length === 0) return result

  // Group by eventId
  const eventAttendeesMap = new Map<string, string[]>()
  for (const ta of targetAttendees) {
    const arr = eventAttendeesMap.get(ta.eventId) || []
    arr.push(ta.email.toLowerCase())
    eventAttendeesMap.set(ta.eventId, arr)
  }

  // 4. Resolve all unique emails to User profiles
  const allEmails = new Set<string>()
  for (const emails of eventAttendeesMap.values()) {
    for (const e of emails) allEmails.add(e)
  }

  const users = await prisma.user.findMany({
    where: { email: { in: Array.from(allEmails), mode: 'insensitive' } },
    select: { email: true, name: true, firstName: true, imageUrl: true },
  })

  const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]))

  // 5. Build result map
  for (const [eventId, emails] of eventAttendeesMap) {
    const faces: FamiliarFace[] = emails
      .map((email) => {
        const u = userByEmail.get(email)
        if (!u) return null
        return {
          name: u.name,
          firstName: u.firstName,
          imageUrl: u.imageUrl,
          sharedEventCount: sharedCountMap.get(email) || 0,
        }
      })
      .filter((f): f is FamiliarFace => f !== null)
      .sort((a, b) => b.sharedEventCount - a.sharedEventCount)
      .slice(0, 5)

    if (faces.length > 0) {
      result.set(eventId, faces)
    }
  }

  return result
}
