import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { discoverSessionsFromSource } from '@/lib/discovery'

function jsonInput(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined
  return value as Prisma.InputJsonValue
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const source = await prisma.discoverySource.findUnique({ where: { id } })
  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  }

  try {
    const candidates = await discoverSessionsFromSource(source)
    const saved = []

    for (const candidate of candidates) {
      const session = await prisma.discoveredSession.upsert({
        where: {
          sourceId_sourceUrl: {
            sourceId: source.id,
            sourceUrl: candidate.sourceUrl,
          },
        },
        update: {
          title: candidate.title,
          description: candidate.description,
          category: candidate.category,
          city: candidate.city,
          location: candidate.location,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          timezone: candidate.timezone,
          price: candidate.price,
          currency: candidate.currency,
          signupUrl: candidate.signupUrl,
          imageUrl: candidate.imageUrl,
          hostName: candidate.hostName,
          communityName: candidate.communityName,
          confidence: candidate.confidence,
          rawData: jsonInput(candidate.rawData),
          status: 'PENDING',
        },
        create: {
          sourceId: source.id,
          title: candidate.title,
          description: candidate.description,
          category: candidate.category,
          city: candidate.city,
          location: candidate.location,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          timezone: candidate.timezone,
          price: candidate.price,
          currency: candidate.currency,
          signupUrl: candidate.signupUrl,
          sourceUrl: candidate.sourceUrl,
          imageUrl: candidate.imageUrl,
          hostName: candidate.hostName,
          communityName: candidate.communityName,
          confidence: candidate.confidence,
          rawData: jsonInput(candidate.rawData),
        },
      })
      saved.push(session)
    }

    await prisma.discoverySource.update({
      where: { id: source.id },
      data: {
        status: 'ACTIVE',
        lastCheckedAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
      },
    })

    return NextResponse.json({
      scanned: candidates.length,
      saved: saved.length,
      sessions: saved,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed'
    await prisma.discoverySource.update({
      where: { id: source.id },
      data: {
        status: 'ERROR',
        lastCheckedAt: new Date(),
        lastError: message,
      },
    })

    console.error('Discovery scan error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
