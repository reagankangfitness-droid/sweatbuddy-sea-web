import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Leave a crew
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

    const membership = await prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId, userId: dbUser.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this crew' }, { status: 400 })
    }

    const isLeader = membership.role === 'LEADER'

    // Get all other members
    const otherMembers = await prisma.crewMember.findMany({
      where: { crewId, userId: { not: dbUser.id } },
      orderBy: { joinedAt: 'asc' },
    })

    if (isLeader && otherMembers.length > 0) {
      // Promote the oldest member to LEADER, then remove current user
      await prisma.$transaction([
        prisma.crewMember.update({
          where: { id: otherMembers[0].id },
          data: { role: 'LEADER' },
        }),
        prisma.crewMember.delete({
          where: { id: membership.id },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Left crew. Leadership transferred.',
        newLeaderId: otherMembers[0].userId,
      })
    }

    if (otherMembers.length === 0) {
      // Last member leaving - deactivate the crew
      await prisma.$transaction([
        prisma.crewMember.delete({
          where: { id: membership.id },
        }),
        prisma.crew.update({
          where: { id: crewId },
          data: { isActive: false },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Left crew. Crew has been deactivated (no remaining members).',
      })
    }

    // Regular member leaving
    await prisma.crewMember.delete({
      where: { id: membership.id },
    })

    return NextResponse.json({ success: true, message: 'Left crew.' })
  } catch (error) {
    console.error('[crews/[id]/leave] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
