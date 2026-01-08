import { auth } from '@clerk/nextjs/server'

// Admin user IDs - these Clerk user IDs have admin access
const getAdminUserIds = () => {
  return (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',').filter(Boolean)
}

// Check if a Clerk user ID has admin access
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  const adminIds = getAdminUserIds()
  // If no admin IDs configured, allow any authenticated user (for initial setup)
  if (adminIds.length === 0) return true
  return adminIds.includes(userId)
}

// Admin secret for API routes (server-side only)
export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET || ''
}

// Check admin secret header in API routes (legacy method)
export function isValidAdminSecret(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  const secret = getAdminSecret()
  if (!secret) return false
  return authHeader === secret
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
