import { ScrollReveal } from '@/components/ui/ScrollReveal'

const steps = [
  {
    number: 1,
    label: 'Kickstart',
    title: 'Set up in minutes',
    description: 'Create your profile, list your first event, and get a shareable link. No tech skills needed — just your passion.',
    colors: {
      bg: 'bg-brand-blue/15',
      border: 'border-brand-blue',
      text: 'text-brand-blue-glow',
    },
  },
  {
    number: 2,
    label: 'Build',
    title: 'Grow your regulars',
    description: 'Track attendance, automate reminders, and turn first-timers into loyal members with built-in engagement tools.',
    colors: {
      bg: 'bg-purple-500/15',
      border: 'border-purple-500',
      text: 'text-purple-400',
    },
  },
  {
    number: 3,
    label: 'Scale',
    title: 'Monetise & expand',
    description: 'Launch paid memberships, analyse your data, and scale from one session a week to a full fitness brand.',
    colors: {
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500',
      text: 'text-emerald-500',
    },
  },
]

export function JourneySection() {
  return (
    <section id="features" className="py-24 px-5 bg-dark">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="font-[family-name:var(--font-outfit)] text-xs font-bold tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
              Your Journey With Us
            </div>
            <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
              From idea to thriving community<br />in three phases
            </h2>
            <p className="text-[1.05rem] text-gray-400 leading-relaxed max-w-[580px] mx-auto">
              SweatBuddies meets you where you are and grows with you.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Gradient connector line — hidden on mobile */}
            <div className="hidden md:block absolute top-[50px] left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-brand-blue to-emerald-500 opacity-30" />

            {steps.map((step) => (
              <div key={step.number} className="text-center relative">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 font-[family-name:var(--font-outfit)] font-extrabold text-xl relative z-[2] border-2 ${step.colors.bg} ${step.colors.border} ${step.colors.text}`}
                >
                  {step.number}
                </div>
                <div className={`font-[family-name:var(--font-outfit)] text-[0.7rem] font-semibold uppercase tracking-[0.12em] mb-1.5 ${step.colors.text}`}>
                  {step.label}
                </div>
                <h3 className="font-[family-name:var(--font-outfit)] text-xl font-bold mb-2 text-white">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-[0.9rem] leading-relaxed max-w-[280px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
