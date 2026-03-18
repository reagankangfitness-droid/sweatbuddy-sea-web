import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCronSecret } from '@/lib/cron-auth'

export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

// Map day names to JS day numbers (0=Sunday, 1=Monday, etc.)
const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

// Singapore UTC offset in hours
const SGT_OFFSET = 8

/**
 * For a given day-of-week number, find the next N dates starting from today.
 * Returns dates in UTC that correspond to the given local time in Singapore.
 */
function getNextDates(dayOfWeek: number, startTime: string, fromDate: Date, count: number): Date[] {
  const dates: Date[] = []
  const [hours, minutes] = startTime.split(':').map(Number)

  // Start from the beginning of "today" in Singapore time
  // We work in UTC but calculate what day it is in Singapore
  const now = fromDate

  // Current day of week in Singapore (UTC + 8)
  const sgtNow = new Date(now.getTime() + SGT_OFFSET * 60 * 60 * 1000)
  const currentDayOfWeek = sgtNow.getUTCDay()

  // Days until the target day
  let daysUntil = dayOfWeek - currentDayOfWeek
  if (daysUntil < 0) {
    daysUntil += 7
  }
  // If it's today, check if the time has already passed
  if (daysUntil === 0) {
    const todaySGT = new Date(
      Date.UTC(
        sgtNow.getUTCFullYear(),
        sgtNow.getUTCMonth(),
        sgtNow.getUTCDate(),
        hours - SGT_OFFSET,
        minutes
      )
    )
    if (todaySGT.getTime() <= now.getTime()) {
      daysUntil = 7
    }
  }

  for (let i = 0; i < count; i++) {
    const targetDaysFromNow = daysUntil + i * 7
    const targetDateSGT = new Date(
      sgtNow.getUTCFullYear(),
      sgtNow.getUTCMonth(),
      sgtNow.getUTCDate() + targetDaysFromNow
    )
    // Create UTC date adjusted for Singapore timezone
    const utcDate = new Date(
      Date.UTC(
        targetDateSGT.getFullYear(),
        targetDateSGT.getMonth(),
        targetDateSGT.getDate(),
        hours - SGT_OFFSET,
        minutes
      )
    )
    dates.push(utcDate)
  }

  return dates
}

/**
 * GET /api/cron/generate-recurring-sessions
 * Called daily by Vercel cron. Generates Activity records from active SessionTemplates
 * for the next 2 weeks (next 2 occurrences of each day-of-week).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '') || ''
    if (!CRON_SECRET || !isValidCronSecret(providedSecret, CRON_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // 1. Find all active session templates
    const templates = await prisma.sessionTemplate.findMany({
      where: { isActive: true },
    })

    let totalGenerated = 0
    const errors: string[] = []

    for (const template of templates) {
      try {
        // 2. For each day in daysOfWeek, find the next 2 occurrences
        const datesToGenerate: Date[] = []
        for (const dayName of template.daysOfWeek) {
          const dayNum = DAY_MAP[dayName]
          if (dayNum === undefined) continue
          const dates = getNextDates(dayNum, template.startTime, now, 2)
          datesToGenerate.push(...dates)
        }

        // 3. Check which dates already have an Activity for this template
        const existingActivities = await prisma.activity.findMany({
          where: {
            sessionTemplateId: template.id,
            startTime: { in: datesToGenerate },
            deletedAt: null,
          },
          select: { startTime: true },
        })

        const existingTimes = new Set(
          existingActivities
            .filter((a) => a.startTime !== null)
            .map((a) => a.startTime!.getTime())
        )

        // 4. Generate Activities for dates that don't already exist
        const newDates = datesToGenerate.filter(
          (d) => !existingTimes.has(d.getTime())
        )

        // Calculate endTime for each session if template has endTime
        for (const startDate of newDates) {
          let endDate: Date | null = null
          if (template.endTime) {
            const [endH, endM] = template.endTime.split(':').map(Number)
            const [startH, startM] = template.startTime.split(':').map(Number)
            const durationMs =
              (endH * 60 + endM - (startH * 60 + startM)) * 60 * 1000
            if (durationMs > 0) {
              endDate = new Date(startDate.getTime() + durationMs)
            }
          }

          await prisma.activity.create({
            data: {
              title: template.title,
              description: template.description,
              type: 'OTHER',
              categorySlug: template.categorySlug,
              city: template.address || 'Singapore',
              latitude: template.latitude ?? 1.3521,
              longitude: template.longitude ?? 103.8198,
              address: template.address,
              startTime: startDate,
              endTime: endDate,
              maxPeople: template.maxParticipants,
              price: template.price ?? 0,
              currency: template.currency,
              status: 'PUBLISHED',
              userId: template.coachId,
              hostId: template.coachId,
              sessionType: 'COACH_LED',
              sessionTemplateId: template.id,
              fitnessLevel: template.fitnessLevel,
              whatToBring: template.whatToBring,
              imageUrl: template.imageUrl,
              activityMode: template.price && template.price > 0 ? 'P2P_PAID' : 'P2P_FREE',
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
      sessionsGenerated: totalGenerated,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Generate recurring sessions error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
