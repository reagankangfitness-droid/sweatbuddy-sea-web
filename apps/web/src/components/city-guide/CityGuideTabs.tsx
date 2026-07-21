import Link from 'next/link'
import { CalendarDays, Map, MapPin, Users } from 'lucide-react'

type CityGuideTab = 'places' | 'events' | 'communities' | 'map'

function getTabs(citySlug?: string): Array<{
  id: CityGuideTab
  label: string
  href: string
  icon: typeof MapPin
}> {
  const cityQuery = citySlug ? `city=${encodeURIComponent(citySlug)}` : 'location=nearby'
  const guideHref = citySlug ? `/${citySlug}` : '/singapore'

  return [
    { id: 'events', label: 'Plans', href: `/buddy?${cityQuery}`, icon: CalendarDays },
    { id: 'map', label: 'Map', href: `/buddy?view=map&${cityQuery}`, icon: Map },
    {
      id: 'communities',
      label: 'Crews',
      href: citySlug ? `/communities?city=${encodeURIComponent(citySlug)}` : '/communities',
      icon: Users,
    },
    { id: 'places', label: 'Guide', href: guideHref, icon: MapPin },
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
      className="border-b border-white/10 bg-[#0B0B0B]/96 backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3 sm:flex sm:overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-11 min-w-0 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-xs font-black uppercase tracking-wide transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'border border-white/12 text-white/62 hover:border-[#63FF8F] hover:text-[#63FF8F]'
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
