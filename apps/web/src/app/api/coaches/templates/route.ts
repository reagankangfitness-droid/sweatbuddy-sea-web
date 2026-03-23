import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/coaches/templates
 * List all session templates for the authenticated coach
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user is a verified coach
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCoach: true, coachVerificationStatus: true },
    })

    if (!user?.isCoach || user.coachVerificationStatus !== 'VERIFIED') {
      return NextResponse.json({ error: 'Must be a verified coach' }, { status: 403 })
    }

    const templates = await prisma.sessionTemplate.findMany({
      where: { hostId: userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('List templates error:', error)
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/coaches/templates
 * Create a new session template
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user is a verified coach
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCoach: true, coachVerificationStatus: true },
    })

    if (!user?.isCoach || user.coachVerificationStatus !== 'VERIFIED') {
      return NextResponse.json({ error: 'Must be a verified coach' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      categorySlug,
      sessionType,
      daysOfWeek,
      startTime,
      endTime,
      price,
      currency,
      maxParticipants,
      fitnessLevel,
      whatToBring,
      locationName,
      address,
      latitude,
      longitude,
    } = body

    // Validate required fields
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const validSessionTypes = ['GROUP', 'ONE_ON_ONE', 'WORKSHOP']
    if (!sessionType || !validSessionTypes.includes(sessionType)) {
      return NextResponse.json(
        { error: `sessionType must be one of: ${validSessionTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const validDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json({ error: 'daysOfWeek must be a non-empty array' }, { status: 400 })
    }
    for (const day of daysOfWeek) {
      if (!validDays.includes(day)) {
        return NextResponse.json(
          { error: `Invalid day: ${day}. Must be one of: ${validDays.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json({ error: 'startTime must be in HH:mm format' }, { status: 400 })
    }

    const template = await prisma.sessionTemplate.create({
      data: {
        hostId: userId,
        title: title.trim(),
        description: description?.trim() || null,
        categorySlug: categorySlug || null,
        sessionType,
        daysOfWeek,
        startTime,
        endTime: endTime || null,
        price: price != null ? Number(price) : null,
        currency: currency || 'SGD',
        maxParticipants: maxParticipants != null ? Number(maxParticipants) : null,
        fitnessLevel: fitnessLevel || null,
        whatToBring: whatToBring?.trim() || null,
        locationName: locationName?.trim() || null,
        address: address?.trim() || null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
