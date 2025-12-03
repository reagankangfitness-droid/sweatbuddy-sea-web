import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple admin check - you can make this more secure later
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sweatbuddies-admin-2024'

function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  return authHeader === ADMIN_SECRET
}

export async function GET(request: Request) {
  // Check admin access
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    const submissions = await prisma.eventSubmission.findMany({
      where: status === 'all' ? {} : { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching event submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
