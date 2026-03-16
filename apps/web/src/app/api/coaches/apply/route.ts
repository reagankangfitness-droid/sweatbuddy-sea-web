import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/coaches/apply
 * User applies to become a coach
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      coachType,
      bio,
      experienceYears,
      specializations,
      sportsOffered,
      serviceCity,
      hourlyRate,
      groupRate,
      languages,
      goals,
      venues,
      freeTrialOffered,
      cancellationPolicy,
    } = body

    // Validate required fields
    if (!coachType || !bio || experienceYears === undefined || !serviceCity) {
      return NextResponse.json(
        { error: 'coachType, bio, experienceYears, and serviceCity are required' },
        { status: 400 }
      )
    }

    if (!specializations?.length || !sportsOffered?.length) {
      return NextResponse.json(
        { error: 'At least one specialization and one sport are required' },
        { status: 400 }
      )
    }

    // Check if user is already a coach or has a pending application
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        isCoach: true,
        coachVerificationStatus: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (existingUser.isCoach) {
      return NextResponse.json(
        { error: 'You are already a verified coach' },
        { status: 400 }
      )
    }

    if (existingUser.coachVerificationStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'You already have a pending coach application' },
        { status: 400 }
      )
    }

    // Create CoachProfile and update User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const venuesList = Array.isArray(venues)
        ? venues
        : typeof venues === 'string'
          ? venues.split(',').map((v: string) => v.trim()).filter(Boolean)
          : []

      const coachProfile = await tx.coachProfile.create({
        data: {
          userId,
          displayName: body.displayName || existingUser.name || 'Coach',
          bio: bio || null,
          specializations: specializations || [],
          sportsOffered: sportsOffered || [],
          goalsServed: goals || [],
          serviceCity,
          trainingVenues: venuesList,
          sessionPrice: groupRate ? Math.round(parseFloat(String(groupRate)) * 100) : null,
          groupPrice: groupRate ? Math.round(parseFloat(String(groupRate)) * 100) : null,
          offersTrial: !!freeTrialOffered,
          trialPrice: freeTrialOffered ? 0 : null,
          cancellationPolicy: cancellationPolicy || null,
          cancellationHours: cancellationPolicy === '12h' ? 12 : cancellationPolicy === 'none' ? 0 : 24,
          isActive: false,
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          isCoach: false, // Not yet verified
          coachVerificationStatus: 'PENDING',
          coachType,
          coachBio: bio,
          experienceYears: parseInt(String(experienceYears), 10),
          languages: languages || [],
          hourlyRate: hourlyRate ? parseFloat(String(hourlyRate)) : null,
          groupRate: groupRate ? parseFloat(String(groupRate)) : null,
        },
      })

      return coachProfile
    })

    return NextResponse.json(
      { message: 'Coach application submitted successfully', coachProfile: result },
      { status: 201 }
    )
  } catch (error) {
    console.error('Coach application error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit coach application' },
      { status: 500 }
    )
  }
}
