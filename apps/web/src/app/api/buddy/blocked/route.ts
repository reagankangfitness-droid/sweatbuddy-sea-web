import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ blockedUserIds: [] })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ blockedUserIds: [] })
    }

    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: dbUser.id },
      select: { blockedUserId: true },
    })

    return NextResponse.json({ blockedUserIds: blocks.map((b) => b.blockedUserId) })
  } catch (error) {
    console.error('[buddy/blocked] Error:', error)
    return NextResponse.json({ blockedUserIds: [] })
  }
}
