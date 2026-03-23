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

// POST: skip a specific date
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const template = await prisma.sessionTemplate.findFirst({
      where: { id: params.templateId, hostId: dbUser.id, deletedAt: null },
    })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const { date } = await request.json()
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Date must be in YYYY-MM-DD format' }, { status: 400 })
    }

    // Add to skippedDates if not already there
    const skippedDates = template.skippedDates.includes(date)
      ? template.skippedDates
      : [...template.skippedDates, date]

    await prisma.sessionTemplate.update({
      where: { id: params.templateId },
      data: { skippedDates },
    })

    // Cancel existing activity for that date if it exists and has no RSVPs
    const dateStart = new Date(`${date}T00:00:00Z`)
    const dateEnd = new Date(`${date}T23:59:59Z`)

    await prisma.activity.updateMany({
      where: {
        sessionTemplateId: params.templateId,
        startTime: { gte: dateStart, lte: dateEnd },
        deletedAt: null,
        status: { not: 'CANCELLED' },
        userActivities: { none: {} },
      },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true, skippedDates })
  } catch (error) {
    console.error('[host/templates/skip] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: unskip a date
export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const template = await prisma.sessionTemplate.findFirst({
      where: { id: params.templateId, hostId: dbUser.id, deletedAt: null },
    })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const { date } = await request.json()
    const skippedDates = template.skippedDates.filter((d) => d !== date)

    await prisma.sessionTemplate.update({
      where: { id: params.templateId },
      data: { skippedDates },
    })

    return NextResponse.json({ success: true, skippedDates })
  } catch (error) {
    console.error('[host/templates/skip] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
