import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkApiRateLimit } from '@/lib/rate-limit'
import { isAdminRequest } from '@/lib/admin-auth'

const ACTIONS = new Set(['JOINED', 'SWITCHED', 'CANCELLED', 'COMPARED', 'NONE'])
const TIMINGS = new Set(['LAST_MONTH', 'TWO_TO_THREE_MONTHS', 'FOUR_TO_SIX_MONTHS', 'OVER_SIX_MONTHS', 'NOT_APPLICABLE'])
const FREQUENCIES = new Set(['LESS_THAN_WEEKLY', 'ONE_TO_TWO', 'THREE_TO_FOUR', 'FIVE_PLUS'])
const PAYMENT_INTENT = new Set(['YES', 'MAYBE', 'NO'])

type Payload = Record<string, unknown>

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkApiRateLimit(request, 'api')
    if (rateLimited) return rateLimited

    const body = await request.json().catch(() => ({})) as Payload
    if (body.website) return NextResponse.json({ success: true })

    const name = text(body.name, 160)
    const email = normalizeEmail(body.email)
    const recentAction = enumValue(body.recentAction, ACTIONS)
    const actionTiming = enumValue(body.actionTiming, TIMINGS)
    const trainingFrequency = enumValue(body.trainingFrequency, FREQUENCIES)
    const paidReportIntent = enumValue(body.paidReportIntent, PAYMENT_INTENT)
    const trainingStyles = stringArray(body.trainingStyles, 10)
    const researchActions = stringArray(body.researchActions, 10)
    const informationGaps = stringArray(body.informationGaps, 10)
    const contributionIntent = stringArray(body.contributionIntent, 10)
    const researchConsent = body.researchConsent === true

    if (!name || !email) return NextResponse.json({ error: 'Name and a valid email are required' }, { status: 400 })
    if (!researchConsent) return NextResponse.json({ error: 'Research consent is required' }, { status: 400 })
    if (!recentAction || !actionTiming || !trainingFrequency || !paidReportIntent) {
      return NextResponse.json({ error: 'Please complete all required questions' }, { status: 400 })
    }
    if (!trainingStyles.length || !researchActions.length || !informationGaps.length) {
      return NextResponse.json({ error: 'Please complete all required selections' }, { status: 400 })
    }

    const recent = recentAction !== 'NONE' && actionTiming !== 'OVER_SIX_MONTHS' && actionTiming !== 'NOT_APPLICABLE'
    const meaningfulResearch = researchActions.some((value) => ['VISITED', 'CONTACTED', 'COMPARED_PRICES', 'ASKED_COMMUNITY'].includes(value))
    const eligibilityScore = Number(recent) * 2 + Number(meaningfulResearch) + Number(informationGaps.length >= 2)
    const qualified = recent && meaningfulResearch && eligibilityScore >= 3

    const response = await prisma.gymResearchResponse.upsert({
      where: { email },
      update: {
        name,
        phone: text(body.phone, 80),
        recentAction,
        actionTiming,
        gymsConsidered: text(body.gymsConsidered, 2000),
        currentGym: text(body.currentGym, 200),
        trainingFrequency,
        trainingStyles,
        researchActions,
        informationGaps,
        biggestSurprise: text(body.biggestSurprise, 2000),
        contributionIntent,
        paidReportIntent,
        interviewConsent: false,
        interviewAvailability: null,
        researchConsent,
        eligibilityScore,
        qualified,
        source: text(body.source, 120),
        utmSource: text(body.utmSource, 120),
        utmMedium: text(body.utmMedium, 120),
        utmCampaign: text(body.utmCampaign, 160),
      },
      create: {
        name,
        email,
        phone: text(body.phone, 80),
        recentAction,
        actionTiming,
        gymsConsidered: text(body.gymsConsidered, 2000),
        currentGym: text(body.currentGym, 200),
        trainingFrequency,
        trainingStyles,
        researchActions,
        informationGaps,
        biggestSurprise: text(body.biggestSurprise, 2000),
        contributionIntent,
        paidReportIntent,
        interviewConsent: false,
        interviewAvailability: null,
        researchConsent,
        eligibilityScore,
        qualified,
        source: text(body.source, 120),
        utmSource: text(body.utmSource, 120),
        utmMedium: text(body.utmMedium, 120),
        utmCampaign: text(body.utmCampaign, 160),
      },
      select: { id: true, qualified: true },
    })

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error('[gym-research POST]', error)
    return NextResponse.json({ error: 'Could not save your response' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const responses = await prisma.gymResearchResponse.findMany({ orderBy: { createdAt: 'desc' }, take: 250 })
  return NextResponse.json({ responses, total: responses.length })
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim()
  return clean ? clean.slice(0, max) : null
}

function normalizeEmail(value: unknown): string | null {
  const clean = text(value, 255)?.toLowerCase()
  return clean && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : null
}

function enumValue(value: unknown, allowed: Set<string>): string | null {
  if (typeof value !== 'string') return null
  return allowed.has(value) ? value : null
}

function stringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 80)))].slice(0, max)
}
