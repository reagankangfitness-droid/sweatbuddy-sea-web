import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await params

    // Prevent blocking yourself
    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already blocked
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: currentUserId,
          blockedUserId: targetUserId,
        },
      },
    })

    if (existingBlock) {
      return NextResponse.json({ error: 'User already blocked' }, { status: 409 })
    }

    // Create the block
    const block = await prisma.userBlock.create({
      data: {
        blockerId: currentUserId,
        blockedUserId: targetUserId,
      },
    })

    return NextResponse.json({ block, message: 'User blocked successfully' }, { status: 201 })
  } catch (error) {
    console.error('Block user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await params

    // Check if block exists
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: currentUserId,
          blockedUserId: targetUserId,
        },
      },
    })

    if (!existingBlock) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    // Delete the block
    await prisma.userBlock.delete({
      where: {
        blockerId_blockedUserId: {
          blockerId: currentUserId,
          blockedUserId: targetUserId,
        },
      },
    })

    return NextResponse.json({ message: 'User unblocked successfully' })
  } catch (error) {
    console.error('Unblock user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await params

    // Check if current user has blocked the target user
    const block = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: currentUserId,
          blockedUserId: targetUserId,
        },
      },
    })

    return NextResponse.json({ isBlocked: !!block })
  } catch (error) {
    console.error('Check block status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
