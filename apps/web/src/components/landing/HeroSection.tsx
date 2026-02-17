import Link from 'next/link'

const activityTypes = [
  { icon: '🏃', label: 'Run Clubs' },
  { icon: '🔥', label: 'Bootcamps' },
  { icon: '🧘', label: 'Yoga & Wellness' },
  { icon: '💪', label: 'Personal Trainers' },
  { icon: '🏔️', label: 'Retreats' },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center px-5 pt-32 pb-16 overflow-hidden landing-hero-glow">
      <div className="landing-grid-bg" />

      <div className="relative z-[2] max-w-[820px]">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 bg-brand-blue/10 border border-brand-blue/30 rounded-full px-5 py-2 text-sm font-medium text-brand-blue-glow mb-8 opacity-0 animate-fade-in-up"
        >
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Where fitness communities come to life
        </div>

        {/* Headline */}
        <h1
          className="font-[family-name:var(--font-outfit)] text-[clamp(2.5rem,5.5vw,4.2rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-6 text-white opacity-0 animate-fade-in-up [animation-delay:100ms]"
        >
          You built the community.{' '}
          <span className="bg-gradient-to-br from-brand-blue-glow to-[#818CF8] bg-clip-text text-transparent">
            Now let it run itself.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg text-gray-400 leading-relaxed max-w-[600px] mx-auto mb-10 opacity-0 animate-fade-in-up [animation-delay:200ms]"
        >
          No more chasing payments in DMs. No more headcounts on a spreadsheet at 5am. Just you, your people, and a platform that handles the rest.
        </p>

        {/* CTAs */}
        <div
          className="flex gap-4 justify-center flex-wrap opacity-0 animate-fade-in-up [animation-delay:300ms]"
        >
          <Link
            href="/sign-up"
            className="bg-brand-blue text-white px-9 py-3.5 rounded-full font-[family-name:var(--font-outfit)] font-semibold text-base inline-flex items-center gap-2 transition-all duration-300 hover:bg-brand-blue-dark hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,37,204,0.4)]"
          >
            Launch Your Community →
          </Link>
          <Link
            href="#features"
            className="bg-transparent text-gray-300 border border-white/15 px-9 py-3.5 rounded-full font-[family-name:var(--font-outfit)] font-medium text-base transition-all duration-300 hover:border-white/30 hover:text-white hover:bg-white/5"
          >
            See How It Works
          </Link>
        </div>

        {/* Activity tags */}
        <div
          className="flex justify-center gap-6 sm:gap-8 flex-wrap mt-14 opacity-0 animate-fade-in-up [animation-delay:400ms]"
        >
          {activityTypes.map((type) => (
            <div key={type.label} className="flex items-center gap-1.5 text-gray-400 text-sm">
              <span className="text-base">{type.icon}</span>
              {type.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
