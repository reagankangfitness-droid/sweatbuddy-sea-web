import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Simple admin check
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sweatbuddies-admin-2024'

function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  return authHeader === ADMIN_SECRET
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check admin access
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const { action, rejectionReason } = await request.json()

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }

    const submission = await prisma.eventSubmission.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason : null,
      },
    })

    // Revalidate homepage cache so approved events appear immediately
    if (action === 'approve') {
      revalidatePath('/')
    }

    return NextResponse.json({
      success: true,
      message: `Event ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      submission,
    })
  } catch (error) {
    console.error('Error updating event submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check admin access
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    await prisma.eventSubmission.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Event submission deleted',
    })
  } catch (error) {
    console.error('Error deleting event submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
