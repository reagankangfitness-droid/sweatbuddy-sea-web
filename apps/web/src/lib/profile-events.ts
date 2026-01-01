import { prisma } from './prisma'

// Generate URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

// Generate unique slug by appending numbers if needed
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export interface EventStats {
  eventsAttended: number
  communitiesHosted: number
  totalEventsHosted: number
}

// Get event attendance stats for a user by email
export async function getEventStats(email: string): Promise<EventStats> {
  const normalizedEmail = email.toLowerCase()

  const [eventsAttended, communitiesHosted, totalEventsHosted] = await Promise.all([
    // Events attended (confirmed RSVPs)
    prisma.eventAttendance.count({
      where: {
        email: normalizedEmail,
        confirmed: true,
      },
    }),
    // Communities hosted (recurring events)
    prisma.eventSubmission.count({
      where: {
        contactEmail: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        status: 'APPROVED',
        recurring: true,
      },
    }),
    // Total events hosted
    prisma.eventSubmission.count({
      where: {
        contactEmail: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        status: 'APPROVED',
      },
    }),
  ])

  return {
    eventsAttended,
    communitiesHosted,
    totalEventsHosted,
  }
}

export interface ClerkUserData {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  imageUrl?: string | null
}

export interface UserProfile {
  id: string
  slug: string | null
  name: string | null
  firstName: string | null
  email: string
  imageUrl: string | null
  bio: string | null
  headline: string | null
  location: string | null
  website: string | null
  instagram: string | null
  twitter: string | null
  createdAt: Date
  isPublic: boolean
}

// Get or create a user in the database from Clerk data
export async function getOrCreateUser(clerkUser: ClerkUserData): Promise<UserProfile> {
  const normalizedEmail = clerkUser.email.toLowerCase()

  // Try to find existing user by email
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      slug: true,
      name: true,
      firstName: true,
      email: true,
      imageUrl: true,
      bio: true,
      headline: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      createdAt: true,
      isPublic: true,
    },
  })

  if (user) {
    // Update imageUrl if it changed
    if (clerkUser.imageUrl && user.imageUrl !== clerkUser.imageUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { imageUrl: clerkUser.imageUrl },
        select: {
          id: true,
          slug: true,
          name: true,
          firstName: true,
          email: true,
          imageUrl: true,
          bio: true,
          headline: true,
          location: true,
          website: true,
          instagram: true,
          twitter: true,
          createdAt: true,
          isPublic: true,
        },
      })
    }
    return user
  }

  // Create new user
  const name = clerkUser.fullName || clerkUser.firstName || 'SweatBuddy'
  const slug = await generateUniqueSlug(name)

  user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      firstName: clerkUser.firstName || null,
      slug,
      imageUrl: clerkUser.imageUrl || null,
      isPublic: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      firstName: true,
      email: true,
      imageUrl: true,
      bio: true,
      headline: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      createdAt: true,
      isPublic: true,
    },
  })

  return user
}

// Get user by slug
export async function getUserBySlug(slug: string): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      firstName: true,
      email: true,
      imageUrl: true,
      bio: true,
      headline: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      createdAt: true,
      isPublic: true,
    },
  })
}

// Get user by email
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      slug: true,
      name: true,
      firstName: true,
      email: true,
      imageUrl: true,
      bio: true,
      headline: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      createdAt: true,
      isPublic: true,
    },
  })
}

// Format the public profile summary
export function formatProfileSummary(
  name: string,
  stats: EventStats
): string {
  const { eventsAttended, communitiesHosted } = stats

  if (eventsAttended === 0 && communitiesHosted === 0) {
    return `${name} just joined SweatBuddies`
  }

  const parts: string[] = []

  if (eventsAttended > 0) {
    parts.push(`attended ${eventsAttended} event${eventsAttended === 1 ? '' : 's'}`)
  }

  if (communitiesHosted > 0) {
    parts.push(`hosts ${communitiesHosted} communit${communitiesHosted === 1 ? 'y' : 'ies'}`)
  }

  return `${name} has ${parts.join(' and ')}`
}
