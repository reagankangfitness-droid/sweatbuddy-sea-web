import { NextResponse } from 'next/server'
import { addToWaitlist } from '@/lib/beta'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, interestedAs, referralSource } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const result = await addToWaitlist(email, {
      name,
      interestedAs,
      referralSource,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          position: result.position,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
      position: result.position,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}
