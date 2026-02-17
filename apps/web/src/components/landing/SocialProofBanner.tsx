import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function SocialProofBanner() {
  return (
    <section className="py-16 px-5">
      <ScrollReveal>
        <div className="max-w-[800px] mx-auto text-center bg-gradient-to-br from-brand-blue/[0.08] to-purple-500/[0.06] border border-brand-blue/15 rounded-[20px] px-8 py-12 relative overflow-hidden">
          {/* Subtle radial glow */}
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_30%_50%,rgba(0,37,204,0.06),transparent_50%)] pointer-events-none" />

          <div className="relative">
            <div className="text-[2.5rem] mb-4">🌱</div>
            <h3 className="font-[family-name:var(--font-outfit)] text-2xl font-bold mb-3 text-white">
              &ldquo;Show up alone. Leave with a crew.&rdquo;
            </h3>
            <p className="text-gray-400 text-[0.95rem] leading-relaxed max-w-[500px] mx-auto mb-4">
              That&apos;s what your members say about your community. We&apos;re here to make sure you can keep delivering that — without burning out behind the scenes.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
