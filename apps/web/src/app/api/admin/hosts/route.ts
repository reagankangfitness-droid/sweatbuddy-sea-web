import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

// GET: List all hosts
export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get hosts from User table (isHost = true or has instagram)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { isHost: true },
          { instagram: { not: null } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        instagram: true,
        isHost: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Get hosts from Organizer table (legacy)
    const organizers = await prisma.organizer.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        instagramHandle: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      hosts: users,
      organizers,
    })
  } catch (error) {
    console.error('Error fetching hosts:', error)
    return NextResponse.json({ error: 'Failed to fetch hosts' }, { status: 500 })
  }
}

// POST: Create a new host account
export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, name, instagram } = body

    if (!email || !instagram) {
      return NextResponse.json(
        { error: 'Email and Instagram handle are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedInstagram = instagram.replace('@', '').trim()

    // Step 1: Create Clerk user (or check if exists)
    let clerkUserId: string | null = null
    let clerkUserExists = false

    if (CLERK_SECRET_KEY) {
      // Check if user exists in Clerk
      const checkRes = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(normalizedEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const existingUsers = await checkRes.json()

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        clerkUserId = existingUsers[0].id
        clerkUserExists = true
      } else {
        // Create new Clerk user
        const nameParts = (name || instagram).split(' ')
        const createRes = await fetch('https://api.clerk.com/v1/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: [normalizedEmail],
            first_name: nameParts[0] || instagram,
            last_name: nameParts.slice(1).join(' ') || '',
            skip_password_requirement: true,
          }),
        })

        const newUser = await createRes.json()

        if (newUser.id) {
          clerkUserId = newUser.id
        } else if (newUser.errors) {
          return NextResponse.json(
            { error: newUser.errors[0]?.message || 'Failed to create Clerk user' },
            { status: 400 }
          )
        }
      }
    }

    // Step 2: Create/update User in our database
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        instagram: normalizedInstagram,
        isHost: true,
        name: name || undefined,
        updatedAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        name: name || normalizedInstagram,
        instagram: normalizedInstagram,
        isHost: true,
      },
    })

    // Step 3: Create Organizer record (for legacy support)
    await prisma.organizer.upsert({
      where: { email: normalizedEmail },
      update: {
        instagramHandle: normalizedInstagram,
        name: name || normalizedInstagram,
        isVerified: true,
        updatedAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        instagramHandle: normalizedInstagram,
        name: name || normalizedInstagram,
        isVerified: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        instagram: user.instagram,
      },
      clerkUserId,
      clerkUserExists,
      message: clerkUserExists
        ? 'Host account updated (Clerk user already existed)'
        : 'Host account created successfully',
    })
  } catch (error) {
    console.error('Error creating host:', error)
    return NextResponse.json({ error: 'Failed to create host' }, { status: 500 })
  }
}
