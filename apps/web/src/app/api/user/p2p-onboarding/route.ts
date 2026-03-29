import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const body = await request.json()
    const { bio, fitnessInterests, fitnessLevel } = body

    // Validate — only interests are required, bio and fitness level are optional
    if (bio && typeof bio === 'string' && bio.trim().length > 200) {
      return NextResponse.json({ error: 'Bio must be 200 characters or less' }, { status: 400 })
    }
    if (!Array.isArray(fitnessInterests) || fitnessInterests.length === 0) {
      return NextResponse.json({ error: 'At least one fitness interest is required' }, { status: 400 })
    }
    if (fitnessInterests.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 fitness interests allowed' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      fitnessInterests,
      p2pOnboardingCompleted: true,
    }
    if (bio && typeof bio === 'string' && bio.trim().length > 0) {
      updateData.bio = bio.trim()
    }
    if (fitnessLevel && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL'].includes(fitnessLevel)) {
      updateData.fitnessLevel = fitnessLevel === 'ALL' ? null : fitnessLevel
    }

    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: updateData,
      select: {
        id: true,
        slug: true,
        bio: true,
        fitnessInterests: true,
        fitnessLevel: true,
        p2pOnboardingCompleted: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('[p2p-onboarding] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ completed: false, user: null })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        p2pOnboardingCompleted: true,
        bio: true,
        fitnessInterests: true,
        fitnessLevel: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({
      completed: user?.p2pOnboardingCompleted ?? false,
      user: user ?? null,
    })
  } catch (error) {
    console.error('[p2p-onboarding] GET Error:', error)
    return NextResponse.json({ completed: false, user: null })
  }
}
