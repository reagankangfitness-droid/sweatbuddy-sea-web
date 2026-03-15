import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - Get crew details with members list
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const crew = await prisma.crew.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, imageUrl: true },
        },
        members: {
          include: {
            // "crew" field on CrewMember is the User relation
            crew: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true } },
      },
    })

    if (!crew) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: crew.id,
      name: crew.name,
      description: crew.description,
      imageUrl: crew.imageUrl,
      activityType: crew.activityType,
      maxMembers: crew.maxMembers,
      isActive: crew.isActive,
      createdAt: crew.createdAt,
      createdBy: crew.createdBy,
      memberCount: crew._count.members,
      members: crew.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.crew.name,
        imageUrl: m.crew.imageUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    })
  } catch (error) {
    console.error('[crews/[id]] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update crew (name, description, imageUrl, maxMembers)
// Auth: Must be crew LEADER
export async function PATCH(
  req: NextRequest,
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

    const { id } = await params

    // Check user is a LEADER of this crew
    const membership = await prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId: id, userId: dbUser.id } },
    })
    if (!membership || membership.role !== 'LEADER') {
      return NextResponse.json({ error: 'Only crew leaders can update the crew' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, imageUrl, maxMembers } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
      }
      data.name = name.trim()
    }
    if (description !== undefined) {
      data.description = description?.trim() || null
    }
    if (imageUrl !== undefined) {
      data.imageUrl = imageUrl || null
    }
    if (maxMembers !== undefined) {
      data.maxMembers = Math.max(2, Math.min(50, parseInt(maxMembers)))
    }

    const crew = await prisma.crew.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, imageUrl: true },
        },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({ crew })
  } catch (error) {
    console.error('[crews/[id]] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete crew
// Auth: Must be crew LEADER
export async function DELETE(
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

    const { id } = await params

    // Check user is a LEADER of this crew
    const membership = await prisma.crewMember.findUnique({
      where: { crewId_userId: { crewId: id, userId: dbUser.id } },
    })
    if (!membership || membership.role !== 'LEADER') {
      return NextResponse.json({ error: 'Only crew leaders can delete the crew' }, { status: 403 })
    }

    await prisma.crew.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[crews/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
