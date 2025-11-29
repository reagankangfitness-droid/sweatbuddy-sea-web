import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSpotsInfo, getUserWaitlistStatus } from '@/lib/waitlist'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const spotsInfo = await getSpotsInfo(activityId)

    if (!spotsInfo) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if current user is on waitlist
    const { userId } = await auth()
    let userWaitlistStatus = null

    if (userId) {
      userWaitlistStatus = await getUserWaitlistStatus(activityId, userId)
    }

    return NextResponse.json({
      ...spotsInfo,
      userWaitlistStatus,
    })
  } catch (error) {
    console.error('Waitlist status error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
