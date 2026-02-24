import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/host/post-event-drafts/[draftId]
 * Update subject and body of a draft. Host must own the draft.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await params

    // Load draft and verify ownership
    const draft = await prisma.postEventDraft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const isOwner =
      draft.hostInstagram.toLowerCase() === session.instagramHandle.toLowerCase() ||
      (draft.hostUserId && draft.hostUserId === session.userId)

    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (draft.status === 'SENT') {
      return NextResponse.json({ error: 'Cannot edit a sent draft' }, { status: 400 })
    }

    const { subject, body } = await request.json()

    const updated = await prisma.postEventDraft.update({
      where: { id: draftId },
      data: {
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
      },
      select: {
        id: true,
        subject: true,
        body: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error('Failed to update post-event draft:', error)
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    )
  }
}
