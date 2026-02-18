import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const attendeePerks = [
  'Discover events happening around you',
  'RSVP in seconds',
  'Show up and connect',
  'Track your journey',
]

const hostPerks = [
  'Create events in minutes',
  'Manage RSVPs and attendance',
  'Grow your community',
  'Analytics that help you scale',
]

export function DualPathSection() {
  return (
    <section className="py-24 px-5 bg-dark text-center">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="font-sans text-label tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
            Choose Your Path
          </div>
          <h2 className="font-sans text-display font-extrabold tracking-[-0.02em] leading-[1.15] mb-12 text-white">
            Whether you&apos;re joining or leading, we&apos;ve got you
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendee card */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-8 py-10 text-left">
              <h3 className="font-sans text-heading-xl font-bold text-brand-blue-glow mb-6">
                Find Your Crew
              </h3>
              <ul className="space-y-4 mb-8">
                {attendeePerks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-300 text-body">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue-glow text-caption font-bold">
                      {i + 1}
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up?intent=rsvp"
                className="inline-flex items-center gap-2 bg-brand-blue text-white px-8 py-3 rounded-full font-sans font-semibold text-body transition-all duration-300 hover:bg-brand-blue-dark hover:-translate-y-0.5 hover:shadow-md"
              >
                Browse Events
              </Link>
            </div>

            {/* Host card */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-8 py-10 text-left">
              <h3 className="font-sans text-heading-xl font-bold text-emerald-500 mb-6">
                Lead the Movement
              </h3>
              <ul className="space-y-4 mb-8">
                {hostPerks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-300 text-body">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-caption font-bold">
                      {i + 1}
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up?intent=host"
                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-8 py-3 rounded-full font-sans font-semibold text-body transition-all duration-300 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-md"
              >
                Start Hosting
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
