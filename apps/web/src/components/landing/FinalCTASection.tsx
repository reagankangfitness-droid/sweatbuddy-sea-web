import Image from 'next/image'
import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function FinalCTASection() {
  return (
    <section id="cta" className="py-24 pb-32 px-5 text-center relative overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/connect-people.webp"
        alt="Large outdoor bootcamp community workout"
        fill
        className="object-cover object-center"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-dark/90 z-[1]" />

      <div className="relative z-[2]">
        <ScrollReveal>
          <div className="font-sans text-label tracking-[0.15em] uppercase text-brand-blue-glow mb-4">
            Ready?
          </div>
          <h2 className="font-sans text-display font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-white">
            You didn&apos;t start this to send{' '}
            <span className="bg-gradient-to-br from-brand-blue-glow to-[#818CF8] bg-clip-text text-transparent">
              spreadsheets
            </span>
            .
          </h2>
          <p className="text-neutral-300 text-body-lg leading-relaxed max-w-[520px] mx-auto mb-10">
            Hundreds of coaches and organizers already made the switch. Less admin. More energy for the people who show up.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2.5 bg-brand-blue text-white px-12 py-[18px] rounded-full font-sans font-bold text-heading-sm transition-all duration-300 hover:bg-brand-blue-dark hover:-translate-y-1 shadow-md hover:shadow-lg"
          >
            Get Started — It&apos;s Free →
          </Link>
          <div className="mt-4 text-caption text-neutral-400">
            No credit card needed. Set up in under 5 minutes.
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
