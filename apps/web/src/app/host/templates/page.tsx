import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/current-user'
import { prisma } from '@/lib/prisma'
import RecurringSessionForm from './RecurringSessionForm'

export const metadata = {
  title: 'Recurring Schedule | SweatBuddies',
  description: 'Publish your community schedule once and keep upcoming sessions ready.',
}

export default async function HostTemplatesPage() {
  const user = await getCurrentDbUser()
  if (!user) redirect('/sign-in?redirect_url=/host/templates')

  const communities = await prisma.community.findMany({
    where: {
      isActive: true,
      OR: [
        { claimedById: user.id },
        { createdById: user.id },
        { members: { some: { userId: user.id, role: { in: ['OWNER', 'ADMIN'] } } } },
      ],
    },
    select: { id: true, name: true, category: true, usualArea: true },
    orderBy: { name: 'asc' },
  })
  if (communities.length === 0) redirect('/explore?claim=required')

  return <RecurringSessionForm communities={communities} />
}
