import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { joinWaitlist, getSpotsInfo } from '@/lib/waitlist'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { activityId, email, name } = body

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Check if activity is actually full
    const spotsInfo = await getSpotsInfo(activityId)
    if (!spotsInfo) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (spotsInfo.spotsRemaining > 0) {
      return NextResponse.json(
        {
          error: 'Spots are still available - book now!',
          spotsRemaining: spotsInfo.spotsRemaining,
        },
        { status: 400 }
      )
    }

    // Get user session if logged in
    const { userId } = await auth()
    let userEmail = email
    let userName = name

    // If logged in, get user details from Clerk
    if (userId) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      userEmail = userEmail || clerkUser.emailAddresses[0]?.emailAddress
      userName = userName || clerkUser.fullName || clerkUser.firstName

      // Ensure user exists in database
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || null,
          imageUrl: clerkUser.imageUrl || null,
        },
        update: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || null,
          imageUrl: clerkUser.imageUrl || null,
        },
      })
    }

    // Require email if not logged in
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: 'Email is required to join waitlist' },
        { status: 400 }
      )
    }

    const result = await joinWaitlist(activityId, {
      userId: userId || undefined,
      email: userEmail,
      name: userName,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, position: result.position },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      position: result.position,
      message: result.message,
    })
  } catch (error) {
    console.error('Waitlist join error:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}
