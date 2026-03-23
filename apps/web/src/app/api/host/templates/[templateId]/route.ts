import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

async function getDbUser() {
  const { userId } = await auth()
  if (!userId) return null
  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  if (!email) return null
  return prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } })
}

// GET: fetch single template with session count
export async function GET(
  _request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const template = await prisma.sessionTemplate.findFirst({
      where: { id: params.templateId, hostId: dbUser.id, deletedAt: null },
      include: {
        _count: { select: { sessions: true } },
        sessions: {
          where: { startTime: { gte: new Date() }, deletedAt: null, status: { not: 'CANCELLED' } },
          orderBy: { startTime: 'asc' },
          select: {
            id: true, title: true, startTime: true, endTime: true, status: true,
            _count: { select: { userActivities: true } },
          },
        },
      },
    })

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[host/templates/[id]] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: update template, apply changes to future un-RSVPd sessions
export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const existing = await prisma.sessionTemplate.findFirst({
      where: { id: params.templateId, hostId: dbUser.id, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const body = await request.json()
    const {
      title, description, categorySlug, imageUrl,
      city, address, latitude, longitude,
      daysOfWeek, startTime, endTime, endDate,
      maxPeople, fitnessLevel, whatToBring,
      price, currency, isActive,
      acceptPayNow, acceptStripe,
      paynowQrImageUrl, paynowPhoneNumber, paynowName,
      cancellationPolicy,
    } = body

    const priceCents = price !== undefined ? Math.round(Number(price) * 100) : undefined

    const template = await prisma.sessionTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(categorySlug !== undefined && { categorySlug }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(daysOfWeek !== undefined && { daysOfWeek }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime: endTime || null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(latitude !== undefined && { latitude: latitude ? Number(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? Number(longitude) : null }),
        ...(maxPeople !== undefined && { maxParticipants: maxPeople ? Number(maxPeople) : null }),
        ...(fitnessLevel !== undefined && { fitnessLevel }),
        ...(whatToBring !== undefined && { whatToBring: whatToBring?.trim() || null }),
        ...(priceCents !== undefined && { price: priceCents || null }),
        ...(currency !== undefined && { currency }),
        ...(isActive !== undefined && { isActive }),
        ...(acceptPayNow !== undefined && { acceptPayNow }),
        ...(acceptStripe !== undefined && { acceptStripe }),
        ...(paynowQrImageUrl !== undefined && { paynowQrImageUrl }),
        ...(paynowPhoneNumber !== undefined && { paynowPhoneNumber }),
        ...(paynowName !== undefined && { paynowName }),
        ...(cancellationPolicy !== undefined && { cancellationPolicy }),
      },
    })

    // Update future sessions that have 0 RSVPs
    const futureEmptySessions = await prisma.activity.findMany({
      where: {
        sessionTemplateId: params.templateId,
        startTime: { gt: new Date() },
        deletedAt: null,
        status: { not: 'CANCELLED' },
        userActivities: { none: {} },
      },
      select: { id: true },
    })

    if (futureEmptySessions.length > 0) {
      const updateData: Record<string, unknown> = {}
      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description?.trim() || null
      if (categorySlug !== undefined) updateData.categorySlug = categorySlug
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null
      if (city !== undefined) updateData.city = city?.trim() || null
      if (address !== undefined) updateData.address = address?.trim() || null
      if (latitude !== undefined) updateData.latitude = latitude ? Number(latitude) : null
      if (longitude !== undefined) updateData.longitude = longitude ? Number(longitude) : null
      if (maxPeople !== undefined) updateData.maxPeople = maxPeople ? Number(maxPeople) : null
      if (priceCents !== undefined) updateData.price = priceCents
      if (currency !== undefined) updateData.currency = currency
      if (fitnessLevel !== undefined) updateData.fitnessLevel = fitnessLevel
      if (whatToBring !== undefined) updateData.whatToBring = whatToBring?.trim() || null
      if (acceptPayNow !== undefined) updateData.acceptPayNow = acceptPayNow
      if (acceptStripe !== undefined) updateData.acceptStripe = acceptStripe
      if (paynowQrImageUrl !== undefined) updateData.paynowQrImageUrl = paynowQrImageUrl
      if (paynowPhoneNumber !== undefined) updateData.paynowPhoneNumber = paynowPhoneNumber
      if (paynowName !== undefined) updateData.paynowName = paynowName
      if (cancellationPolicy !== undefined) updateData.cancellationPolicy = cancellationPolicy

      if (Object.keys(updateData).length > 0) {
        await prisma.activity.updateMany({
          where: { id: { in: futureEmptySessions.map((s) => s.id) } },
          data: updateData,
        })
      }
    }

    return NextResponse.json({ template, updatedSessions: futureEmptySessions.length })
  } catch (error) {
    console.error('[host/templates/[id]] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: soft-delete template, optionally cancel future un-RSVPd sessions
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const template = await prisma.sessionTemplate.findFirst({
      where: { id: params.templateId, hostId: dbUser.id, deletedAt: null },
    })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    // Soft delete the template
    await prisma.sessionTemplate.update({
      where: { id: params.templateId },
      data: { isActive: false, deletedAt: new Date() },
    })

    // Cancel future sessions with no RSVPs
    const cancelled = await prisma.activity.updateMany({
      where: {
        sessionTemplateId: params.templateId,
        startTime: { gt: new Date() },
        deletedAt: null,
        status: { not: 'CANCELLED' },
        userActivities: { none: {} },
      },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true, cancelledSessions: cancelled.count })
  } catch (error) {
    console.error('[host/templates/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
