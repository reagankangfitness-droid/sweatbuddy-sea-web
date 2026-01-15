import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'organizer_session'
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || 'fallback-dev-secret'

export interface OrganizerSession {
  id: string
  email: string
  instagramHandle: string
  name: string | null
}

// Create HMAC signature for session data
function signSession(data: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex')
}

// Verify HMAC signature
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = signSession(data)
  // Use timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return false
  }
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Set organizer session cookie with signature
export async function setOrganizerSession(session: OrganizerSession): Promise<void> {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify(session)
  const signature = signSession(sessionData)

  // Store data and signature together
  const signedSession = JSON.stringify({
    data: sessionData,
    sig: signature,
  })

  cookieStore.set(COOKIE_NAME, signedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

// Get and verify organizer session from cookie
export async function getOrganizerSession(): Promise<OrganizerSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (!sessionCookie) {
      return null
    }

    // Parse the signed session
    let signedSession: { data: string; sig: string }
    try {
      signedSession = JSON.parse(sessionCookie.value)
    } catch {
      // Legacy unsigned session - try to parse directly
      // This provides backward compatibility during migration
      try {
        const legacySession = JSON.parse(sessionCookie.value)
        if (legacySession.instagramHandle && legacySession.id) {
          // Valid legacy session structure - return it but log warning
          console.warn('[SECURITY] Legacy unsigned organizer session detected. Will be upgraded on next login.')
          return legacySession as OrganizerSession
        }
      } catch {
        // Invalid session
      }
      return null
    }

    // Verify signature
    if (!signedSession.data || !signedSession.sig) {
      return null
    }

    if (!verifySignature(signedSession.data, signedSession.sig)) {
      console.warn('[SECURITY] Invalid session signature detected - possible tampering')
      return null
    }

    // Parse and return session data
    return JSON.parse(signedSession.data) as OrganizerSession
  } catch (error) {
    console.error('Session parsing error:', error)
    return null
  }
}

// Clear organizer session
export async function clearOrganizerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
