import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export interface CurrentDbUser {
  clerkUserId: string
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

export async function getCurrentDbUser(): Promise<CurrentDbUser | null> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase()
  if (!email) return null

  const name = clerkUser.fullName || clerkUser.firstName || null
  const imageUrl = clerkUser.imageUrl || null

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, imageUrl: true },
  })

  if (existing) {
    return { clerkUserId, ...existing }
  }

  const created = await prisma.user.create({
    data: {
      id: clerkUserId,
      email,
      name,
      imageUrl,
    },
    select: { id: true, email: true, name: true, imageUrl: true },
  })

  return { clerkUserId, ...created }
}
