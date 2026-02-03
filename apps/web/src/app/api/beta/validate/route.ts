import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Single beta passcode for testers
const BETA_PASSCODE = 'SWEAT2025'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Passcode is required' },
        { status: 400 }
      )
    }

    // Check if passcode matches (case-insensitive)
    if (code.toUpperCase() !== BETA_PASSCODE) {
      return NextResponse.json(
        { success: false, error: 'Invalid passcode' },
        { status: 400 }
      )
    }

    // Set beta access cookie (30 days)
    const cookieStore = await cookies()
    cookieStore.set('sb_beta_access', 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Welcome to SweatBuddies!',
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to validate passcode' },
      { status: 500 }
    )
  }
}
