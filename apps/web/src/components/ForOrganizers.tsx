'use client'

import { Megaphone, Users, TrendingUp, Star, ArrowRight } from 'lucide-react'

const benefits = [
  {
    icon: Users,
    title: 'Reach New Faces',
    description: 'Get discovered by people actively looking for events like yours.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Community',
    description: 'Build your following with exposure to our growing audience.',
  },
  {
    icon: Star,
    title: 'Always Free',
    description: 'No fees, no catch. We believe in accessible fitness for all.',
  },
]

export function ForOrganizers() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080A0F]" />

      {/* Gradient accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, hsl(168 58% 52% / 0.4), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B292E7]/10 border border-[#B292E7]/20 text-[#B292E7] text-sm font-medium mb-6">
              <Megaphone className="w-4 h-4" />
              <span>For Organizers</span>
            </div>

            <h2
              className="font-extrabold text-white mb-6"
              style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
            >
              You Host. <br />
              <span className="text-gradient">We Amplify.</span>
            </h2>

            <p className="text-white/60 text-lg mb-10 max-w-lg leading-relaxed">
              Running an open session? Get discovered by hundreds of fitness enthusiasts actively looking for their next workout.
            </p>

            <a href="#submit" className="btn-primary inline-flex items-center gap-2">
              <span>Submit Your Event</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right: Benefits */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group glass-card rounded-2xl p-6 flex items-start gap-5 transition-all duration-500"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, rgba(60, 207, 187, 0.2), rgba(60, 207, 187, 0.1))',
                    border: '1px solid rgba(60, 207, 187, 0.3)',
                  }}
                >
                  <benefit.icon className="w-5 h-5 text-[#3CCFBB]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
