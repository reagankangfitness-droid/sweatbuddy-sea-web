import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// List of admin user IDs (Clerk user IDs)
const ADMIN_USER_IDS = [
  'user_35uErdZUOkuGuTgxKGNVHRXlFRF', // Reagan
]

// Check if user is an admin
function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId)
}

// GET - List all activities pending approval
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    console.log('Admin activities request - userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    console.log('Checking admin status for:', userId, 'Admin list:', ADMIN_USER_IDS)

    if (!isAdmin(userId)) {
      return NextResponse.json({
        error: 'Forbidden - Admin access required',
        yourUserId: userId,
        message: 'Your user ID is not in the admin list'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING_APPROVAL'

    console.log('Fetching activities with status:', status)

    const activities = await prisma.activity.findMany({
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
    })

    console.log('Found activities:', activities.length)
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching pending activities:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}
