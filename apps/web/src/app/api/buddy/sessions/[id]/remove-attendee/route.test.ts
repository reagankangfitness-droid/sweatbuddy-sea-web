import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notifications/service'
import { POST } from './route'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    activity: {
      findUnique: vi.fn(),
    },
    userActivity: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/notifications/service', () => ({
  notify: vi.fn(),
}))

const params = { params: Promise.resolve({ id: 'activity-1' }) }

function makeRequest(body: Record<string, unknown>) {
  return new Request('https://www.sweatbuddies.co/api/buddy/sessions/activity-1/remove-attendee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/buddy/sessions/[id]/remove-attendee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-host' } as Awaited<ReturnType<typeof auth>>)
    vi.mocked(currentUser).mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'host@sweatbuddies.co' },
    } as Awaited<ReturnType<typeof currentUser>>)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'host-1' })
    vi.mocked(prisma.activity.findUnique).mockResolvedValue({
      id: 'activity-1',
      title: 'Morning Run Club',
      userId: 'host-1',
      startTime: new Date('2026-05-20T23:00:00.000Z'),
      address: 'Marina Bay',
      city: 'Singapore',
    })
    vi.mocked(prisma.userActivity.findUnique).mockResolvedValue({
      id: 'user-activity-1',
      status: 'JOINED',
    })
    vi.mocked(prisma.userActivity.update).mockResolvedValue({
      id: 'user-activity-1',
      status: 'CANCELLED',
    })
    vi.mocked(notify).mockResolvedValue(undefined)
  })

  it('cancels the attendee and notifies them', async () => {
    const response = await POST(
      makeRequest({ attendeeUserId: 'attendee-1', reason: 'Capacity changed' }),
      params,
    )

    expect(response.status).toBe(200)
    expect(prisma.userActivity.update).toHaveBeenCalledWith({
      where: { userId_activityId: { userId: 'attendee-1', activityId: 'activity-1' } },
      data: { status: 'CANCELLED' },
    })
    expect(notify).toHaveBeenCalledWith({
      userId: 'attendee-1',
      type: 'ACTIVITY_UPDATE',
      title: "You've been removed from Morning Run Club",
      body: expect.stringContaining('Reason from host: Capacity changed'),
      linkUrl: '/activities/activity-1',
      metadata: {
        activityId: 'activity-1',
        userActivityId: 'user-activity-1',
        removedByUserId: 'host-1',
        reason: 'Capacity changed',
      },
    })
  })

  it('does not fail the removal if notification delivery fails', async () => {
    vi.mocked(notify).mockRejectedValue(new Error('notification failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(makeRequest({ attendeeUserId: 'attendee-1' }), params)

    expect(response.status).toBe(200)
    expect(prisma.userActivity.update).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[buddy/sessions/remove-attendee] Notification failed:',
      expect.any(Error),
    )

    consoleSpy.mockRestore()
  })
})
