import { NextRequest, NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { sendPostEventDraft } from '@/lib/post-event-draft'

export const dynamic = 'force-dynamic'

/**
 * POST /api/host/post-event-drafts/[draftId]/send
 * Send the post-event thank-you email to all attendees.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await params
    const result = await sendPostEventDraft(draftId, session)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 403 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
    })
  } catch (error) {
    console.error('Failed to send post-event draft:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
