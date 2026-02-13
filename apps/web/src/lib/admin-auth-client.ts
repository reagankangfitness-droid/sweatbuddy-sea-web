// Client-side admin authentication utilities
// This file should only be imported in client components

// Admin user IDs - these Clerk user IDs have admin access
const getAdminUserIds = () => {
  return (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean)
}

// Check if a Clerk user ID has admin access (client-side)
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  const adminIds = getAdminUserIds()
  // SECURITY: Require explicit admin IDs - no fallback access
  if (adminIds.length === 0) {
    return false
  }
  return adminIds.includes(userId)
}
