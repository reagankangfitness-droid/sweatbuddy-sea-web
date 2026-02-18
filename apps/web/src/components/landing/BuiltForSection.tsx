import { ScrollReveal } from '@/components/ui/ScrollReveal'

const audiences = [
  { icon: '🏃', title: 'Run Clubs', description: 'Weekly routes, pace groups, and post-run socials — all in one place.' },
  { icon: '🔥', title: 'Bootcamps', description: 'Find your next session or fill every spot — all in one place.' },
  { icon: '🧘', title: 'Yoga & Pilates', description: 'Drop in to a class or build a following — all in one place.' },
  { icon: '💪', title: 'Personal Trainers', description: 'Join group sessions or launch your own — all in one place.' },
  { icon: '🏔️', title: 'Retreats & Workshops', description: 'Discover unique experiences or host your own — all in one place.' },
  { icon: '🥊', title: 'Combat & Martial Arts', description: 'Sparring groups, classes, and community — all in one place.' },
]

export function BuiltForSection() {
  return (
    <section className="py-24 px-5 bg-dark text-center">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="font-sans text-label tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
            Built For You
          </div>
          <h2 className="font-sans text-display font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
            No matter how you move,<br />we&apos;ve got you covered
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-12">
            {audiences.map((item) => (
              <div
                key={item.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-7 transition-all duration-300 hover:border-brand-blue/30 hover:bg-brand-blue/[0.04] hover:-translate-y-1"
              >
                <div className="text-[2rem] mb-3">{item.icon}</div>
                <h4 className="font-sans text-body font-bold mb-1 text-white">{item.title}</h4>
                <p className="text-caption text-neutral-400 leading-snug">{item.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
