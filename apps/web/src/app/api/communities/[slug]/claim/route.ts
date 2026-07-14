import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/current-user'

type RouteContext = {
  params: Promise<{ slug: string }>
}

type ClaimPayload = {
  verificationUrl?: unknown
  sourceUrl?: unknown
  notes?: unknown
}

const CLAIM_CODE_BYTES = 3
const CLAIM_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(request: Request, context: RouteContext) {
  const dbUser = await getCurrentDbUser()
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug } = await context.params
    const payload = await request.json().catch(() => ({})) as ClaimPayload
    const verificationUrl = normalizeUrl(payload.verificationUrl)
    const sourceUrl = normalizeUrl(payload.sourceUrl)
    const notes = normalizeText(payload.notes, 1000)

    if (!verificationUrl) {
      return NextResponse.json(
        { error: 'Add the public page where you will place your verification code' },
        { status: 400 },
      )
    }

    const community = await prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        claimedAt: true,
        claimedById: true,
        sourceUrl: true,
        websiteUrl: true,
        communityLink: true,
      },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    if (community.claimedAt && community.claimedById !== dbUser.id) {
      return NextResponse.json({ error: 'This community has already been claimed' }, { status: 409 })
    }

    const existingApprovedClaim = await prisma.communityClaim.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: dbUser.id,
        },
      },
      select: { id: true, status: true, verificationCode: true, verificationUrl: true },
    })

    if (existingApprovedClaim?.status === 'APPROVED') {
      return NextResponse.json({
        success: true,
        verified: true,
        claim: existingApprovedClaim,
      })
    }

    const verificationCode = generateClaimCode()
    const expiresAt = new Date(Date.now() + CLAIM_EXPIRES_MS)
    const resolvedSourceUrl = sourceUrl ?? community.sourceUrl ?? community.websiteUrl ?? community.communityLink

    const claim = await prisma.$transaction(async (tx) => {
      const nextClaim = await tx.communityClaim.upsert({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: dbUser.id,
          },
        },
        update: {
          status: 'PENDING',
          sourceUrl: resolvedSourceUrl,
          verificationUrl,
          verificationCode,
          verifiedAt: null,
          reviewedAt: null,
          reviewedBy: null,
          rejectionReason: null,
          notes,
        },
        create: {
          communityId: community.id,
          userId: dbUser.id,
          status: 'PENDING',
          sourceUrl: resolvedSourceUrl,
          verificationUrl,
          verificationCode,
          notes,
        },
        select: {
          id: true,
          status: true,
          verificationCode: true,
          verificationUrl: true,
        },
      })

      await tx.verificationChallenge.create({
        data: {
          claimId: nextClaim.id,
          code: verificationCode,
          targetUrl: verificationUrl,
          expiresAt,
        },
      })

      return nextClaim
    })

    return NextResponse.json({
      success: true,
      claim: {
        ...claim,
        expiresAt,
      },
      instructions: `Add ${verificationCode} to the public page, bio, or link-in-bio at ${verificationUrl}, then verify the claim.`,
    }, { status: 201 })
  } catch (error) {
    console.error('[community claim start]', error)
    return NextResponse.json({ error: 'Failed to start community claim' }, { status: 500 })
  }
}

function generateClaimCode() {
  return `SB-${randomBytes(CLAIM_CODE_BYTES).toString('hex').toUpperCase()}`
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function normalizeUrl(value: unknown): string | null {
  const text = normalizeText(value, 500)
  if (!text) return null

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString().slice(0, 500)
  } catch {
    return null
  }
}
