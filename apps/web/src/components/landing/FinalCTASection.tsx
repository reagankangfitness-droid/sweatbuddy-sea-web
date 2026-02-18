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
      <div className="absolute inset-0 bg-black/90 z-[1]" />

      <div className="relative z-[2]">
        <ScrollReveal>
          <div className="text-[0.6875rem] font-semibold tracking-[0.15em] uppercase !text-neutral-400 mb-4">
            Ready?
          </div>
          <h2 className="font-sans text-4xl font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 !text-white">
            Your fitness community{' '}
            <span className="!text-neutral-400">
              starts here.
            </span>
          </h2>
          <p className="!text-neutral-300 text-lg leading-relaxed max-w-[520px] mx-auto mb-10">
            Join thousands discovering their next favorite workout — or launch the community you&apos;ve been dreaming about. Either way, it&apos;s free.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2.5 bg-white !text-neutral-900 px-12 py-[18px] rounded-full font-sans font-bold text-lg transition-all duration-300 hover:bg-neutral-100 hover:-translate-y-1 shadow-md hover:shadow-lg"
            >
              Find Events →
            </Link>
            <Link
              href="/sign-up?intent=host"
              className="inline-flex items-center gap-2.5 bg-white/10 !text-white backdrop-blur-sm border border-white/20 px-12 py-[18px] rounded-full font-sans font-bold text-lg transition-all duration-300 hover:bg-white/20"
            >
              Start Hosting →
            </Link>
          </div>
          <div className="mt-4 text-[0.8125rem] font-medium !text-neutral-400">
            No credit card needed. One account for everything.
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
