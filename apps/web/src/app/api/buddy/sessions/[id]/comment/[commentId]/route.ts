import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: activityId, commentId } = await params

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

    const comment = await prisma.sessionComment.findUnique({
      where: { id: commentId },
      include: { activity: { select: { userId: true } } },
    })

    if (!comment || comment.activityId !== activityId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only comment author or session host can delete
    const isAuthor = comment.userId === dbUser.id
    const isHost = comment.activity.userId === dbUser.id
    if (!isAuthor && !isHost) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.sessionComment.delete({ where: { id: commentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[buddy/sessions/comment DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
