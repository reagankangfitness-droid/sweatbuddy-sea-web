import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { sendEventApprovedEmail, sendEventRejectedEmail } from '@/lib/event-confirmation-email'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const action = body.action || (body.status === 'APPROVED' ? 'approve' : body.status === 'REJECTED' ? 'reject' : null)
    const rejectionReason = body.rejectionReason

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

    // Revalidate caches so approved events appear immediately
    if (action === 'approve') {
      // Revalidate all cache tags
      revalidateTag('events')
      revalidateTag('attendance')

      // Revalidate all relevant paths
      revalidatePath('/', 'layout')
      revalidatePath('/', 'page')
      revalidatePath('/api/events')
      revalidatePath('/events')
      revalidatePath('/discover')

      // Revalidate the specific event page if it has a slug
      if (submission.slug) {
        revalidatePath(`/event/${submission.slug}`)
        revalidatePath(`/e/${submission.id}`)
      }
    }

    // Send notification email to host (fire and forget)
    if (submission.contactEmail) {
      if (action === 'approve') {
        sendEventApprovedEmail({
          to: submission.contactEmail,
          hostName: submission.organizerName,
          eventName: submission.eventName,
          eventId: submission.id,
          eventSlug: submission.slug,
        }).catch((err) => {
          console.error('Failed to send approval email:', err)
        })
      } else {
        sendEventRejectedEmail({
          to: submission.contactEmail,
          hostName: submission.organizerName,
          eventName: submission.eventName,
          eventId: submission.id,
          rejectionReason: rejectionReason || null,
        }).catch((err) => {
          console.error('Failed to send rejection email:', err)
        })
      }
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
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

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
