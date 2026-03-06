import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ScrollAnimator } from './ScrollAnimator'

const findSteps = [
  { num: '1', title: 'Browse', desc: 'Find events by activity, date, or location.' },
  { num: '2', title: 'RSVP', desc: 'Reserve your spot in one tap — free or paid.' },
  { num: '3', title: 'Keep coming back', desc: 'Save favourites, follow hosts, build your routine.' },
]

const hostSteps = [
  { num: '1', title: 'Create', desc: 'Set up your event page in under 5 minutes.' },
  { num: '2', title: 'Grow', desc: 'Get AI-generated flyers, shareable links, and analytics.' },
  { num: '3', title: 'Get paid', desc: 'Collect payments through Stripe or PayNow.' },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-24 px-5 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollAnimator>
          <div className="text-center mb-12">
            <span className="inline-block px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Two ways to SweatBuddies
            </h2>
          </div>
        </ScrollAnimator>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find Events */}
          <ScrollAnimator delay={100}>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-8 h-full flex flex-col">
              <span className="inline-block w-fit px-2.5 py-1 bg-neutral-100 rounded-md text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-5">
                Find Events
              </span>

              <div className="space-y-5 flex-1">
                {findSteps.map((step) => (
                  <div key={step.num} className="flex gap-3.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                      {step.num}
                    </span>
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm">{step.title}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/events"
                className="mt-7 inline-flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 text-white text-sm font-semibold rounded-md hover:bg-neutral-700 transition-colors"
              >
                Browse events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollAnimator>

          {/* Host Events */}
          <ScrollAnimator delay={200}>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-8 h-full flex flex-col">
              <span className="inline-block w-fit px-2.5 py-1 bg-neutral-100 rounded-md text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-5">
                Host Events
              </span>

              <div className="space-y-5 flex-1">
                {hostSteps.map((step) => (
                  <div key={step.num} className="flex gap-3.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                      {step.num}
                    </span>
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm">{step.title}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/host"
                className="mt-7 inline-flex items-center justify-center gap-2 w-full py-3 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-md hover:bg-neutral-50 transition-colors"
              >
                Start hosting — free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollAnimator>
        </div>
      </div>
    </section>
  )
}
