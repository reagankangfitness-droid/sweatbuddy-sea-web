import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function SocialProofBanner() {
  return (
    <section className="py-16 px-5 bg-white">
      <ScrollReveal>
        <div className="max-w-[800px] mx-auto text-center bg-neutral-50 border border-neutral-200 rounded-2xl px-8 py-12">
          <div className="text-[2.5rem] mb-4">🌱</div>
          <h3 className="font-sans text-heading-xl font-bold mb-3 text-neutral-900">
            &ldquo;Show up alone. Leave with a crew.&rdquo;
          </h3>
          <p className="text-neutral-500 text-body leading-relaxed max-w-[500px] mx-auto mb-4">
            That&apos;s the SweatBuddies experience. Real connections through real movement — whether you&apos;re joining your first run club or building a fitness empire.
          </p>
        </div>
      </ScrollReveal>
    </section>
  )
}
