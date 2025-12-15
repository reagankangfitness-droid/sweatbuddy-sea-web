import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, instagramHandle, name } = await request.json()

    // Validate required fields
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    if (!instagramHandle) {
      return NextResponse.json(
        { error: 'Instagram handle required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    // Remove @ if user included it
    const normalizedHandle = instagramHandle.replace(/^@/, '').toLowerCase().trim()

    // Check if organizer already exists with this email
    const existingByEmail = await prisma.organizer.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'An organizer with this email already exists' },
        { status: 409 }
      )
    }

    // Check if organizer already exists with this Instagram handle
    const existingByInstagram = await prisma.organizer.findUnique({
      where: { instagramHandle: normalizedHandle },
    })

    if (existingByInstagram) {
      return NextResponse.json(
        { error: 'This Instagram handle is already registered' },
        { status: 409 }
      )
    }

    // Create the organizer
    const organizer = await prisma.organizer.create({
      data: {
        email: normalizedEmail,
        instagramHandle: normalizedHandle,
        name: name?.trim() || null,
        isVerified: true, // Auto-verified in MVP (honor system)
      },
    })

    return NextResponse.json({
      success: true,
      organizer: {
        id: organizer.id,
        email: organizer.email,
        instagramHandle: organizer.instagramHandle,
        name: organizer.name,
        isVerified: organizer.isVerified,
      },
    })
  } catch (error) {
    console.error('Organizer registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register organizer' },
      { status: 500 }
    )
  }
}
