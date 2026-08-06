import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

// POST: Generate a magic sign-in link for a host
export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CLERK_SECRET_KEY) {
    return NextResponse.json({ error: 'Clerk not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Step 1: Find the Clerk user by email
    const checkRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(normalizedEmail)}`,
      {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const users = await checkRes.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'No Clerk account found for this email. Create the host account first.' },
        { status: 404 }
      )
    }

    const clerkUserId = users[0].id

    // Step 2: Create a sign-in token
    const tokenRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: clerkUserId,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.token) {
      return NextResponse.json(
        { error: tokenData.errors?.[0]?.message || 'Failed to create sign-in token' },
        { status: 500 }
      )
    }

    // Build the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'
    const magicLinkUrl = new URL('/auth/accept-token', baseUrl)
    magicLinkUrl.searchParams.set('token', tokenData.token)
    magicLinkUrl.searchParams.set('redirect_url', '/host/dashboard')

    return NextResponse.json({
      success: true,
      magicLink: magicLinkUrl.toString(),
      expiresIn: '30 days',
      message: 'Magic link generated. Send this to the host to let them sign in.',
    })
  } catch (error) {
    console.error('Error generating magic link:', error)
    return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 })
  }
}
