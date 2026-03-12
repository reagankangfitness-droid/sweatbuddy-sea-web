import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) return <>{children}</>

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress
  if (!email) return <>{children}</>

  const user = await prisma.user.findUnique({
    where: { email },
    select: { accountStatus: true },
  })

  if (user?.accountStatus === 'BANNED') {
    redirect('/banned')
  }

  return <>{children}</>
}
