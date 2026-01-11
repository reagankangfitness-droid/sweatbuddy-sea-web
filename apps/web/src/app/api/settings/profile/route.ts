import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateUserProfile, publicProfileSelect } from '@/lib/profile'

async function getUserEmailFromClerk(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return user.emailAddresses[0]?.emailAddress?.toLowerCase() || null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user email from Clerk
    const email = await getUserEmailFromClerk(userId)
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Find user by email in our database
    const profile = await prisma.user.findUnique({
      where: { email },
      select: {
        ...publicProfileSelect,
        email: true,
        username: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user email from Clerk
    const email = await getUserEmailFromClerk(userId)
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Find user by email to get the database user ID
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()

    const {
      name,
      firstName,
      username,
      headline,
      bio,
      location,
      website,
      instagram,
      twitter,
      linkedin,
      tiktok,
      isPublic,
      showActivitiesAttended,
      showStats,
      specialties,
      certifications
    } = body

    try {
      // Use the database user ID, not the Clerk userId
      const updatedProfile = await updateUserProfile(user.id, {
        name,
        firstName,
        username,
        headline,
        bio,
        location,
        website,
        instagram,
        twitter,
        linkedin,
        tiktok,
        isPublic,
        showActivitiesAttended,
        showStats,
        specialties,
        certifications
      })

      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully'
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already taken') {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Profile update error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    )
  }
}
