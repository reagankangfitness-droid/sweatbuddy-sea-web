'use client'

import { Heart, DollarSign, Users, Zap } from 'lucide-react'

const stats = [
  { icon: DollarSign, value: '$200+', label: 'Avg. gym membership/month' },
  { icon: DollarSign, value: '$40+', label: 'Boutique class price' },
  { icon: Users, value: '100s', label: 'Free sessions every week' },
]

export function Mission() {
  return (
    <section id="mission" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F] to-[#0A0F18]" />

      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, hsl(330 80% 65% / 0.3), transparent 50%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, hsl(25 95% 53% / 0.3), transparent 50%)',
            filter: 'blur(100px)',
            animationDelay: '1s',
          }}
        />
      </div>

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EC4899]/10 border border-[#EC4899]/20 text-[#EC4899] text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              <span>Our Mission</span>
            </div>
            <h2
              className="font-heading font-extrabold text-white mb-6 tracking-wide"
              style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
            >
              Movement Without <br className="hidden sm:block" />
              <span className="text-gradient-warm">the Membership</span>
            </h2>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass-card rounded-xl p-4 text-center"
              >
                <div className="font-heading text-2xl md:text-3xl font-bold text-gradient-warm mb-1">
                  {stat.value}
                </div>
                <div className="font-body text-xs md:text-sm text-white/40">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6 text-center">
            <p className="text-white/70 text-lg md:text-xl leading-relaxed">
              But every week, <span className="text-white font-semibold">hundreds of open-access sessions</span> happen across Southeast Asia.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-full bg-[#3CCFBB]/10 border border-[#3CCFBB]/20 text-[#3CCFBB] text-sm">
                Run clubs at dawn
              </span>
              <span className="px-4 py-2 rounded-full bg-[#B292E7]/10 border border-[#B292E7]/20 text-[#B292E7] text-sm">
                Yoga at sunset
              </span>
              <span className="px-4 py-2 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-sm">
                Bootcamps on the beach
              </span>
            </div>

            <p className="text-white/50 text-lg leading-relaxed pt-4">
              The problem? They&apos;re <span className="text-white/70">invisible</span>. Scattered across Facebook groups and disappearing stories.
            </p>

            <div className="pt-6">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                <Zap className="w-6 h-6 text-[#3CCFBB]" />
                <span className="text-white font-bold text-lg">
                  SweatBuddies finds them all. One place.
                </span>
              </div>
            </div>

            <p className="text-[#3CCFBB] font-semibold text-xl pt-4">
              No memberships. No paywalls. Just movement.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
