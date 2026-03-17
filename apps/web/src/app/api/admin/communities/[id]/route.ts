import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

// PATCH - Update a community
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Only allow updating known fields
    const allowedFields = [
      'name',
      'description',
      'category',
      'coverImage',
      'logoImage',
      'instagramHandle',
      'websiteUrl',
      'communityLink',
      'isActive',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'instagramHandle' && body[field]) {
          updateData[field] = body[field].replace(/^@/, '').toLowerCase().trim()
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const updated = await prisma.community.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, community: updated })
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate a community (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await prisma.community.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Community deactivated',
    })
  } catch (error) {
    console.error('Error deactivating community:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate community' },
      { status: 500 }
    )
  }
}
