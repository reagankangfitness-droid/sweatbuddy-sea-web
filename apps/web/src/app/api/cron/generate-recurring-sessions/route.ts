import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCronSecret } from '@/lib/cron-auth'

export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
}

const SGT_OFFSET = 8

function getNextDates(dayOfWeek: number, startTime: string, fromDate: Date, count: number): Date[] {
  const dates: Date[] = []
  const [hours, minutes] = startTime.split(':').map(Number)
  const sgtNow = new Date(fromDate.getTime() + SGT_OFFSET * 60 * 60 * 1000)
  const currentDayOfWeek = sgtNow.getUTCDay()

  let daysUntil = dayOfWeek - currentDayOfWeek
  if (daysUntil < 0) daysUntil += 7
  if (daysUntil === 0) {
    const todaySGT = new Date(Date.UTC(sgtNow.getUTCFullYear(), sgtNow.getUTCMonth(), sgtNow.getUTCDate(), hours - SGT_OFFSET, minutes))
    if (todaySGT.getTime() <= fromDate.getTime()) daysUntil = 7
  }

  for (let i = 0; i < count; i++) {
    const targetDaysFromNow = daysUntil + i * 7
    const targetDateSGT = new Date(sgtNow.getUTCFullYear(), sgtNow.getUTCMonth(), sgtNow.getUTCDate() + targetDaysFromNow)
    const utcDate = new Date(Date.UTC(targetDateSGT.getFullYear(), targetDateSGT.getMonth(), targetDateSGT.getDate(), hours - SGT_OFFSET, minutes))
    dates.push(utcDate)
  }
  return dates
}

function toSGTDateString(utcDate: Date): string {
  const sgt = new Date(utcDate.getTime() + SGT_OFFSET * 60 * 60 * 1000)
  return sgt.toISOString().split('T')[0]
}

/**
 * GET /api/cron/generate-recurring-sessions
 * Called daily by Vercel cron. Generates Activity records from active SessionTemplates
 * for the next 4 weeks (next 4 occurrences of each day-of-week).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '') || ''
    if (!CRON_SECRET || !isValidCronSecret(providedSecret, CRON_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all active templates (not soft-deleted)
    const templates = await prisma.sessionTemplate.findMany({
      where: { isActive: true, deletedAt: null },
    })

    let totalGenerated = 0
    let templatesDeactivated = 0
    const errors: string[] = []

    for (const template of templates) {
      try {
        // Auto-deactivate templates past their end date
        if (template.endDate && template.endDate < now) {
          await prisma.sessionTemplate.update({
            where: { id: template.id },
            data: { isActive: false },
          })
          templatesDeactivated++
          continue
        }

        // For each day in daysOfWeek, find the next 4 occurrences
        const datesToGenerate: Date[] = []
        for (const dayName of template.daysOfWeek) {
          const dayNum = DAY_MAP[dayName]
          if (dayNum === undefined) continue
          const dates = getNextDates(dayNum, template.startTime, now, 4)
          datesToGenerate.push(...dates)
        }

        // Filter out dates past endDate
        const filteredDates = datesToGenerate.filter((d) => {
          if (template.endDate && d > template.endDate) return false
          // Filter out skipped dates
          const dateStr = toSGTDateString(d)
          if (template.skippedDates.includes(dateStr)) return false
          return true
        })

        // Check which dates already have an Activity for this template
        const existingActivities = await prisma.activity.findMany({
          where: {
            sessionTemplateId: template.id,
            startTime: { in: filteredDates },
            deletedAt: null,
          },
          select: { startTime: true },
        })

        const existingTimes = new Set(
          existingActivities.filter((a) => a.startTime !== null).map((a) => a.startTime!.getTime())
        )

        const newDates = filteredDates.filter((d) => !existingTimes.has(d.getTime()))

        // Map category to legacy type
        const typeMap: Record<string, string> = {
          running: 'RUN', gym: 'GYM', yoga: 'YOGA', hiking: 'HIKE', cycling: 'CYCLING',
        }
        const activityType = typeMap[template.categorySlug ?? ''] ?? 'OTHER'
        const activityMode = template.price && template.price > 0 ? 'P2P_PAID' : 'P2P_FREE'

        for (const startDate of newDates) {
          let endDate: Date | null = null
          if (template.endTime) {
            const [endH, endM] = template.endTime.split(':').map(Number)
            const [startH, startM] = template.startTime.split(':').map(Number)
            const durationMs = (endH * 60 + endM - (startH * 60 + startM)) * 60 * 1000
            if (durationMs > 0) endDate = new Date(startDate.getTime() + durationMs)
          }

          await prisma.activity.create({
            data: {
              title: template.title,
              description: template.description,
              type: activityType as never,
              categorySlug: template.categorySlug,
              city: template.city || template.address || 'Singapore',
              latitude: template.latitude ?? 1.3521,
              longitude: template.longitude ?? 103.8198,
              address: template.address,
              startTime: startDate,
              endTime: endDate,
              maxPeople: template.maxParticipants,
              price: template.price ?? 0,
              currency: template.currency,
              status: 'PUBLISHED',
              userId: template.hostId,
              hostId: template.hostId,
              sessionType: 'COMMUNITY',
              sessionTemplateId: template.id,
              fitnessLevel: template.fitnessLevel,
              whatToBring: template.whatToBring,
              imageUrl: template.imageUrl,
              activityMode,
              acceptPayNow: template.acceptPayNow,
              acceptStripe: template.acceptStripe,
              paynowQrImageUrl: template.paynowQrImageUrl,
              paynowPhoneNumber: template.paynowPhoneNumber,
              paynowName: template.paynowName,
              cancellationPolicy: template.cancellationPolicy,
            },
          })

          totalGenerated++
        }
      } catch (err) {
        const msg = `Template ${template.id}: ${err instanceof Error ? err.message : String(err)}`
        console.error(msg)
        errors.push(msg)
      }
    }

    return NextResponse.json({
      success: true,
      templatesProcessed: templates.length,
      templatesDeactivated,
      sessionsGenerated: totalGenerated,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Generate recurring sessions error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
