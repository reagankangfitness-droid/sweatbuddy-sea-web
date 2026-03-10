import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: activityId } = await params

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

    const userActivity = await prisma.userActivity.findUnique({
      where: { userId_activityId: { userId: dbUser.id, activityId } },
    })

    if (!userActivity || userActivity.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Not joined to this session' }, { status: 400 })
    }

    await prisma.userActivity.update({
      where: { userId_activityId: { userId: dbUser.id, activityId } },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[buddy/sessions/leave] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
