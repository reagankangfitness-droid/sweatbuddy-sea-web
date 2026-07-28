import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'
import { scoreSessionListing } from '@/lib/listing-moderation'
import { isTrustedCommunityManager } from '@/lib/host-session-rules'
import { isRecoverableDiscoveryDbError } from '@/lib/recoverable-db-error'

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

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        p2pOnboardingCompleted: true,
        p2pStripeConnectId: true,
        isCoach: true,
        coachVerificationStatus: true,
        hostTier: true,
        sessionsHostedCount: true,
        accountStatus: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (dbUser.accountStatus === 'BANNED' || dbUser.accountStatus === 'SUSPENDED') {
      return NextResponse.json({ error: 'Account cannot create sessions', code: 'ACCOUNT_RESTRICTED' }, { status: 403 })
    }

    if (!dbUser.p2pOnboardingCompleted) {
      return NextResponse.json({ error: 'Complete P2P onboarding first', code: 'ONBOARDING_REQUIRED' }, { status: 403 })
    }

    // Session caps for new hosts (hostTier = NEW)
    if (dbUser.hostTier === 'NEW') {
      const activeSessionCount = await prisma.activity.count({
        where: {
          userId: dbUser.id,
          status: 'PUBLISHED',
          deletedAt: null,
          startTime: { gt: new Date() },
        },
      })
      if (activeSessionCount >= 3) {
        return NextResponse.json(
          {
            error: 'You have 3 upcoming sessions live. Finish or cancel one before adding another.',
            code: 'SESSION_CAP',
            sessionCap: 3,
            activeSessionCount,
            manageUrl: '/my-sessions',
            guidance: 'New hosts unlock more listings after completing a few sessions.',
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const {
      title,
      description,
      categorySlug,
      city,
      address,
      latitude,
      longitude,
      startTime,
      endTime,
      maxPeople,
      fitnessLevel,
      whatToBring,
      price,
      currency,
      imageUrl,
      acceptPayNow,
      acceptStripe,
      paynowQrImageUrl,
      paynowPhoneNumber,
      paynowName,
      requiresDeposit,
      depositAmount,
      cancellationPolicy,
      communityId,
    } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (title.trim().length > 100) {
      return NextResponse.json({ error: 'Title must be 100 characters or less' }, { status: 400 })
    }
    if (description && description.length > 500) {
      return NextResponse.json({ error: 'Description must be 500 characters or less' }, { status: 400 })
    }
    if (!categorySlug) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 })
    }
    if (!city || !latitude || !longitude) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 })
    }
    if (!startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 })
    }
    if (new Date(startTime) <= new Date()) {
      return NextResponse.json({ error: 'Start time must be in the future' }, { status: 400 })
    }
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (new Date(startTime) > oneYearFromNow) {
      return NextResponse.json({ error: 'Start time cannot be more than 1 year in the future' }, { status: 400 })
    }
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const priceNum = Number(price ?? 0)
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const requestedCommunityId = typeof communityId === 'string' && communityId.trim()
      ? communityId.trim()
      : null
    let community: { id: string } | null = null

    if (requestedCommunityId) {
      const communityWithMembership = await prisma.community.findFirst({
        where: {
          id: requestedCommunityId,
          isActive: true,
          moderationStatus: 'LIVE',
        },
        select: {
          id: true,
          members: {
            where: { userId: dbUser.id },
            select: { role: true, managerTrustLevel: true },
            take: 1,
          },
        },
      })

      const membership = communityWithMembership?.members[0]
      if (!communityWithMembership || (membership?.role !== 'OWNER' && membership?.role !== 'ADMIN')) {
        return NextResponse.json(
          { error: 'You can only post sessions for approved communities you manage', code: 'COMMUNITY_FORBIDDEN' },
          { status: 403 },
        )
      }
      if (!isTrustedCommunityManager(membership.managerTrustLevel)) {
        return NextResponse.json(
          {
            error: 'Verify your community manager access before posting sessions',
            code: 'MANAGER_VERIFICATION_REQUIRED',
          },
          { status: 403 },
        )
      }

      community = { id: communityWithMembership.id }
    }

    const isSelfHostedSession = !community

    if (isSelfHostedSession && priceNum > 0) {
      return NextResponse.json(
        {
          error: 'Paid sessions need a verified community profile',
          code: 'SELF_HOSTED_PAID_REQUIRES_COMMUNITY',
        },
        { status: 400 },
      )
    }

    // If paid, must have at least one payment method
    if (priceNum > 0) {
      const wantsPayNow = acceptPayNow === true
      const wantsStripe = acceptStripe === true
      if (!wantsPayNow && !wantsStripe) {
        return NextResponse.json(
          { error: 'Select at least one payment method for paid sessions', code: 'PAYMENT_METHOD_REQUIRED' },
          { status: 400 }
        )
      }
      if (wantsStripe && !dbUser.p2pStripeConnectId) {
        return NextResponse.json(
          { error: 'Connect Stripe to accept card payments', code: 'STRIPE_REQUIRED' },
          { status: 400 }
        )
      }
      if (wantsPayNow && !paynowQrImageUrl) {
        return NextResponse.json(
          { error: 'PayNow QR code image is required', code: 'PAYNOW_QR_REQUIRED' },
          { status: 400 }
        )
      }
    }

    const activityMode = priceNum > 0 ? 'P2P_PAID' : 'P2P_FREE'
    const duplicateUpcomingCount = await prisma.activity.count({
      where: {
        userId: dbUser.id,
        title: { equals: title.trim(), mode: 'insensitive' },
        startTime: { gt: new Date() },
        deletedAt: null,
      },
    })
    const moderationDecision = scoreSessionListing({
      title: title.trim(),
      description: description?.trim() ?? null,
      categorySlug,
      address: address ?? null,
      price: priceNum,
      acceptPayNow: acceptPayNow === true,
      acceptStripe: acceptStripe === true,
      imageUrl: imageUrl ?? null,
      hostTier: dbUser.hostTier,
      hostSessionCount: dbUser.sessionsHostedCount,
      duplicateUpcomingCount,
    })

    if (moderationDecision.status === 'BLOCKED') {
      return NextResponse.json(
        { error: 'This session needs changes before it can be posted.', code: 'BLOCKED_CONTENT' },
        { status: 400 },
      )
    }

    const requiresReview = isSelfHostedSession || moderationDecision.status === 'UNDER_REVIEW'
    const resolvedModerationStatus = isSelfHostedSession
      ? 'UNDER_REVIEW'
      : moderationDecision.status

    const maxPeopleNum = maxPeople !== undefined && maxPeople !== null && maxPeople !== ''
      ? Number(maxPeople)
      : null
    if (maxPeopleNum !== null && (!Number.isInteger(maxPeopleNum) || maxPeopleNum < 1)) {
      return NextResponse.json({ error: 'Max people must be a positive whole number' }, { status: 400 })
    }
    const resolvedMaxPeople = maxPeopleNum !== null
      ? Math.max(1, Math.min(maxPeopleNum, isSelfHostedSession || dbUser.hostTier === 'NEW' ? 8 : 1000))
      : (isSelfHostedSession || dbUser.hostTier === 'NEW' ? 8 : null)

    // Deposit defaults: if requiresDeposit is true but no amount specified, default to 500 ($5.00 SGD)
    const resolvedRequiresDeposit = requiresDeposit === true
    const resolvedDepositAmount = resolvedRequiresDeposit
      ? (depositAmount && Number(depositAmount) > 0 ? Number(depositAmount) : 500)
      : null

    // Map categorySlug to legacy ActivityType for backward compat
    const typeMap: Record<string, string> = {
      running: 'RUN',
      gym: 'GYM',
      yoga: 'YOGA',
      hiking: 'HIKE',
      cycling: 'CYCLING',
    }
    const activityType = typeMap[categorySlug] ?? 'OTHER'

    const activity = await prisma.activity.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? null,
        type: activityType as never,
        categorySlug,
        city,
        address: address ?? null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        maxPeople: resolvedMaxPeople,
        price: Math.round(priceNum * 100), // store in cents
        currency: currency ?? 'SGD',
        imageUrl: imageUrl ?? null,
        activityMode,
        fitnessLevel: fitnessLevel ?? null,
        whatToBring: whatToBring ?? null,
        requiresApproval: requiresReview,
        status: requiresReview ? 'PENDING_APPROVAL' : 'PUBLISHED',
        moderationStatus: resolvedModerationStatus,
        riskScore: moderationDecision.riskScore,
        riskFlags: moderationDecision.riskFlags,
        moderationNotes: moderationDecision.moderationNotes,
        userId: dbUser.id,
        hostId: dbUser.id,
        acceptPayNow: acceptPayNow === true,
        acceptStripe: acceptStripe === true,
        paynowQrImageUrl: paynowQrImageUrl ?? null,
        paynowPhoneNumber: paynowPhoneNumber ?? null,
        paynowName: paynowName ?? null,
        sessionType: community ? 'COMMUNITY' : 'SELF_HOSTED',
        communityId: community?.id ?? null,
        cancellationPolicy: cancellationPolicy ?? null,
        requiresDeposit: resolvedRequiresDeposit,
        depositAmount: resolvedDepositAmount,
      },
      select: {
        id: true,
        title: true,
        activityMode: true,
        status: true,
        startTime: true,
        categorySlug: true,
      },
    })

    if (!requiresReview) {
      // Increment sessionsHostedCount after public creation only.
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { sessionsHostedCount: { increment: 1 } },
      })

      // Check and award any hosting badges
      await checkAndAwardBadges(dbUser.id)

      // Auto-upgrade host tier based on session count
      if (dbUser.hostTier === 'NEW') {
        const totalHosted = await prisma.user.findUnique({
          where: { id: dbUser.id },
          select: { sessionsHostedCount: true, reliabilityScore: true, noShowCount: true },
        })
        if (totalHosted && totalHosted.sessionsHostedCount >= 5 && totalHosted.reliabilityScore >= 90 && totalHosted.noShowCount === 0) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { hostTier: 'COMMUNITY', hostTierUpdatedAt: new Date() },
          })
        }
      }
    }

    return NextResponse.json(
      {
        activity,
        requiresReview,
        limited: moderationDecision.status === 'LIMITED',
        moderation: {
          status: moderationDecision.status,
          riskScore: moderationDecision.riskScore,
          riskFlags: moderationDecision.riskFlags,
        },
      },
      { status: requiresReview ? 202 : 201 },
    )
  } catch (error) {
    console.error('[buddy/sessions/create] Error:', error)
    if (isRecoverableDiscoveryDbError(error)) {
      return NextResponse.json(
        {
          error: 'Session posting is temporarily unavailable while we restore database capacity. Please try again shortly.',
          code: 'DATABASE_UNAVAILABLE',
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
