import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { checkApiRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkApiRateLimit(request, 'auth')
    if (rateLimited) return rateLimited

    const { email, name, activityType, city } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const lead = await prisma.hostLead.upsert({
      where: { email: normalized },
      update: { name, activityType, city },
      create: { email: normalized, name, activityType, city },
    })

    return NextResponse.json({ success: true, id: lead.id })
  } catch (err) {
    console.error('[host-leads POST]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin-only lead export
  const leads = await prisma.hostLead.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, activityType: true, city: true, createdAt: true },
  })
  return NextResponse.json({ leads, total: leads.length })
}
