import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

// Admin user IDs - these Clerk user IDs have admin access
const getAdminUserIds = () => {
  return (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',').filter(Boolean)
}

// Check if a Clerk user ID has admin access
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  const adminIds = getAdminUserIds()
  // SECURITY: Require explicit admin IDs - no fallback access
  if (adminIds.length === 0) {
    console.warn('[SECURITY] No admin user IDs configured. Set NEXT_PUBLIC_ADMIN_USER_IDS.')
    return false
  }
  return adminIds.includes(userId)
}

// Admin secret for API routes (server-side only)
export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET || ''
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to maintain constant time
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a))
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

// Check admin secret header in API routes (legacy method)
export function isValidAdminSecret(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  const secret = getAdminSecret()
  if (!secret || !authHeader) return false
  return timingSafeEqual(authHeader, secret)
}

// Check if the request is authenticated as admin (supports both Clerk and legacy secret)
// This is for API routes only (server-side)
export async function isAdminRequest(request: Request): Promise<boolean> {
  // First check for Clerk Bearer token
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { userId } = await auth()
      if (userId && isAdminUser(userId)) {
        return true
      }
    } catch {
      // Clerk auth failed, try legacy method
    }
  }

  // Fall back to legacy admin secret check
  return isValidAdminSecret(request)
}
