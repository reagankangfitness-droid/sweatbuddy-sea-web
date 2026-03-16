import Link from 'next/link'
import { ScrollAnimator } from './ScrollAnimator'

export function FinalCTASection() {
  return (
    <section className="py-20 sm:py-24 px-5">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollAnimator>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight mb-4">
            Ready to find your{' '}
            <span className="text-neutral-500 italic">crew</span>?
          </h2>
          <p className="text-neutral-500 leading-relaxed mb-8 max-w-lg mx-auto">
            Whether you&apos;re looking for your next workout or ready to host your first event,
            SweatBuddies is where it starts.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href="/buddy"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-neutral-900 font-semibold text-sm rounded-md hover:bg-neutral-200 transition-colors"
            >
              Browse events
            </Link>
            <Link
              href="/host"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-neutral-700 text-neutral-300 font-semibold text-sm rounded-md hover:bg-neutral-800 transition-colors"
            >
              Start hosting — free
            </Link>
          </div>

          <p className="text-xs text-neutral-400">
            No app to download. No credit card needed.
          </p>
        </ScrollAnimator>
      </div>
    </section>
  )
}
