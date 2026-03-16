import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/coaches/templates/[id]
 * Get a single session template (must be owner)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.sessionTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.coachId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/coaches/templates/[id]
 * Update a session template (must be owner)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.sessionTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.coachId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Build update data from allowed fields
    const allowedFields = [
      'title', 'description', 'categorySlug', 'sessionType',
      'daysOfWeek', 'startTime', 'endTime', 'price', 'currency',
      'maxParticipants', 'fitnessLevel', 'whatToBring',
      'locationName', 'address', 'latitude', 'longitude', 'isActive',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Validate daysOfWeek if provided
    if (updateData.daysOfWeek !== undefined) {
      const validDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      if (!Array.isArray(updateData.daysOfWeek) || (updateData.daysOfWeek as string[]).length === 0) {
        return NextResponse.json({ error: 'daysOfWeek must be a non-empty array' }, { status: 400 })
      }
      for (const day of updateData.daysOfWeek as string[]) {
        if (!validDays.includes(day)) {
          return NextResponse.json({ error: `Invalid day: ${day}` }, { status: 400 })
        }
      }
    }

    // Validate startTime if provided
    if (updateData.startTime !== undefined) {
      if (typeof updateData.startTime !== 'string' || !/^\d{2}:\d{2}$/.test(updateData.startTime)) {
        return NextResponse.json({ error: 'startTime must be in HH:mm format' }, { status: 400 })
      }
    }

    // Validate sessionType if provided
    if (updateData.sessionType !== undefined) {
      const validSessionTypes = ['GROUP', 'ONE_ON_ONE', 'WORKSHOP']
      if (!validSessionTypes.includes(updateData.sessionType as string)) {
        return NextResponse.json(
          { error: `sessionType must be one of: ${validSessionTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.sessionTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/coaches/templates/[id]
 * Soft-delete a session template (set isActive=false)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.sessionTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.coachId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.sessionTemplate.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
