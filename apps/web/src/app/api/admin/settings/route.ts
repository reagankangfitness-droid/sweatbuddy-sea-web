import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Upsert ensures row exists on first read
    const settings = await prisma.adminSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch admin settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const settings = await prisma.adminSettings.upsert({
      where: { id: 1 },
      update: {
        notifyOnNewEvent: Boolean(body.notifyOnNewEvent),
        notifyOnNewAttendee: Boolean(body.notifyOnNewAttendee),
        autoApproveOrganizers: Boolean(body.autoApproveOrganizers),
        requireEmailVerification: Boolean(body.requireEmailVerification),
        maxAttendeesPerEvent: Math.max(1, Math.min(10000, parseInt(body.maxAttendeesPerEvent) || 100)),
        adminEmail: typeof body.adminEmail === 'string' ? body.adminEmail.trim() : '',
      },
      create: {
        id: 1,
        notifyOnNewEvent: Boolean(body.notifyOnNewEvent),
        notifyOnNewAttendee: Boolean(body.notifyOnNewAttendee),
        autoApproveOrganizers: Boolean(body.autoApproveOrganizers),
        requireEmailVerification: Boolean(body.requireEmailVerification),
        maxAttendeesPerEvent: Math.max(1, Math.min(10000, parseInt(body.maxAttendeesPerEvent) || 100)),
        adminEmail: typeof body.adminEmail === 'string' ? body.adminEmail.trim() : '',
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to save admin settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
