import { ScrollReveal } from '@/components/ui/ScrollReveal'

const painPoints = [
  {
    icon: '📋',
    title: 'Scattered across 5+ tools',
    description: 'Google Forms for signups, Telegram for updates, spreadsheets for tracking, Luma for events — nothing talks to each other.',
  },
  {
    icon: '👻',
    title: 'No-shows eat your energy',
    description: "People sign up but don't show. You have no easy way to send reminders, track attendance, or re-engage dropoffs.",
  },
  {
    icon: '📉',
    title: 'Zero visibility on growth',
    description: "You don't know your retention rate, your most popular sessions, or which members are about to churn — you're flying blind.",
  },
  {
    icon: '😩',
    title: 'All the admin, none of the scale',
    description: "You spend hours on logistics instead of coaching. Growing feels impossible when you're managing everything manually.",
  },
  {
    icon: '🤷',
    title: 'Hard to monetise your community',
    description: "You've built a following but struggle to convert free sessions into paid memberships or recurring revenue streams.",
  },
  {
    icon: '🏝️',
    title: 'Doing it all alone',
    description: "There's no playbook for fitness entrepreneurs. You're figuring out pricing, marketing, and retention by yourself.",
  },
]

export function PainPointsSection() {
  return (
    <section className="py-24 px-5 relative bg-gradient-to-b from-dark to-dark-card/50">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="font-sans text-label tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
              Sound Familiar?
            </div>
            <h2 className="font-sans text-display font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
              You&apos;re passionate about fitness.<br />But running the business? That&apos;s the hard part.
            </h2>
            <p className="text-body-lg text-neutral-400 leading-relaxed max-w-[580px] mx-auto">
              Most fitness entrepreneurs are stuck duct-taping tools together while their community deserves better.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((point, index) => (
            <ScrollReveal key={point.title} delay={index * 80}>
              <div className="landing-pain-card bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 transition-all duration-400 hover:border-red-500/15 hover:bg-red-500/[0.03] hover:-translate-y-1">
                <div className="text-[1.6rem] mb-4">{point.icon}</div>
                <h3 className="font-sans text-heading-sm font-bold mb-2.5 text-white">
                  {point.title}
                </h3>
                <p className="text-neutral-400 text-body-sm leading-relaxed">
                  {point.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
