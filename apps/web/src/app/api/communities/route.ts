import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueSlug, updateCommunityMemberCount } from '@/lib/community-system'

// GET /api/communities - List communities
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const owned = searchParams.get('owned') === 'true'
    const joined = searchParams.get('joined') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // If owned or joined filter, require authentication
    if ((owned || joined) && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle owned communities (communities user created)
    if (owned && userId) {
      const communities = await prisma.community.findMany({
        where: { createdById: userId },
        include: {
          city: true,
          _count: {
            select: {
              members: true,
              activities: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        communities: communities.map((c) => ({
          ...c,
          memberCount: c._count.members,
          eventCount: c._count.activities,
        })),
      })
    }

    // Handle joined communities (communities user is a member of)
    if (joined && userId) {
      const memberships = await prisma.communityMember.findMany({
        where: { userId },
        include: {
          community: {
            include: {
              city: true,
              _count: {
                select: {
                  members: true,
                  activities: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      })

      return NextResponse.json({
        communities: memberships.map((m) => ({
          ...m.community,
          memberCount: m.community._count.members,
          eventCount: m.community._count.activities,
          role: m.role,
        })),
      })
    }

    // Default: list all public communities
    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (city) {
      const cityRecord = await prisma.city.findUnique({
        where: { slug: city },
      })
      if (cityRecord) {
        where.cityId = cityRecord.id
      }
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          city: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true,
              imageUrl: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              members: true,
              activities: true,
            },
          },
        },
        orderBy: { memberCount: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.community.count({ where }),
    ])

    return NextResponse.json({
      communities,
      total,
      hasMore: offset + communities.length < total,
    })
  } catch (error) {
    console.error('List communities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/communities - Create a community
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      city: cityName,
      citySlug,
      privacy = 'PUBLIC',
      instagramHandle,
      websiteUrl,
      communityLink,
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    // Get city if provided (by slug or by name)
    let cityId: string | null = null
    if (citySlug) {
      const city = await prisma.city.findUnique({
        where: { slug: citySlug },
      })
      if (city) {
        cityId = city.id
      }
    } else if (cityName) {
      const city = await prisma.city.findFirst({
        where: { name: cityName },
      })
      if (city) {
        cityId = city.id
      }
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name)

    // Create community with owner as first member
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description,
        category,
        cityId,
        privacy,
        instagramHandle,
        websiteUrl,
        communityLink,
        createdById: userId,
        memberCount: 1,
      },
      include: {
        city: true,
      },
    })

    // Add creator as OWNER
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: 'OWNER',
      },
    })

    // Create community chat
    await prisma.communityChat.create({
      data: {
        communityId: community.id,
      },
    })

    // Update city community count
    if (cityId) {
      await prisma.city.update({
        where: { id: cityId },
        data: { communityCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ community }, { status: 201 })
  } catch (error) {
    console.error('Create community error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
