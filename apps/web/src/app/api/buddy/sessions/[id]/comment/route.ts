import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: activityId } = await params

    const comments = await prisma.sessionComment.findMany({
      where: { activityId },
      include: {
        user: { select: { id: true, name: true, imageUrl: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('[buddy/sessions/comment GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }
    if (content.trim().length > 500) {
      return NextResponse.json({ error: 'Comment must be 500 characters or less' }, { status: 400 })
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, activityMode: true },
    })
    if (!activity || !['P2P_FREE', 'P2P_PAID'].includes(activity.activityMode)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const comment = await prisma.sessionComment.create({
      data: { activityId, userId: dbUser.id, content: content.trim() },
      include: {
        user: { select: { id: true, name: true, imageUrl: true, slug: true } },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('[buddy/sessions/comment POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
