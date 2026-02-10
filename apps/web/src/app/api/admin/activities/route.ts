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
    const status = searchParams.get('status') || 'PENDING_APPROVAL'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const skip = (page - 1) * limit

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: {
          status: status as 'PENDING_APPROVAL' | 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | 'COMPLETED',
          deletedAt: null,
        },
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
        where: {
          status: status as 'PENDING_APPROVAL' | 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | 'COMPLETED',
          deletedAt: null,
        },
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
