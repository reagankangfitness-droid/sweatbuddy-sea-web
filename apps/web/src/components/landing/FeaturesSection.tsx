import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { DashboardMockEventManager } from './DashboardMockEventManager'
import { DashboardMockCommunity } from './DashboardMockCommunity'
import { DashboardMockAnalytics } from './DashboardMockAnalytics'

const features = [
  {
    title: 'Manage events without the chaos',
    description: "Create, duplicate, and manage recurring sessions from one clean dashboard. See who's coming, who cancelled, and what's next — at a glance.",
    bullets: [
      'One-click recurring event creation',
      'Real-time RSVP tracking',
      'Automated waitlist management',
    ],
    mock: <DashboardMockEventManager />,
  },
  {
    title: 'Know your community like never before',
    description: "See who your most loyal members are, who's slipping away, and who just discovered you. Turn attendance data into real relationships.",
    bullets: [
      'Member profiles with attendance history',
      'Engagement scoring & churn alerts',
      'Segmented communication tools',
    ],
    mock: <DashboardMockCommunity />,
  },
  {
    title: 'Data that actually helps you grow',
    description: 'Stop guessing. See exactly which sessions are thriving, when your peak attendance is, and how your community is trending week over week.',
    bullets: [
      'Attendance trends & growth charts',
      'Revenue tracking & projections',
      'Session performance comparisons',
    ],
    mock: <DashboardMockAnalytics />,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-5 relative bg-gradient-to-b from-dark to-dark-card/30">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="font-sans text-label tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
              Your Dashboard
            </div>
            <h2 className="font-sans text-display font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
            <p className="text-body-lg text-neutral-400 leading-relaxed max-w-[580px] mx-auto">
              A purpose-built dashboard designed for fitness entrepreneurs — not generic SaaS.
            </p>
          </div>
        </ScrollReveal>

        {features.map((feature, index) => (
          <ScrollReveal key={feature.title}>
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 last:mb-0 ${
                index % 2 === 1 ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''
              }`}
            >
              {/* Text */}
              <div>
                <h3 className="font-sans text-heading-xl font-bold mb-3 leading-tight text-white">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 text-body leading-relaxed mb-5">
                  {feature.description}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-body-sm text-neutral-300">
                      <span className="text-emerald-500 font-bold mt-px">✓</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mock */}
              <div>{feature.mock}</div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
