import Link from 'next/link'
import { ScrollAnimator } from './ScrollAnimator'

const categories = [
  { label: 'Running', param: 'running' },
  { label: 'HIIT', param: 'hiit' },
  { label: 'Yoga', param: 'yoga' },
  { label: 'Strength', param: 'strength' },
  { label: 'Social', param: 'social' },
  { label: 'Pilates', param: 'pilates' },
  { label: 'Calisthenics', param: 'calisthenics' },
]

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-5 bg-neutral-50 overflow-hidden">
      {/* Gradient fade to white at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, white)' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <ScrollAnimator>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Live events this week in Singapore
            </span>
          </div>
        </ScrollAnimator>

        {/* H1 */}
        <ScrollAnimator delay={100}>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-neutral-900 mb-5">
            Your city&apos;s fitness community,{' '}
            <span className="text-neutral-500 italic">all in one place</span>
          </h1>
        </ScrollAnimator>

        {/* Subtitle */}
        <ScrollAnimator delay={200}>
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed max-w-xl mx-auto mb-8">
            Discover group runs, yoga sessions, and bootcamps happening near you.
            Or start hosting your own.
          </p>
        </ScrollAnimator>

        {/* CTAs */}
        <ScrollAnimator delay={300}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/events"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-neutral-900 text-white font-semibold text-sm rounded-md hover:bg-neutral-700 transition-colors"
            >
              Find events near me
            </Link>
            <Link
              href="/host"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-neutral-300 text-neutral-700 font-semibold text-sm rounded-md hover:bg-neutral-100 transition-colors"
            >
              Start hosting
            </Link>
          </div>
        </ScrollAnimator>

        {/* Category pills */}
        <ScrollAnimator delay={400}>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.param}
                href={`/events?cat=${cat.param}`}
                className="px-3.5 py-1.5 bg-white border border-neutral-200 rounded-full text-xs font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </ScrollAnimator>
      </div>
    </section>
  )
}
