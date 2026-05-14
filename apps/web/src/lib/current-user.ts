import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export interface CurrentDbUser {
  clerkUserId: string
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

const currentUserSelect = {
  id: true,
  clerkUserId: true,
  email: true,
  name: true,
  imageUrl: true,
} as const

export async function getCurrentDbUser(): Promise<CurrentDbUser | null> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase()
  if (!email) return null

  const name = clerkUser.fullName || clerkUser.firstName || null
  const imageUrl = clerkUser.imageUrl || null

  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkUserId },
    select: currentUserSelect,
  })

  if (existingByClerkId) {
    return {
      clerkUserId,
      id: existingByClerkId.id,
      email: existingByClerkId.email,
      name: existingByClerkId.name,
      imageUrl: existingByClerkId.imageUrl,
    }
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: currentUserSelect,
  })

  if (existingByEmail) {
    if (existingByEmail.clerkUserId && existingByEmail.clerkUserId !== clerkUserId) {
      return null
    }

    const linked = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { clerkUserId },
      select: currentUserSelect,
    })

    return {
      clerkUserId,
      id: linked.id,
      email: linked.email,
      name: linked.name,
      imageUrl: linked.imageUrl,
    }
  }

  const created = await prisma.user.create({
    data: {
      id: clerkUserId,
      clerkUserId,
      email,
      name,
      imageUrl,
    },
    select: currentUserSelect,
  })

  return {
    clerkUserId,
    id: created.id,
    email: created.email,
    name: created.name,
    imageUrl: created.imageUrl,
  }
}
