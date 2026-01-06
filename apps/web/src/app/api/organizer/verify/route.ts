import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Find the magic link
    const magicLink = await prisma.organizerMagicLink.findUnique({
      where: { token },
    })

    if (!magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > magicLink.expiresAt) {
      return NextResponse.json(
        { error: 'This link has expired. Please request a new one.' },
        { status: 410 }
      )
    }

    // Find the organizer
    const organizer = await prisma.organizer.findUnique({
      where: { email: magicLink.email },
    })

    if (!organizer) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      )
    }

    // Mark token as used (but don't delete it - allow reuse within expiry)
    await prisma.organizerMagicLink.update({
      where: { token },
      data: { usedAt: new Date() },
    })

    // Set organizer session cookie
    const cookieStore = await cookies()
    cookieStore.set('organizer_session', JSON.stringify({
      id: organizer.id,
      email: organizer.email,
      instagramHandle: organizer.instagramHandle,
      name: organizer.name,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      organizer: {
        id: organizer.id,
        email: organizer.email,
        instagramHandle: organizer.instagramHandle,
        name: organizer.name,
        isVerified: organizer.isVerified,
      },
    })
  } catch (error) {
    console.error('Organizer verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify link' },
      { status: 500 }
    )
  }
}

// Also allow getting current session - supports both Clerk and legacy auth
export async function POST() {
  try {
    // First try Clerk auth (primary)
    const { userId } = await auth()

    if (userId) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) {
        return NextResponse.json(
          { error: 'No email found' },
          { status: 401 }
        )
      }

      // Look up user in our database by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          instagram: true,
          name: true,
          isHost: true,
        },
      })

      if (user && user.instagram) {
        return NextResponse.json({
          success: true,
          organizer: {
            id: user.id,
            email: user.email,
            instagramHandle: user.instagram,
            name: user.name,
            isVerified: true,
          },
          source: 'clerk',
        })
      }

      // Check Organizer table for legacy hosts
      const organizer = await prisma.organizer.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      })

      if (organizer) {
        return NextResponse.json({
          success: true,
          organizer: {
            id: organizer.id,
            email: organizer.email,
            instagramHandle: organizer.instagramHandle,
            name: organizer.name,
            isVerified: organizer.isVerified,
          },
          source: 'clerk',
        })
      }

      // User is signed in but not a host
      return NextResponse.json(
        { error: 'Not a host' },
        { status: 403 }
      )
    }

    // Fall back to legacy cookie-based session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)

    // Verify organizer still exists
    const organizer = await prisma.organizer.findUnique({
      where: { id: session.id },
    })

    if (!organizer) {
      // Clear invalid session
      cookieStore.delete('organizer_session')
      return NextResponse.json(
        { error: 'Session invalid' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      organizer: {
        id: organizer.id,
        email: organizer.email,
        instagramHandle: organizer.instagramHandle,
        name: organizer.name,
        isVerified: organizer.isVerified,
      },
      source: 'legacy',
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    )
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('organizer_session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
