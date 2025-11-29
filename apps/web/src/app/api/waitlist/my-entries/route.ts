import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserWaitlistEntries } from '@/lib/waitlist'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const entries = await getUserWaitlistEntries(userId)

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Get waitlist entries error:', error)
    return NextResponse.json(
      { error: 'Failed to get waitlist entries' },
      { status: 500 }
    )
  }
}
