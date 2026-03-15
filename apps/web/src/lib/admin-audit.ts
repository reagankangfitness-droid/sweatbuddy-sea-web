import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export async function logAdminAction({
  action,
  targetType,
  targetId,
  adminId,
  details,
}: {
  action: string
  targetType: string
  targetId: string
  adminId: string
  details?: Prisma.InputJsonValue
}) {
  try {
    await prisma.adminAuditLog.create({
      data: { action, targetType, targetId, adminId, details },
    })
  } catch (error) {
    // Don't fail the admin action if logging fails
    console.error('Failed to log admin action:', error)
  }
}
