import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/current-user'

type RouteContext = {
  params: Promise<{ slug: string }>
}

const MAX_VERIFICATION_ATTEMPTS = 5
const FETCH_TIMEOUT_MS = 8000
const MAX_VERIFICATION_TEXT = 750_000

export async function POST(_request: Request, context: RouteContext) {
  const dbUser = await getCurrentDbUser()
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug } = await context.params
    const claim = await prisma.communityClaim.findFirst({
      where: {
        userId: dbUser.id,
        status: 'PENDING',
        community: { slug },
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            claimedAt: true,
            claimedById: true,
            cityId: true,
            isActive: true,
            moderationStatus: true,
          },
        },
        challenges: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!claim) {
      return NextResponse.json({ error: 'No pending claim found for this community' }, { status: 404 })
    }

    if (claim.community.claimedAt && claim.community.claimedById !== dbUser.id) {
      return NextResponse.json({ error: 'This community has already been claimed' }, { status: 409 })
    }

    const challenge = claim.challenges[0]
    if (!challenge) {
      return NextResponse.json({ error: 'No active verification challenge found' }, { status: 404 })
    }

    if (challenge.expiresAt <= new Date()) {
      await prisma.verificationChallenge.update({
        where: { id: challenge.id },
        data: {
          status: 'EXPIRED',
          lastCheckedAt: new Date(),
          lastError: 'Verification code expired',
        },
      })
      return NextResponse.json({ error: 'Verification code expired. Start a new claim.' }, { status: 400 })
    }

    const page = await fetchVerificationPage(challenge.targetUrl)
    const foundCode = page.toLowerCase().includes(challenge.code.toLowerCase())

    if (!foundCode) {
      const attempts = challenge.attempts + 1
      await prisma.verificationChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts,
          status: attempts >= MAX_VERIFICATION_ATTEMPTS ? 'FAILED' : 'PENDING',
          lastCheckedAt: new Date(),
          lastError: `Code ${challenge.code} was not found on the public page`,
        },
      })
      return NextResponse.json(
        {
          verified: false,
          attemptsRemaining: Math.max(0, MAX_VERIFICATION_ATTEMPTS - attempts),
          error: `We could not find ${challenge.code} on the public page yet.`,
        },
        { status: 202 },
      )
    }

    const wasPublic = claim.community.isActive && claim.community.moderationStatus === 'LIVE'
    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      await tx.verificationChallenge.update({
        where: { id: challenge.id },
        data: {
          status: 'VERIFIED',
          attempts: { increment: 1 },
          lastCheckedAt: now,
          verifiedAt: now,
          lastError: null,
        },
      })

      const updatedClaim = await tx.communityClaim.update({
        where: { id: claim.id },
        data: {
          status: 'APPROVED',
          verifiedAt: now,
          reviewedAt: now,
          reviewedBy: 'verification_challenge',
          rejectionReason: null,
        },
      })

      const community = await tx.community.update({
        where: { id: claim.community.id },
        data: {
          claimedAt: now,
          claimedById: dbUser.id,
          createdById: dbUser.id,
          isActive: true,
          moderationStatus: 'LIVE',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          lastVerifiedAt: now,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          cityId: true,
          isActive: true,
          moderationStatus: true,
        },
      })

      const member = await tx.communityMember.upsert({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: dbUser.id,
          },
        },
        update: {
          role: 'OWNER',
          managerTrustLevel: 'VERIFIED_MANAGER',
          managerVerifiedAt: now,
          managerRestrictedAt: null,
          managerRestrictionReason: null,
        },
        create: {
          communityId: community.id,
          userId: dbUser.id,
          role: 'OWNER',
          managerTrustLevel: 'VERIFIED_MANAGER',
          managerVerifiedAt: now,
        },
      })

      if (!wasPublic && community.cityId) {
        await tx.city.update({
          where: { id: community.cityId },
          data: { communityCount: { increment: 1 } },
        })
      }

      return { claim: updatedClaim, community, member }
    })

    return NextResponse.json({ success: true, verified: true, ...result })
  } catch (error) {
    console.error('[community claim verify]', error)
    return NextResponse.json({ error: 'Failed to verify community claim' }, { status: 500 })
  }
}

async function fetchVerificationPage(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'SweatBuddiesVerification/1.0',
        accept: 'text/html,text/plain,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Verification URL returned ${response.status}`)
    }

    const text = await response.text()
    return text.slice(0, MAX_VERIFICATION_TEXT)
  } finally {
    clearTimeout(timeout)
  }
}
