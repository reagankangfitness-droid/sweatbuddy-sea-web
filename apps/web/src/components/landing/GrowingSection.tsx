import { ScrollAnimator } from './ScrollAnimator'

interface GrowingSectionProps {
  hostCount: number
}

export function GrowingSection({ hostCount }: GrowingSectionProps) {
  const displayHosts = hostCount >= 50 ? `${hostCount}+` : '50+'

  return (
    <section className="py-20 sm:py-24 px-5 bg-neutral-50">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollAnimator>
          <div className="grid grid-cols-3 gap-6 sm:gap-10 mb-8">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">{displayHosts}</p>
              <p className="text-sm text-neutral-500 mt-1">Hosts</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">100+</p>
              <p className="text-sm text-neutral-500 mt-1">Events listed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">7</p>
              <p className="text-sm text-neutral-500 mt-1">Categories</p>
            </div>
          </div>
        </ScrollAnimator>

        <ScrollAnimator delay={100}>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Growing every week. New hosts, new events, new communities joining from across Singapore.
          </p>
        </ScrollAnimator>
      </div>
    </section>
  )
}
