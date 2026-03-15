import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('../prisma', () => ({
  prisma: {
    adminAuditLog: {
      create: vi.fn(),
    },
  },
}))

import { logAdminAction } from '../admin-audit'
import { prisma } from '../prisma'

describe('logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an audit log entry', async () => {
    await logAdminAction({
      action: 'BAN_USER',
      targetType: 'User',
      targetId: 'user-123',
      adminId: 'admin-456',
    })

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'BAN_USER',
        targetType: 'User',
        targetId: 'user-123',
        adminId: 'admin-456',
        details: undefined,
      },
    })
  })

  it('includes details when provided', async () => {
    await logAdminAction({
      action: 'BAN_USER',
      targetType: 'User',
      targetId: 'user-123',
      adminId: 'admin-456',
      details: { reason: 'spam' },
    })

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ details: { reason: 'spam' } }),
    })
  })

  it('does not throw when prisma fails', async () => {
    vi.mocked(prisma.adminAuditLog.create).mockRejectedValue(new Error('DB error'))

    await expect(
      logAdminAction({
        action: 'BAN_USER',
        targetType: 'User',
        targetId: 'user-123',
        adminId: 'admin-456',
      }),
    ).resolves.not.toThrow()
  })
})
