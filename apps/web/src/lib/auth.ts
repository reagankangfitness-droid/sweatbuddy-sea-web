import { cookies } from 'next/headers'
import { prisma } from './prisma'

export interface HostSession {
  id: string
  email: string
  instagramHandle: string
  name: string | null
}

/**
 * Get the current host session from cookies
 * Returns null if not authenticated
 */
export async function getHostSession(): Promise<HostSession | null> {
  try {
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

    return {
      id: organizer.id,
      email: organizer.email,
      instagramHandle: organizer.instagramHandle,
      name: organizer.name,
    }
  } catch (error) {
    console.error('Error getting host session:', error)
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
