import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

export interface Event {
  id: string
  name: string
  category: string
  day: string
  eventDate?: string | null  // ISO date string (e.g., "2024-01-15")
  time: string
  location: string
  description: string | null
  organizer: string
  imageUrl: string | null
  recurring: boolean
  goingCount?: number
}

// Cached version of getEvents - revalidates every 60 seconds
export const getEvents = unstable_cache(
  async (): Promise<Event[]> => {
    try {
      // Get approved events from database only - select only needed fields
      const approvedSubmissions = await prisma.eventSubmission.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          eventName: true,
          category: true,
          day: true,
          eventDate: true,
          time: true,
          location: true,
          description: true,
          organizerInstagram: true,
          imageUrl: true,
          recurring: true,
        },
      })

      // Convert approved submissions to Event format
      return approvedSubmissions.map(submission => ({
        id: submission.id,
        name: submission.eventName,
        category: submission.category,
        day: submission.day,
        eventDate: submission.eventDate?.toISOString().split('T')[0] || null,
        time: submission.time,
        location: submission.location,
        description: submission.description,
        organizer: submission.organizerInstagram,
        imageUrl: submission.imageUrl,
        recurring: submission.recurring,
      }))
    } catch (error) {
      console.error('Error fetching events:', error)
      return []
    }
  },
  ['events-list-page'],
  { revalidate: 60, tags: ['events'] }
)

// Cached single event fetch - used for OG metadata generation
export const getEventById = async (id: string): Promise<Event | null> => {
  return unstable_cache(
    async () => {
      try {
        const submission = await prisma.eventSubmission.findFirst({
          where: {
            id: id,
            status: 'APPROVED'
          },
          select: {
            id: true,
            eventName: true,
            category: true,
            day: true,
            eventDate: true,
            time: true,
            location: true,
            description: true,
            organizerInstagram: true,
            imageUrl: true,
            recurring: true,
          },
        })

        if (submission) {
          return {
            id: submission.id,
            name: submission.eventName,
            category: submission.category,
            day: submission.day,
            eventDate: submission.eventDate?.toISOString().split('T')[0] || null,
            time: submission.time,
            location: submission.location,
            description: submission.description,
            organizer: submission.organizerInstagram,
            imageUrl: submission.imageUrl,
            recurring: submission.recurring,
          }
        }

        return null
      } catch (error) {
        console.error('Error fetching event by ID:', error)
        return null
      }
    },
    [`event-${id}`],
    { revalidate: 60, tags: ['events', `event-${id}`] }
  )()
}
