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
// SECURITY: Requires ADMIN_SECRET env var - no hardcoded fallback
export function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('[SECURITY] ADMIN_SECRET env var not set. Admin API access disabled.')
    return '' // Return empty string - will never match
  }
  return secret
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  // Pad shorter string to match length (constant time regardless of input)
  const maxLen = Math.max(a.length, b.length)
  const paddedA = a.padEnd(maxLen, '\0')
  const paddedB = b.padEnd(maxLen, '\0')

  // Always compare same-length buffers
  const bufA = Buffer.from(paddedA)
  const bufB = Buffer.from(paddedB)

  // timingSafeEqual requires same-length buffers
  const isEqual = crypto.timingSafeEqual(bufA, bufB)

  // Also check original lengths match (after constant-time comparison)
  return isEqual && a.length === b.length
}

// Check admin secret header in API routes
export function isValidAdminSecret(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  if (!authHeader) return false

  // SECURITY: Only check against env secret using timing-safe comparison
  const adminSecret = getAdminSecret()
  if (!adminSecret) {
    return false // No secret configured
  }

  return timingSafeEqual(authHeader, adminSecret)
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
