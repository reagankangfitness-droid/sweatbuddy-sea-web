import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { MiniDashboard } from './MiniDashboard'
import { ScrollAnimator } from './ScrollAnimator'

const features = [
  'Event creation in minutes',
  'RSVP tracking & attendee management',
  'Payments via Stripe & PayNow',
  'Analytics & insights',
  'AI-generated flyers',
]

export function HostCTASection() {
  return (
    <section id="host" className="py-20 sm:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimator>
          <div className="bg-neutral-900 rounded-2xl p-5 sm:p-12 overflow-hidden relative">
            {/* Subtle glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #737373, transparent 70%)' }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left: Text */}
              <div className="flex-1">
                <span className="inline-block px-2.5 py-1 bg-white/10 rounded-md text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
                  For Hosts
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                  Got a community?{' '}
                  <span className="text-neutral-400">Grow it here.</span>
                </h2>
                <p className="text-neutral-400 leading-relaxed mb-6 max-w-md">
                  Everything you need to run fitness events — from creating your page
                  to collecting payments and tracking growth.
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-300">
                      <Check className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/host"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-neutral-900 font-semibold text-sm rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Start hosting — it&apos;s free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: Mini Dashboard (hidden on mobile) */}
              <div className="hidden lg:block flex-shrink-0">
                <MiniDashboard />
              </div>
            </div>
          </div>
        </ScrollAnimator>
      </div>
    </section>
  )
}
