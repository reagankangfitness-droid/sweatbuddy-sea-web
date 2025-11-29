import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getActivityWaitlist } from '@/lib/waitlist'

export async function GET(
  request: Request,
  { params }: { params: { activityId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const result = await getActivityWaitlist(params.activityId, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get activity waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist' },
      { status: 500 }
    )
  }
}
