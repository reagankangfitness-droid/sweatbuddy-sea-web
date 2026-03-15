import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List crews (optionally filter by activityType, or get "my crews")
// Query params: ?mine=true | ?activityType=running | ?page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mine = searchParams.get('mine') === 'true'
    const activityType = searchParams.get('activityType')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true }

    if (mine) {
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
      where.members = { some: { userId: dbUser.id } }
    }

    if (activityType) {
      where.activityType = activityType
    }

    const [crews, total] = await Promise.all([
      prisma.crew.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, imageUrl: true },
          },
          members: {
            include: {
              // "crew" field on CrewMember is actually the User relation
              crew: {
                select: { id: true, name: true, imageUrl: true },
              },
            },
            take: 5,
            orderBy: { joinedAt: 'asc' },
          },
          _count: { select: { members: true } },
        },
      }),
      prisma.crew.count({ where }),
    ])

    const result = crews.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      activityType: c.activityType,
      maxMembers: c.maxMembers,
      isActive: c.isActive,
      createdAt: c.createdAt,
      createdBy: c.createdBy,
      memberCount: c._count.members,
      memberPreviews: c.members.map((m) => ({
        userId: m.userId,
        name: m.crew.name,
        imageUrl: m.crew.imageUrl,
        role: m.role,
      })),
    }))

    return NextResponse.json({
      crews: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[crews] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new crew
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { name, description, activityType, imageUrl, maxMembers } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    const crew = await prisma.crew.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        activityType: activityType?.trim() || null,
        imageUrl: imageUrl || null,
        maxMembers: maxMembers ? Math.max(2, Math.min(50, parseInt(maxMembers))) : 8,
        createdById: dbUser.id,
        members: {
          create: {
            userId: dbUser.id,
            role: 'LEADER',
          },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, imageUrl: true },
        },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({ crew }, { status: 201 })
  } catch (error) {
    console.error('[crews] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
