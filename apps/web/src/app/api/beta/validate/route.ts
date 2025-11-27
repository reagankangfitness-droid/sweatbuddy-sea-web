import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateInviteCode, consumeInviteCode } from '@/lib/beta'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Validate the code first
    const validation = await validateInviteCode(code)

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Get request metadata
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Use the code (increment usage, log access)
    const result = await consumeInviteCode(code, {
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Set beta access cookie (30 days)
    const cookieStore = await cookies()
    cookieStore.set('sb_beta_access', code.toUpperCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Welcome to the SweatBuddies beta!',
      spotsRemaining: result.spotsRemaining,
    })
  } catch (error) {
    console.error('Beta validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate code' },
      { status: 500 }
    )
  }
}
