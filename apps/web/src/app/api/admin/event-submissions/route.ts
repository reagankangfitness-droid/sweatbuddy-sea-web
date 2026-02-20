import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where = status === 'all' ? {} : { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }

    const [submissions, total] = await Promise.all([
      prisma.eventSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.eventSubmission.count({ where }),
    ])

    return NextResponse.json({ submissions, total, page, limit })
  } catch (error) {
    console.error('Error fetching event submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
