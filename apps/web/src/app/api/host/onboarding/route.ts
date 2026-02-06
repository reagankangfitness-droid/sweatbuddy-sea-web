import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Check onboarding status
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { email: session.email },
          { instagramHandle: session.instagramHandle || '' }
        ]
      },
      select: {
        id: true,
        hasCompletedOnboarding: true,
        communityType: true,
        communityName: true,
        communityLocation: true,
        communitySchedule: true,
        communitySize: true,
        name: true,
      }
    })

    if (!organizer) {
      return NextResponse.json({
        hasCompletedOnboarding: false,
        organizer: null
      })
    }

    return NextResponse.json({
      hasCompletedOnboarding: organizer.hasCompletedOnboarding,
      organizer
    })
  } catch (error) {
    console.error('Failed to check onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}

// POST - Save onboarding data
export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      communityType,
      communityName,
      communityLocation,
      communitySchedule,
      communitySize,
    } = body

    // Validate required fields
    if (!communityType) {
      return NextResponse.json(
        { error: 'Community type is required' },
        { status: 400 }
      )
    }

    // Find or create organizer
    let organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { email: session.email },
          { instagramHandle: session.instagramHandle || '' }
        ]
      }
    })

    if (organizer) {
      // Update existing organizer
      organizer = await prisma.organizer.update({
        where: { id: organizer.id },
        data: {
          hasCompletedOnboarding: true,
          communityType,
          communityName: communityName || null,
          communityLocation: communityLocation || null,
          communitySchedule: communitySchedule || null,
          communitySize: communitySize || null,
          onboardingCompletedAt: new Date(),
        }
      })
    } else {
      // Create new organizer with onboarding data
      organizer = await prisma.organizer.create({
        data: {
          email: session.email,
          instagramHandle: session.instagramHandle || session.email.split('@')[0],
          name: session.name || null,
          hasCompletedOnboarding: true,
          communityType,
          communityName: communityName || null,
          communityLocation: communityLocation || null,
          communitySchedule: communitySchedule || null,
          communitySize: communitySize || null,
          onboardingCompletedAt: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      organizer: {
        id: organizer.id,
        hasCompletedOnboarding: organizer.hasCompletedOnboarding,
        communityType: organizer.communityType,
        communityName: organizer.communityName,
      }
    })
  } catch (error) {
    console.error('Failed to save onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}

// PATCH - Skip onboarding (for existing users who want to skip)
export async function PATCH() {
  try {
    const session = await getHostSession()
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find or create organizer and mark onboarding as skipped
    let organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { email: session.email },
          { instagramHandle: session.instagramHandle || '' }
        ]
      }
    })

    if (organizer) {
      organizer = await prisma.organizer.update({
        where: { id: organizer.id },
        data: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
        }
      })
    } else {
      organizer = await prisma.organizer.create({
        data: {
          email: session.email,
          instagramHandle: session.instagramHandle || session.email.split('@')[0],
          name: session.name || null,
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      skipped: true
    })
  } catch (error) {
    console.error('Failed to skip onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to skip onboarding' },
      { status: 500 }
    )
  }
}
