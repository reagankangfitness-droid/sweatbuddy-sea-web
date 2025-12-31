import { SocialProofStats } from '@/lib/events'

interface SocialProofBarProps {
  stats: SocialProofStats
}

export function SocialProofBar({ stats }: SocialProofBarProps) {
  const { peopleMovedThisWeek, eventsLive, activeHosts } = stats

  // Don't show if all stats are 0
  if (peopleMovedThisWeek === 0 && eventsLive === 0 && activeHosts === 0) {
    return null
  }

  return (
    <div className="w-full bg-neutral-50 py-3">
      <p className="text-center text-sm text-neutral-500">
        {activeHosts > 0 && (
          <>{activeHosts} host{activeHosts !== 1 ? 's' : ''} building crews</>
        )}
        {activeHosts > 0 && eventsLive > 0 && ' · '}
        {eventsLive > 0 && (
          <>{eventsLive} open workout{eventsLive !== 1 ? 's' : ''}</>
        )}
        {eventsLive > 0 && peopleMovedThisWeek > 0 && ' · '}
        {peopleMovedThisWeek > 0 && (
          <>{peopleMovedThisWeek.toLocaleString()} people showed up this week</>
        )}
      </p>
    </div>
  )
}
