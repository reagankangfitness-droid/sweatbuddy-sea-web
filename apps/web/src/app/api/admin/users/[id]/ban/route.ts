import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { ban, reason } = await request.json()

    await prisma.user.update({
      where: { id },
      data: {
        accountStatus: ban ? 'BANNED' : 'ACTIVE',
        bannedAt: ban ? new Date() : null,
        banReason: ban ? (reason || null) : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user ban status:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
