import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { reportedType, reportedId, reason } = body

    if (!reportedType || !['USER', 'ACTIVITY'].includes(reportedType)) {
      return NextResponse.json({ error: 'Invalid reportedType' }, { status: 400 })
    }
    if (!reportedId) {
      return NextResponse.json({ error: 'reportedId is required' }, { status: 400 })
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Can't report yourself
    if (reportedType === 'USER' && reportedId === dbUser.id) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    const report = await prisma.p2PReport.create({
      data: {
        reporterId: dbUser.id,
        reportedType,
        reportedId,
        activityId: reportedType === 'ACTIVITY' ? reportedId : null,
        reason: reason.trim(),
        status: 'PENDING',
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('[buddy/report] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
