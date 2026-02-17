import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function FinalCTASection() {
  return (
    <section id="cta" className="py-24 pb-32 px-5 text-center relative overflow-hidden landing-cta-glow">
      <ScrollReveal>
        <div className="relative z-[2]">
          <div className="font-[family-name:var(--font-outfit)] text-xs font-bold tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
            Ready?
          </div>
          <h2 className="font-[family-name:var(--font-outfit)] text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
            Stop managing chaos.<br />
            Start building a{' '}
            <span className="bg-gradient-to-br from-brand-blue-glow to-[#818CF8] bg-clip-text text-transparent">
              community
            </span>
            .
          </h2>
          <p className="text-gray-400 text-[1.05rem] leading-relaxed max-w-[520px] mx-auto mb-10">
            Join the next wave of fitness entrepreneurs who are using SweatBuddies to turn their passion into a real, scalable business.
          </p>
          <Link
            href="/host"
            className="inline-flex items-center gap-2.5 bg-brand-blue text-white px-12 py-[18px] rounded-full font-[family-name:var(--font-outfit)] font-bold text-lg transition-all duration-300 hover:bg-brand-blue-dark hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,37,204,0.3)] hover:shadow-[0_12px_40px_rgba(0,37,204,0.5)]"
          >
            Get Early Access — It&apos;s Free →
          </Link>
          <div className="mt-4 text-[0.82rem] text-gray-400">
            No credit card needed. Set up in under 5 minutes.
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
