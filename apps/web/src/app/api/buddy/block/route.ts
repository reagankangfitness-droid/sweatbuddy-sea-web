import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { blockedUserId } = body

    if (!blockedUserId) {
      return NextResponse.json({ error: 'blockedUserId is required' }, { status: 400 })
    }
    if (blockedUserId === dbUser.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Upsert — safe to call multiple times
    await prisma.userBlock.upsert({
      where: { blockerId_blockedUserId: { blockerId: dbUser.id, blockedUserId } },
      create: { blockerId: dbUser.id, blockedUserId },
      update: {},
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[buddy/block] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    const body = await request.json()
    const { blockedUserId } = body

    if (!blockedUserId) {
      return NextResponse.json({ error: 'blockedUserId is required' }, { status: 400 })
    }

    await prisma.userBlock.deleteMany({
      where: { blockerId: dbUser.id, blockedUserId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[buddy/block DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
