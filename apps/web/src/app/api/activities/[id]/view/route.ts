import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { trackActivityView } from '@/lib/stats/realtime'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const activityId = params.id

    // Get user if logged in (optional)
    let userId: string | null = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch {
      // User not logged in, that's OK for view tracking
    }

    // Get view metadata from request body
    let source: string | null = null
    let deviceType: string | null = null

    try {
      const body = await request.json()
      source = body.source || null
      deviceType = body.deviceType || null
    } catch {
      // No body provided, that's OK
    }

    // Track the view
    await trackActivityView(activityId, userId, source, deviceType)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking activity view:', error)
    // Don't fail the request for view tracking issues
    return NextResponse.json({ success: false })
  }
}
