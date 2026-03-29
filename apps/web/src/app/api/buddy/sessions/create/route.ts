import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'

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
      select: { id: true, p2pOnboardingCompleted: true, p2pStripeConnectId: true, isCoach: true, coachVerificationStatus: true, hostTier: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
          { error: 'New hosts can have up to 3 active sessions. Complete a few sessions to unlock more.', code: 'SESSION_CAP' },
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
        maxPeople: maxPeople
          ? Math.max(1, Math.min(Number(maxPeople), dbUser.hostTier === 'NEW' ? 8 : 1000))
          : (dbUser.hostTier === 'NEW' ? 8 : null),
        price: Math.round(priceNum * 100), // store in cents
        currency: currency ?? 'SGD',
        imageUrl: imageUrl ?? null,
        activityMode,
        fitnessLevel: fitnessLevel ?? null,
        whatToBring: whatToBring ?? null,
        requiresApproval: false,
        status: 'PUBLISHED',
        userId: dbUser.id,
        hostId: dbUser.id,
        acceptPayNow: acceptPayNow === true,
        acceptStripe: acceptStripe === true,
        paynowQrImageUrl: paynowQrImageUrl ?? null,
        paynowPhoneNumber: paynowPhoneNumber ?? null,
        paynowName: paynowName ?? null,
        sessionType: 'COMMUNITY',
        communityId: communityId || null,
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

    // Increment sessionsHostedCount
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

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('[buddy/sessions/create] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
