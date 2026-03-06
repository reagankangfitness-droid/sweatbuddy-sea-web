import { ScrollAnimator } from './ScrollAnimator'

const hosts = [
  { name: 'Singapore Frontrunners', type: 'Running', stat: '200+ members', initials: 'SF', bg: 'bg-blue-100 text-blue-700' },
  { name: 'run alone run club', type: 'Running', stat: 'Weekly runs', initials: 'RA', bg: 'bg-amber-100 text-amber-700' },
  { name: 'Caliversity', type: 'Calisthenics', stat: 'Outdoor sessions', initials: 'CA', bg: 'bg-green-100 text-green-700' },
  { name: 'Sunday Service', type: 'Social Runs', stat: 'Sunday mornings', initials: 'SS', bg: 'bg-purple-100 text-purple-700' },
  { name: 'SlowFlo RC', type: 'Running', stat: 'All paces welcome', initials: 'SF', bg: 'bg-rose-100 text-rose-700' },
]

export function HostsSection() {
  return (
    <section className="py-20 sm:py-24 px-5 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollAnimator>
          <div className="text-center mb-12">
            <span className="inline-block px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              The People Behind the Sweat
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Meet some of our hosts
            </h2>
          </div>
        </ScrollAnimator>

        {/* Host cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {hosts.map((host, i) => (
            <ScrollAnimator key={host.name} delay={i * 80}>
              <div className="bg-white rounded-xl border border-neutral-200 p-5 text-center hover:shadow-sm transition-all">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full ${host.bg} flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-sm font-bold">{host.initials}</span>
                </div>
                <h3 className="font-semibold text-sm text-neutral-900 leading-tight">{host.name}</h3>
                <p className="text-xs text-neutral-500 mt-1">{host.type}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{host.stat}</p>
              </div>
            </ScrollAnimator>
          ))}
        </div>
      </div>
    </section>
  )
}
