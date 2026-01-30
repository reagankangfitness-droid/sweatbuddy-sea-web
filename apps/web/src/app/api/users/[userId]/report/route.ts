import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReportReason } from '@prisma/client'

const VALID_REASONS = new Set<string>(Object.values(ReportReason))

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await params

    // Prevent reporting yourself
    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { reason, details } = body as { reason: string; details?: string }

    // Validate reason
    if (!reason || !VALID_REASONS.has(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason. Must be one of: ' + Array.from(VALID_REASONS).join(', ') },
        { status: 400 }
      )
    }

    // Validate details length
    if (details && details.length > 2000) {
      return NextResponse.json({ error: 'Details must be 2000 characters or less' }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has already reported this user recently (within 24 hours)
    const recentReport = await prisma.userReport.findFirst({
      where: {
        reporterId: currentUserId,
        reportedUserId: targetUserId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    })

    if (recentReport) {
      return NextResponse.json(
        { error: 'You have already reported this user recently' },
        { status: 429 }
      )
    }

    // Create the report
    const report = await prisma.userReport.create({
      data: {
        reporterId: currentUserId,
        reportedUserId: targetUserId,
        reason: reason as ReportReason,
        details: details?.trim() || null,
      },
    })

    return NextResponse.json(
      { report: { id: report.id }, message: 'Report submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Report user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
