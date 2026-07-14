import crypto from 'crypto'
import { auth } from '@clerk/nextjs/server'

// Admin user IDs - these Clerk user IDs have admin access
const getAdminUserIds = () => {
  return (process.env.ADMIN_USER_IDS || process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

// Check if a Clerk user ID has admin access
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  const adminIds = getAdminUserIds()
  // SECURITY: Require explicit admin IDs - no fallback access
  if (adminIds.length === 0) {
    return false
  }
  return adminIds.includes(userId)
}

// Admin secret for API routes (server-side only)
// SECURITY: Requires ADMIN_SECRET env var - no hardcoded fallback
export function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return '' // Return empty string - will never match
  }
  return secret
}

// Timing-safe string comparison — hash both values first to avoid length leaks
function timingSafeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest()
  const hashB = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
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

// Check if the request is authenticated as admin.
// Browser admin access is Clerk-only. x-admin-secret is kept for server-to-server jobs.
// This is for API routes only (server-side)
export async function isAdminRequest(request: Request): Promise<boolean> {
  // First, always try Clerk session auth (works via cookies sent with browser requests)
  try {
    const { userId } = await auth()
    if (userId && isAdminUser(userId)) {
      return true
    }
  } catch {
    // Clerk auth failed, try other methods
  }

  // Fall back to server-to-server admin secret check
  return isValidAdminSecret(request)
}

export async function getAdminActorId(request: Request): Promise<string | null> {
  try {
    const { userId } = await auth()
    if (userId && isAdminUser(userId)) return userId
  } catch {
    // Clerk auth failed, try server-to-server secret below.
  }

  return isValidAdminSecret(request) ? 'admin_secret' : null
}
