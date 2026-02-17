import { ScrollReveal } from '@/components/ui/ScrollReveal'

const audiences = [
  { icon: '🏃', title: 'Run Clubs', description: 'Weekly routes, pace groups, and post-run socials — all managed.' },
  { icon: '🔥', title: 'Bootcamps', description: 'Track capacity, manage waitlists, and keep energy high.' },
  { icon: '🧘', title: 'Yoga & Pilates', description: 'Offer drop-ins or memberships with seamless booking.' },
  { icon: '💪', title: 'Personal Trainers', description: 'Move from 1:1 to group experiences and scale your income.' },
  { icon: '🏔️', title: 'Retreats & Workshops', description: 'One-off or recurring — manage registrations and payments.' },
  { icon: '🥊', title: 'Combat & Martial Arts', description: 'Belt tracking, sparring groups, and class management.' },
]

export function BuiltForSection() {
  return (
    <section className="py-24 px-5 bg-dark text-center">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="font-[family-name:var(--font-outfit)] text-xs font-bold tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
            Built For You
          </div>
          <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
            No matter how you move people,<br />we&apos;ve got you covered
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-12">
            {audiences.map((item) => (
              <div
                key={item.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-[14px] px-5 py-7 transition-all duration-300 hover:border-brand-blue/30 hover:bg-brand-blue/[0.04] hover:-translate-y-1"
              >
                <div className="text-[2rem] mb-3">{item.icon}</div>
                <h4 className="font-[family-name:var(--font-outfit)] text-base font-bold mb-1 text-white">{item.title}</h4>
                <p className="text-[0.82rem] text-gray-400 leading-snug">{item.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
