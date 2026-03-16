import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/coaches/[id]
 * Get a coach's full public profile
 * Params: id = userId or slug
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find user by ID first, then by slug
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
        isCoach: true,
        coachVerificationStatus: 'VERIFIED',
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        slug: true,
        coachType: true,
        coachBio: true,
        experienceYears: true,
        languages: true,
        hourlyRate: true,
        groupRate: true,
        coachVerifiedAt: true,
        coachProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Get approved certifications
    const certifications = await prisma.coachVerification.findMany({
      where: {
        userId: user.id,
        status: 'APPROVED',
        type: 'CERTIFICATION',
      },
      select: {
        id: true,
        certificationName: true,
        issuingBody: true,
        expiresAt: true,
        verifiedAt: true,
      },
      orderBy: { verifiedAt: 'desc' },
    })

    // Get recent reviews for this coach's activities
    const reviews = await prisma.review.findMany({
      where: {
        activity: {
          hostId: user.id,
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        reviewer: {
          select: {
            name: true,
            imageUrl: true,
            slug: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Get upcoming sessions (published activities hosted by this coach)
    const upcomingSessions = await prisma.activity.findMany({
      where: {
        hostId: user.id,
        status: 'PUBLISHED',
        startTime: {
          gt: new Date(),
        },
      },
      take: 10,
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        city: true,
        address: true,
        price: true,
        maxPeople: true,
        _count: {
          select: {
            userActivities: true,
          },
        },
      },
    })

    return NextResponse.json({
      coach: {
        id: user.id,
        name: user.name,
        imageUrl: user.imageUrl,
        slug: user.slug,
        coachType: user.coachType,
        bio: user.coachBio,
        experienceYears: user.experienceYears,
        languages: user.languages,
        hourlyRate: user.hourlyRate,
        groupRate: user.groupRate,
        verifiedAt: user.coachVerifiedAt,
        profile: user.coachProfile,
      },
      certifications,
      reviews,
      upcomingSessions,
    })
  } catch (error) {
    console.error('Coach profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach profile' },
      { status: 500 }
    )
  }
}
