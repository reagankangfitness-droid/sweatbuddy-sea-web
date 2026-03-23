import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
}

const SGT_OFFSET = 8

function getNextDates(dayOfWeek: number, startTime: string, fromDate: Date, count: number): Date[] {
  const dates: Date[] = []
  const [hours, minutes] = startTime.split(':').map(Number)
  const sgtNow = new Date(fromDate.getTime() + SGT_OFFSET * 60 * 60 * 1000)
  const currentDayOfWeek = sgtNow.getUTCDay()

  let daysUntil = dayOfWeek - currentDayOfWeek
  if (daysUntil < 0) daysUntil += 7
  if (daysUntil === 0) {
    const todaySGT = new Date(Date.UTC(sgtNow.getUTCFullYear(), sgtNow.getUTCMonth(), sgtNow.getUTCDate(), hours - SGT_OFFSET, minutes))
    if (todaySGT.getTime() <= fromDate.getTime()) daysUntil = 7
  }

  for (let i = 0; i < count; i++) {
    const targetDaysFromNow = daysUntil + i * 7
    const targetDateSGT = new Date(sgtNow.getUTCFullYear(), sgtNow.getUTCMonth(), sgtNow.getUTCDate() + targetDaysFromNow)
    const utcDate = new Date(Date.UTC(targetDateSGT.getFullYear(), targetDateSGT.getMonth(), targetDateSGT.getDate(), hours - SGT_OFFSET, minutes))
    dates.push(utcDate)
  }
  return dates
}

// GET: list host's templates
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const templates = await prisma.sessionTemplate.findMany({
      where: { hostId: dbUser.id, deletedAt: null },
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[host/templates] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: create a template + generate initial 4 weeks of sessions
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, p2pOnboardingCompleted: true, p2pStripeConnectId: true },
    })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!dbUser.p2pOnboardingCompleted) {
      return NextResponse.json({ error: 'Complete onboarding first', code: 'ONBOARDING_REQUIRED' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title, description, categorySlug, imageUrl,
      city, address, latitude, longitude,
      daysOfWeek, startTime, endTime, endDate,
      maxPeople, fitnessLevel, whatToBring,
      price, currency,
      acceptPayNow, acceptStripe,
      paynowQrImageUrl, paynowPhoneNumber, paynowName,
      cancellationPolicy,
      communityId,
    } = body

    // Validate
    if (!title?.trim() || title.length > 100) {
      return NextResponse.json({ error: 'Title is required (max 100 chars)' }, { status: 400 })
    }
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ error: 'Select at least one day of the week' }, { status: 400 })
    }
    for (const day of daysOfWeek) {
      if (!(day in DAY_MAP)) {
        return NextResponse.json({ error: `Invalid day: ${day}` }, { status: 400 })
      }
    }
    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: 'Start time is required (HH:MM)' }, { status: 400 })
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    const priceNum = Number(price ?? 0)
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }
    if (priceNum > 0) {
      if (!acceptPayNow && !acceptStripe) {
        return NextResponse.json({ error: 'Select at least one payment method', code: 'PAYMENT_METHOD_REQUIRED' }, { status: 400 })
      }
      if (acceptStripe && !dbUser.p2pStripeConnectId) {
        return NextResponse.json({ error: 'Connect Stripe first', code: 'STRIPE_REQUIRED' }, { status: 400 })
      }
      if (acceptPayNow && !paynowQrImageUrl) {
        return NextResponse.json({ error: 'PayNow QR code required', code: 'PAYNOW_QR_REQUIRED' }, { status: 400 })
      }
    }

    const priceCents = Math.round(priceNum * 100)

    // Create template
    const template = await prisma.sessionTemplate.create({
      data: {
        hostId: dbUser.id,
        title: title.trim(),
        description: description?.trim() || null,
        categorySlug: categorySlug || null,
        imageUrl: imageUrl || null,
        sessionType: 'GROUP',
        daysOfWeek,
        startTime,
        endTime: endTime || null,
        endDate: endDate ? new Date(endDate) : null,
        city: city.trim(),
        address: address?.trim() || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        maxParticipants: maxPeople ? Math.max(1, Math.min(Number(maxPeople), 1000)) : null,
        fitnessLevel: fitnessLevel || null,
        whatToBring: whatToBring?.trim() || null,
        price: priceCents || null,
        currency: currency || 'SGD',
        acceptPayNow: acceptPayNow === true,
        acceptStripe: acceptStripe === true,
        paynowQrImageUrl: paynowQrImageUrl || null,
        paynowPhoneNumber: paynowPhoneNumber?.trim() || null,
        paynowName: paynowName?.trim() || null,
        cancellationPolicy: cancellationPolicy || null,
        communityId: communityId || null,
        isActive: true,
      },
    })

    // Generate initial 4 weeks of sessions
    const now = new Date()
    const typeMap: Record<string, string> = {
      running: 'RUN', gym: 'GYM', yoga: 'YOGA', hiking: 'HIKE', cycling: 'CYCLING',
    }
    const activityType = typeMap[categorySlug] ?? 'OTHER'
    const activityMode = priceCents > 0 ? 'P2P_PAID' : 'P2P_FREE'

    let sessionsGenerated = 0
    for (const dayName of daysOfWeek) {
      const dayNum = DAY_MAP[dayName]
      if (dayNum === undefined) continue
      const dates = getNextDates(dayNum, startTime, now, 4)

      for (const startDate of dates) {
        // Respect endDate
        if (template.endDate && startDate > template.endDate) continue

        let activityEndTime: Date | null = null
        if (endTime) {
          const [endH, endM] = endTime.split(':').map(Number)
          const [startH, startM] = startTime.split(':').map(Number)
          const durationMs = (endH * 60 + endM - (startH * 60 + startM)) * 60 * 1000
          if (durationMs > 0) activityEndTime = new Date(startDate.getTime() + durationMs)
        }

        await prisma.activity.create({
          data: {
            title: template.title,
            description: template.description,
            type: activityType as never,
            categorySlug: template.categorySlug,
            city: template.city || 'Singapore',
            address: template.address,
            latitude: template.latitude ?? 1.3521,
            longitude: template.longitude ?? 103.8198,
            startTime: startDate,
            endTime: activityEndTime,
            maxPeople: template.maxParticipants,
            price: priceCents,
            currency: template.currency,
            imageUrl: template.imageUrl,
            status: 'PUBLISHED',
            userId: dbUser.id,
            hostId: dbUser.id,
            sessionType: 'COMMUNITY',
            sessionTemplateId: template.id,
            activityMode,
            fitnessLevel: template.fitnessLevel,
            whatToBring: template.whatToBring,
            acceptPayNow: template.acceptPayNow,
            acceptStripe: template.acceptStripe,
            paynowQrImageUrl: template.paynowQrImageUrl,
            paynowPhoneNumber: template.paynowPhoneNumber,
            paynowName: template.paynowName,
            cancellationPolicy: template.cancellationPolicy,
            communityId: template.communityId,
          },
        })
        sessionsGenerated++
      }
    }

    return NextResponse.json({ template, sessionsGenerated }, { status: 201 })
  } catch (error) {
    console.error('[host/templates] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
