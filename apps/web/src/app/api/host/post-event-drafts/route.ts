import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { getPendingDrafts } from '@/lib/post-event-draft'

export const dynamic = 'force-dynamic'

/**
 * GET /api/host/post-event-drafts
 * Returns all pending post-event thank-you email drafts for the authenticated host.
 */
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const drafts = await getPendingDrafts(session)

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Failed to fetch post-event drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    )
  }
}
