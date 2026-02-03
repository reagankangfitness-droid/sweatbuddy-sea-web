import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { ReportStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status as ReportStatus
    }

    // Get total count for pagination
    const total = await prisma.userReport.count({ where })

    // Fetch reports with pagination
    const reports = await prisma.userReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            firstName: true,
            email: true,
            imageUrl: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            email: true,
            imageUrl: true,
            accountStatus: true,
          },
        },
      },
    })

    // Get report counts by status for tabs
    const counts = await prisma.userReport.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statusCounts = {
      PENDING: 0,
      REVIEWED: 0,
      ACTIONED: 0,
      DISMISSED: 0,
    }
    for (const c of counts) {
      statusCounts[c.status] = c._count.id
    }

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        actionTaken: r.actionTaken,
        resolutionNotes: r.resolutionNotes,
        resolvedAt: r.resolvedAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
        reporter: {
          id: r.reporter.id,
          name: r.reporter.firstName || r.reporter.name || 'Unknown',
          email: r.reporter.email,
          imageUrl: r.reporter.imageUrl,
        },
        reportedUser: {
          id: r.reportedUser.id,
          name: r.reportedUser.firstName || r.reportedUser.name || 'Unknown',
          email: r.reportedUser.email,
          imageUrl: r.reportedUser.imageUrl,
          accountStatus: r.reportedUser.accountStatus,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
