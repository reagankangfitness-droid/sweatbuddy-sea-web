// Client-side admin authentication utilities
// This file should only be imported in client components

// Admin user IDs - these Clerk user IDs have admin access
const getAdminUserIds = () => {
  return (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',').filter(Boolean)
}

// Check if a Clerk user ID has admin access (client-side)
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  const adminIds = getAdminUserIds()
  // If no admin IDs configured, allow any authenticated user (for initial setup)
  if (adminIds.length === 0) return true
  return adminIds.includes(userId)
}
