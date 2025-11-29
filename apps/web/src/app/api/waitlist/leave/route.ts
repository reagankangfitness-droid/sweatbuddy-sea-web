import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { leaveWaitlist } from '@/lib/waitlist'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { activityId, email } = body

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const { userId } = await auth()

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const result = await leaveWaitlist(activityId, userId || undefined, email)

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Removed from waitlist' : 'Not found on waitlist',
    })
  } catch (error) {
    console.error('Waitlist leave error:', error)
    return NextResponse.json(
      { error: 'Failed to leave waitlist' },
      { status: 500 }
    )
  }
}
