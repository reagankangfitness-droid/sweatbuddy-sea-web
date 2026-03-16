import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/coaches/verification
 * Coach uploads a verification document
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check that user has a pending or verified coach status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coachVerificationStatus: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.coachVerificationStatus !== 'PENDING' && user.coachVerificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'You must have a pending or verified coach application to upload documents' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      type,
      documentUrl,
      documentName,
      issuingBody,
      certificationName,
      expiresAt,
    } = body

    // Validate required fields
    const validTypes = ['IDENTITY', 'CERTIFICATION', 'INSURANCE', 'BACKGROUND_CHECK']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!documentUrl) {
      return NextResponse.json(
        { error: 'documentUrl is required' },
        { status: 400 }
      )
    }

    const verification = await prisma.coachVerification.create({
      data: {
        userId,
        type,
        status: 'PENDING',
        documentUrl,
        documentName: documentName || null,
        issuingBody: issuingBody || null,
        certificationName: certificationName || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(verification, { status: 201 })
  } catch (error) {
    console.error('Coach verification upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload verification document' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/coaches/verification
 * Get coach's verification documents
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verifications = await prisma.coachVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ verifications })
  } catch (error) {
    console.error('Coach verification fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch verification documents' },
      { status: 500 }
    )
  }
}
