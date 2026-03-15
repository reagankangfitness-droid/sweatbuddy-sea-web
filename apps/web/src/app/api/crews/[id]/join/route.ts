import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'

// POST - Join a crew
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: crewId } = await params

    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        _count: { select: { members: true } },
      },
    })

    if (!crew) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }

    if (!crew.isActive) {
      return NextResponse.json({ error: 'Crew is no longer active' }, { status: 400 })
    }

    // Check if already a member
    const existing = await prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId: dbUser.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already a member of this crew' }, { status: 409 })
    }

    // Check if crew is full
    if (crew._count.members >= crew.maxMembers) {
      return NextResponse.json({ error: 'Crew is full' }, { status: 400 })
    }

    const member = await prisma.crewMember.create({
      data: {
        crewId,
        userId: dbUser.id,
        role: 'MEMBER',
      },
    })

    // Check if crew leader should get badge (3+ members)
    const newMemberCount = crew._count.members + 1
    if (newMemberCount >= 3) {
      checkAndAwardBadges(crew.createdById).catch(() => {})
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('[crews/[id]/join] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
