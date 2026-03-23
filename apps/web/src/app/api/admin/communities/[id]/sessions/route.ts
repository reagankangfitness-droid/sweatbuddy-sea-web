import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { geocodeAddress } from '@/lib/geocode'

// POST - Create a session (one-time or recurring template) for a community
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const communityId = params.id
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, createdById: true },
    })
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title, description, categorySlug, imageUrl,
      city, address,
      isRecurring, daysOfWeek, startTime, endTime,
      startDate, endDate,
      maxPeople, fitnessLevel, price, currency,
    } = body

    // Auto-geocode if address provided but no coordinates
    let { latitude, longitude } = body
    let resolvedCity = city?.trim() || 'Singapore'
    if (address) {
      const coords = await geocodeAddress(address)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
        // Extract city from address or displayName
        if (!city?.trim() || city === 'Singapore') {
          const addrLower = address.toLowerCase()
          if (addrLower.includes('bangkok')) resolvedCity = 'Bangkok'
          else if (addrLower.includes('kuala lumpur')) resolvedCity = 'Kuala Lumpur'
          else if (addrLower.includes('jakarta')) resolvedCity = 'Jakarta'
          else if (addrLower.includes('manila')) resolvedCity = 'Manila'
          else if (addrLower.includes('ho chi minh')) resolvedCity = 'Ho Chi Minh City'
          else if (addrLower.includes('singapore')) resolvedCity = 'Singapore'
          else if (coords.displayName) {
            // Try to extract city from Nominatim displayName
            const parts = coords.displayName.split(',').map((p: string) => p.trim())
            if (parts.length >= 3) resolvedCity = parts[parts.length - 3]
          }
        }
      }
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 })
    }

    const typeMap: Record<string, string> = {
      running: 'RUN', gym: 'GYM', yoga: 'YOGA', hiking: 'HIKE', cycling: 'CYCLING',
    }
    const activityType = typeMap[categorySlug] ?? 'OTHER'
    const priceNum = Number(price ?? 0)
    const priceCents = Math.round(priceNum * 100)
    const activityMode = priceCents > 0 ? 'P2P_PAID' : 'P2P_FREE'

    if (isRecurring) {
      // Create a recurring template
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        return NextResponse.json({ error: 'Select at least one day' }, { status: 400 })
      }

      const template = await prisma.sessionTemplate.create({
        data: {
          hostId: community.createdById,
          communityId: community.id,
          title: title.trim(),
          description: description?.trim() || null,
          categorySlug: categorySlug || null,
          imageUrl: imageUrl || null,
          sessionType: 'GROUP',
          daysOfWeek,
          startTime,
          endTime: endTime || null,
          endDate: endDate ? new Date(endDate) : null,
          city: resolvedCity,
          address: address?.trim() || null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          maxParticipants: maxPeople ? Number(maxPeople) : null,
          fitnessLevel: fitnessLevel || null,
          price: priceCents || null,
          currency: currency || 'SGD',
          isActive: true,
        },
      })

      // Generate initial 4 weeks
      const DAY_MAP: Record<string, number> = {
        SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
        THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
      }
      const SGT_OFFSET = 8
      const now = new Date()
      let sessionsGenerated = 0

      for (const dayName of daysOfWeek) {
        const dayNum = DAY_MAP[dayName]
        if (dayNum === undefined) continue

        const [h, m] = startTime.split(':').map(Number)
        const sgtNow = new Date(now.getTime() + SGT_OFFSET * 60 * 60 * 1000)
        const currentDay = sgtNow.getUTCDay()
        let daysUntil = dayNum - currentDay
        if (daysUntil < 0) daysUntil += 7
        if (daysUntil === 0) {
          const todaySGT = new Date(Date.UTC(sgtNow.getUTCFullYear(), sgtNow.getUTCMonth(), sgtNow.getUTCDate(), h - SGT_OFFSET, m))
          if (todaySGT.getTime() <= now.getTime()) daysUntil = 7
        }

        for (let i = 0; i < 4; i++) {
          const targetDays = daysUntil + i * 7
          const targetDate = new Date(sgtNow.getUTCFullYear(), sgtNow.getUTCMonth(), sgtNow.getUTCDate() + targetDays)
          const startDt = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), h - SGT_OFFSET, m))

          if (template.endDate && startDt > template.endDate) continue

          let endDt: Date | null = null
          if (endTime) {
            const [eh, em] = endTime.split(':').map(Number)
            const dur = (eh * 60 + em - (h * 60 + m)) * 60 * 1000
            if (dur > 0) endDt = new Date(startDt.getTime() + dur)
          }

          await prisma.activity.create({
            data: {
              title: template.title,
              description: template.description,
              type: activityType as never,
              categorySlug: template.categorySlug,
              city: template.city || resolvedCity,
              address: template.address,
              latitude: template.latitude ?? 1.3521,
              longitude: template.longitude ?? 103.8198,
              startTime: startDt,
              endTime: endDt,
              maxPeople: template.maxParticipants,
              price: priceCents,
              currency: template.currency,
              imageUrl: template.imageUrl,
              status: 'PUBLISHED',
              userId: community.createdById,
              hostId: community.createdById,
              sessionType: 'COMMUNITY',
              sessionTemplateId: template.id,
              communityId: community.id,
              activityMode,
              fitnessLevel: template.fitnessLevel,
            },
          })
          sessionsGenerated++
        }
      }

      return NextResponse.json({ template, sessionsGenerated }, { status: 201 })
    } else {
      // Create one-time session
      if (!startDate) {
        return NextResponse.json({ error: 'Date is required for one-time sessions' }, { status: 400 })
      }

      const startDt = new Date(`${startDate}T${startTime}:00+08:00`)
      let endDt: Date | null = null
      if (endTime) {
        endDt = new Date(`${startDate}T${endTime}:00+08:00`)
      }

      const activity = await prisma.activity.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          type: activityType as never,
          categorySlug: categorySlug || null,
          city: resolvedCity,
          address: address?.trim() || null,
          latitude: latitude ? Number(latitude) : 1.3521,
          longitude: longitude ? Number(longitude) : 103.8198,
          startTime: startDt,
          endTime: endDt,
          maxPeople: maxPeople ? Number(maxPeople) : null,
          price: priceCents,
          currency: currency || 'SGD',
          imageUrl: imageUrl || null,
          status: 'PUBLISHED',
          userId: community.createdById,
          hostId: community.createdById,
          sessionType: 'COMMUNITY',
          communityId: community.id,
          activityMode,
          fitnessLevel: fitnessLevel || null,
        },
      })

      return NextResponse.json({ activity }, { status: 201 })
    }
  } catch (error) {
    console.error('[admin/communities/[id]/sessions] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List sessions for a community
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sessions = await prisma.activity.findMany({
      where: { communityId: params.id, deletedAt: null },
      select: {
        id: true, title: true, startTime: true, endTime: true,
        status: true, price: true, currency: true,
        _count: { select: { userActivities: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    const templates = await prisma.sessionTemplate.findMany({
      where: { communityId: params.id, deletedAt: null },
      select: {
        id: true, title: true, daysOfWeek: true, startTime: true, endTime: true,
        isActive: true, _count: { select: { sessions: true } },
      },
    })

    return NextResponse.json({ sessions, templates })
  } catch (error) {
    console.error('[admin/communities/[id]/sessions] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
