import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * GET /api/admin/coach-verification
 * List pending coach applications
 */
export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      coachVerificationStatus: status,
    }

    const [applications, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          slug: true,
          coachType: true,
          coachBio: true,
          experienceYears: true,
          languages: true,
          hourlyRate: true,
          groupRate: true,
          coachVerificationStatus: true,
          createdAt: true,
          coachProfile: {
            select: {
              id: true,
              specializations: true,
              sportsOffered: true,
              serviceCity: true,
              createdAt: true,
            },
          },
          coachVerifications: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Admin coach verification list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coach applications' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/coach-verification
 * Approve or reject a coach application
 */
export async function PATCH(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get admin user ID for audit logging
    const { userId: adminUserId } = await auth()

    const body = await request.json()
    const { userId, action, rejectionReason } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json(
        { error: 'action must be APPROVE or REJECT' },
        { status: 400 }
      )
    }

    // Verify the user has a pending application
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { coachVerificationStatus: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.coachVerificationStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'User does not have a pending coach application' },
        { status: 400 }
      )
    }

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        // Approve user as coach
        await tx.user.update({
          where: { id: userId },
          data: {
            isCoach: true,
            coachVerificationStatus: 'VERIFIED',
            coachVerifiedAt: new Date(),
          },
        })

        // Activate coach profile
        await tx.coachProfile.update({
          where: { userId },
          data: { isActive: true },
        })

        // Approve all pending verification documents
        await tx.coachVerification.updateMany({
          where: {
            userId,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            verifiedAt: new Date(),
            verifiedByAdminId: adminUserId || undefined,
          },
        })
      })

      // Log admin action outside transaction (non-critical)
      await logAdminAction({
        action: 'APPROVE_COACH',
        targetType: 'User',
        targetId: userId,
        adminId: adminUserId || 'system',
        details: { action: 'APPROVE' },
      })

      return NextResponse.json({ message: 'Coach application approved', userId })
    } else {
      // REJECT
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'rejectionReason is required when rejecting' },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        // Reject user's coach application
        await tx.user.update({
          where: { id: userId },
          data: {
            coachVerificationStatus: 'REJECTED',
          },
        })

        // Reject all pending verification documents
        await tx.coachVerification.updateMany({
          where: {
            userId,
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            rejectionReason,
          },
        })
      })

      // Log admin action outside transaction (non-critical)
      await logAdminAction({
        action: 'REJECT_COACH',
        targetType: 'User',
        targetId: userId,
        adminId: adminUserId || 'system',
        details: { action: 'REJECT', rejectionReason },
      })

      return NextResponse.json({ message: 'Coach application rejected', userId })
    }
  } catch (error) {
    console.error('Admin coach verification action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process coach application' },
      { status: 500 }
    )
  }
}
