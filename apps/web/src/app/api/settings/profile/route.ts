import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateUserProfile, publicProfileSelect } from '@/lib/profile'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: userId },
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
      const updatedProfile = await updateUserProfile(userId, {
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
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
