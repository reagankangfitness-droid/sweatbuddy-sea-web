import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser } from '@/lib/admin-auth'

// GET - List all activities pending approval
export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminUser(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') || 'PENDING_APPROVAL'
    const activityModeParam = searchParams.get('activityMode') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const skip = (page - 1) * limit

    const validStatuses = ['PENDING_APPROVAL', 'PUBLISHED', 'DRAFT', 'CANCELLED', 'COMPLETED'] as const
    type ActivityStatus = typeof validStatuses[number]
    const status: ActivityStatus = validStatuses.includes(statusParam as ActivityStatus)
      ? (statusParam as ActivityStatus)
      : 'PENDING_APPROVAL'

    const validModes = ['MARKETPLACE', 'P2P_FREE', 'P2P_PAID'] as const
    type ActivityMode = typeof validModes[number]
    const modeFilter = validModes.includes(activityModeParam as ActivityMode)
      ? (activityModeParam as ActivityMode)
      : null

    // Admin sees ALL activities including soft-deleted (no deletedAt filter)
    const whereClause = {
      status,
      ...(modeFilter ? { activityMode: modeFilter } : {}),
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.activity.count({
        where: whereClause,
      }),
    ])

    return NextResponse.json({
      activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching pending activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
