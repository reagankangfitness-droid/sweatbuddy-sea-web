import Link from 'next/link'
import { CalendarDays, Map, Users } from 'lucide-react'

type CityGuideTab = 'places' | 'events' | 'communities' | 'map'

function getTabs(citySlug?: string): Array<{
  id: CityGuideTab
  label: string
  href: string
  icon: typeof Users
}> {
  const cityQuery = citySlug ? `city=${encodeURIComponent(citySlug)}` : 'location=nearby'

  return [
    {
      id: 'communities',
      label: 'Communities',
      href: citySlug ? `/communities?city=${encodeURIComponent(citySlug)}` : '/communities',
      icon: Users,
    },
    { id: 'events', label: 'Plans', href: `/buddy?view=list&${cityQuery}`, icon: CalendarDays },
    { id: 'map', label: 'Map', href: `/buddy?view=map&${cityQuery}`, icon: Map },
  ]
}

export function CityGuideTabs({
  active,
  citySlug,
}: {
  active: CityGuideTab
  citySlug?: string
}) {
  const tabs = getTabs(citySlug)

  return (
    <nav
      aria-label="Discovery sections"
      className="border-b border-white/[0.07] bg-[#0B0B0B]/94 backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-1.5 px-4 py-2.5 sm:flex sm:overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-11 min-w-0 shrink-0 items-center justify-center gap-1 rounded-full px-1.5 text-[9px] font-black uppercase tracking-wide transition-colors sm:gap-2 sm:px-3 sm:text-[10px] ${
                isActive
                  ? 'bg-white text-black'
                  : 'border border-white/10 text-white/58 hover:border-white/28 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
