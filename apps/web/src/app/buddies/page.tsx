import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Users } from 'lucide-react'
import { ACTIVITIES } from '@/lib/im-down/constants'
import type { ImDownActivity } from '@prisma/client'

export default async function BuddiesPage() {
  const { userId } = await auth()

  let matches: Array<{
    id: string
    activityType: ImDownActivity
    matchedAt: Date
    buddy: { name: string | null; imageUrl: string | null; firstName: string | null }
  }> = []

  if (userId) {
    const dbUser = await prisma.user.findFirst({ where: { id: userId } })
    if (dbUser) {
      const initiated = await prisma.buddyMatch.findMany({
        where: { initiatorId: dbUser.id },
        include: { recipient: { select: { name: true, imageUrl: true, firstName: true } } },
        orderBy: { matchedAt: 'desc' },
      })
      const received = await prisma.buddyMatch.findMany({
        where: { recipientId: dbUser.id },
        include: { initiator: { select: { name: true, imageUrl: true, firstName: true } } },
        orderBy: { matchedAt: 'desc' },
      })

      matches = [
        ...initiated.map((m) => ({
          id: m.id,
          activityType: m.activityType,
          matchedAt: m.matchedAt,
          buddy: m.recipient,
        })),
        ...received.map((m) => ({
          id: m.id,
          activityType: m.activityType,
          matchedAt: m.matchedAt,
          buddy: m.initiator,
        })),
      ].sort((a, b) => b.matchedAt.getTime() - a.matchedAt.getTime())
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Buddies</h1>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xs">
            No buddies yet. Set your status and match with nearby people!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const activity = ACTIVITIES[match.activityType]
            return (
              <div
                key={match.id}
                className="flex items-center gap-3 bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                  {match.buddy.imageUrl ? (
                    <img src={match.buddy.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">
                      {(match.buddy.firstName || match.buddy.name || '?')[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">
                    {match.buddy.firstName || match.buddy.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {activity.emoji} {activity.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
