import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest, isAdminUser } from '@/lib/admin-auth'
import { ModerationAction, ReportStatus, UserAccountStatus } from '@prisma/client'

const VALID_ACTIONS = new Set<string>(Object.values(ModerationAction))

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const report = await prisma.userReport.findUnique({
      where: { id },
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
            suspendedUntil: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get previous reports against this user
    const previousReports = await prisma.userReport.count({
      where: {
        reportedUserId: report.reportedUserId,
        id: { not: report.id },
      },
    })

    // Get moderation history for this user
    const moderationHistory = await prisma.moderationLog.findMany({
      where: { targetUserId: report.reportedUserId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      report: {
        id: report.id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        actionTaken: report.actionTaken,
        resolutionNotes: report.resolutionNotes,
        resolvedAt: report.resolvedAt?.toISOString() || null,
        resolvedBy: report.resolvedBy,
        createdAt: report.createdAt.toISOString(),
        reporter: {
          id: report.reporter.id,
          name: report.reporter.firstName || report.reporter.name || 'Unknown',
          email: report.reporter.email,
          imageUrl: report.reporter.imageUrl,
        },
        reportedUser: {
          id: report.reportedUser.id,
          name: report.reportedUser.firstName || report.reportedUser.name || 'Unknown',
          email: report.reportedUser.email,
          imageUrl: report.reportedUser.imageUrl,
          accountStatus: report.reportedUser.accountStatus,
          suspendedUntil: report.reportedUser.suspendedUntil?.toISOString() || null,
        },
      },
      previousReportsCount: previousReports,
      moderationHistory: moderationHistory.map((h) => ({
        id: h.id,
        action: h.action,
        reason: h.reason,
        suspensionDays: h.suspensionDays,
        createdAt: h.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get admin user ID for audit trail
  const { userId: adminUserId } = await auth()
  if (!adminUserId || !isAdminUser(adminUserId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { action, notes, suspensionDays } = body as {
      action: string
      notes?: string
      suspensionDays?: number
    }

    // Validate action
    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ' + Array.from(VALID_ACTIONS).join(', ') },
        { status: 400 }
      )
    }

    // Get the report
    const report = await prisma.userReport.findUnique({
      where: { id },
      include: {
        reportedUser: {
          select: {
            id: true,
            accountStatus: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Determine new user status and report status based on action
    let newUserStatus: UserAccountStatus | undefined
    let newReportStatus: ReportStatus
    let suspendedUntil: Date | null = null

    switch (action as ModerationAction) {
      case 'WARNING':
        newUserStatus = UserAccountStatus.WARNED
        newReportStatus = ReportStatus.ACTIONED
        break
      case 'SUSPENSION':
        if (!suspensionDays || suspensionDays < 1 || suspensionDays > 365) {
          return NextResponse.json(
            { error: 'Suspension requires suspensionDays between 1 and 365' },
            { status: 400 }
          )
        }
        newUserStatus = UserAccountStatus.SUSPENDED
        newReportStatus = ReportStatus.ACTIONED
        suspendedUntil = new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000)
        break
      case 'BAN':
        newUserStatus = UserAccountStatus.BANNED
        newReportStatus = ReportStatus.ACTIONED
        break
      case 'DISMISS':
        newReportStatus = ReportStatus.DISMISSED
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Perform the update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the report
      const updatedReport = await tx.userReport.update({
        where: { id },
        data: {
          status: newReportStatus,
          actionTaken: action as ModerationAction,
          resolutionNotes: notes?.trim() || null,
          resolvedAt: new Date(),
          resolvedBy: adminUserId,
        },
      })

      // Update user status if action taken
      if (newUserStatus) {
        await tx.user.update({
          where: { id: report.reportedUserId },
          data: {
            accountStatus: newUserStatus,
            suspendedUntil,
          },
        })
      }

      // Create moderation log entry
      await tx.moderationLog.create({
        data: {
          targetUserId: report.reportedUserId,
          adminUserId,
          action: action as ModerationAction,
          reason: notes?.trim() || null,
          reportId: report.id,
          suspensionDays: action === 'SUSPENSION' ? suspensionDays : null,
          suspendedUntil,
          previousStatus: report.reportedUser.accountStatus,
        },
      })

      return updatedReport
    })

    return NextResponse.json({
      report: {
        id: result.id,
        status: result.status,
        actionTaken: result.actionTaken,
        resolvedAt: result.resolvedAt?.toISOString() || null,
      },
      message: `Report ${action === 'DISMISS' ? 'dismissed' : 'actioned'} successfully`,
    })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
