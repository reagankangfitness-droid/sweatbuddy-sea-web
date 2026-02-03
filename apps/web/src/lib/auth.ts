import { cookies } from 'next/headers'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export interface HostSession {
  id: string
  email: string
  instagramHandle: string
  name: string | null
  source: 'clerk' | 'legacy' // Track which auth system
  userId: string | null // Internal User.id for account-based queries
}

/**
 * Get the current host session
 * Supports both Clerk auth (primary) and legacy cookie-based auth (deprecated)
 * Returns null if not authenticated
 */
export async function getHostSession(): Promise<HostSession | null> {
  try {
    // First try Clerk auth (primary)
    const { userId } = await auth()

    if (userId) {
      // Get user info from Clerk
      const clerkUser = await currentUser()
      if (!clerkUser) return null

      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) return null

      // Look up the user in our database by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          instagram: true,
          name: true,
          isHost: true,
        },
      })

      if (user && user.instagram) {
        return {
          id: user.id,
          email: user.email,
          instagramHandle: user.instagram,
          name: user.name,
          source: 'clerk',
          userId: user.id, // Same as id since this is from User table
        }
      }

      // If user doesn't have instagram in User table, check Organizer table
      // (for hosts who signed up before User/Organizer unification)
      const organizer = await prisma.organizer.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          email: true,
          instagramHandle: true,
          name: true,
        },
      })

      if (organizer) {
        // Try to find a corresponding User record to get userId
        const userByEmail = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true },
        })

        return {
          id: organizer.id,
          email: organizer.email,
          instagramHandle: organizer.instagramHandle,
          name: organizer.name,
          source: 'clerk',
          userId: userByEmail?.id || null, // Link to User if exists
        }
      }

      // Clerk user but no host profile - return null (they can access as regular user)
      return null
    }

    // Fall back to legacy cookie-based session (deprecated)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value)

    // Verify the organizer still exists in the database
    const organizer = await prisma.organizer.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        instagramHandle: true,
        name: true,
      },
    })

    if (!organizer) {
      return null
    }

    // Try to find a corresponding User record to get userId
    const userByEmail = await prisma.user.findUnique({
      where: { email: organizer.email.toLowerCase() },
      select: { id: true },
    })

    return {
      id: organizer.id,
      email: organizer.email,
      instagramHandle: organizer.instagramHandle,
      name: organizer.name,
      source: 'legacy',
      userId: userByEmail?.id || null, // Link to User if exists
    }
  } catch {
    return null
  }
}

/**
 * Check if the current user is authenticated as a host
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getHostSession()
  return session !== null
}
