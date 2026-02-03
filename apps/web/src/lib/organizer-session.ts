import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'organizer_session'

// SECURITY: Get session secret from env - fail gracefully if not configured
function getSessionSecret(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_SECRET || null
}

export interface OrganizerSession {
  id: string
  email: string
  instagramHandle: string
  name: string | null
}

// Create HMAC signature for session data
function signSession(data: string): string | null {
  const secret = getSessionSecret()
  if (!secret) return null
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
}

// Verify HMAC signature
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = signSession(data)
  // SECURITY: Fail if we can't compute signature
  if (!expectedSignature) return false
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

  // SECURITY: Don't set session if we can't sign it
  if (!signature) {
    console.error('SESSION_SECRET or ADMIN_SECRET not configured - cannot create organizer session')
    return
  }

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
      return null
    }

    // Parse and return session data
    return JSON.parse(signedSession.data) as OrganizerSession
  } catch {
    return null
  }
}

// Clear organizer session
export async function clearOrganizerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
