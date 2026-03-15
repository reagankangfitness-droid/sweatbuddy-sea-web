import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { seedBadges } from '@/lib/badges'

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await seedBadges()
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Seed badges error:', error)
    return NextResponse.json(
      { error: 'Failed to seed badges' },
      { status: 500 }
    )
  }
}
