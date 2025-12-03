'use client'

import { MapPin, Search, Check, Zap } from 'lucide-react'

const steps = [
  {
    icon: MapPin,
    title: 'Pick Your City',
    description: 'Singapore, KL, Bangkok. More coming soon.',
    color: '#3CCFBB',
  },
  {
    icon: Search,
    title: 'Browse What\'s On',
    description: 'Filter by vibe: morning, weekend, after-work.',
    color: '#B292E7',
  },
  {
    icon: Check,
    title: 'Just Show Up',
    description: 'No sign-ups. No apps. No excuses.',
    color: '#F97316',
  },
]

export function HowItWorks() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080A0F]" />

      {/* Subtle gradient accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(262 80% 74% / 0.3), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 text-[#F97316]" />
            <span>Super Simple</span>
          </div>
          <h2
            className="font-extrabold text-white"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Show Up. <span className="text-gradient-warm">That&apos;s It.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Connecting line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/20 to-transparent" />
              )}

              <div className="relative glass-card rounded-2xl p-8 text-center h-full">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}40, ${step.color}20)`,
                      color: step.color,
                      border: `1px solid ${step.color}40`,
                    }}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                </div>

                {/* Content */}
                <h3 className="font-bold text-white text-xl mb-3">
                  {step.title}
                </h3>
                <p className="text-white/50 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
