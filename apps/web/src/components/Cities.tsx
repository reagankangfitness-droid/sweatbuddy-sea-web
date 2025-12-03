'use client'

import { MapPin, Globe } from 'lucide-react'

const cities = [
  {
    name: 'Singapore',
    status: 'active' as const,
    subtitle: '50+ events live',
    gradient: 'from-[#3CCFBB] to-[#0EA5E9]',
    flag: '🇸🇬',
  },
  {
    name: 'Kuala Lumpur',
    status: 'coming' as const,
    subtitle: 'January 2025',
    gradient: 'from-[#B292E7] to-[#EC4899]',
    flag: '🇲🇾',
  },
  {
    name: 'Bangkok',
    status: 'coming' as const,
    subtitle: 'Q1 2025',
    gradient: 'from-[#F97316] to-[#FACC15]',
    flag: '🇹🇭',
  },
]

export function Cities() {
  return (
    <section id="cities" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F] via-[#0A0F18] to-[#080A0F]" />

      {/* Gradient accents */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(168 58% 52% / 0.4), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(262 80% 74% / 0.4), transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium mb-6">
            <Globe className="w-4 h-4 text-[#3CCFBB]" />
            <span>Expanding Across SEA</span>
          </div>
          <h2
            className="font-heading font-extrabold text-white tracking-wide"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)' }}
          >
            Where We&apos;re <span className="text-gradient">Live</span>
          </h2>
        </div>

        {/* City Cards */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {cities.map((city) => (
            <div
              key={city.name}
              className={`group relative rounded-2xl p-8 text-center transition-all duration-500 overflow-hidden ${
                city.status === 'active'
                  ? 'glass-card border-[#3CCFBB]/30'
                  : 'glass-card opacity-70 hover:opacity-100'
              }`}
            >
              {/* Gradient background for active city */}
              {city.status === 'active' && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, ${city.gradient.split(' ')[0].replace('from-[', '').replace(']', '')}, ${city.gradient.split(' ')[1].replace('to-[', '').replace(']', '')})`,
                  }}
                />
              )}

              {/* Flag */}
              <div className="text-5xl mb-4 transition-transform duration-500 group-hover:scale-110">
                {city.flag}
              </div>

              {/* City Name */}
              <h3 className="font-heading font-bold text-white text-2xl mb-2 tracking-wide">
                {city.name}
              </h3>

              {/* Status */}
              <p className={`font-body text-sm mb-4 ${
                city.status === 'active' ? 'text-white/70' : 'text-white/40'
              }`}>
                {city.subtitle}
              </p>

              {/* Badge */}
              {city.status === 'active' ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3CCFBB]/20 border border-[#3CCFBB]/30 text-[#3CCFBB] text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#3CCFBB] animate-pulse" />
                  Live Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-sm font-medium">
                  Coming Soon
                </span>
              )}

              {/* Hover glow for active */}
              {city.status === 'active' && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: '0 0 60px -15px rgba(60, 207, 187, 0.3)',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-white/40 text-sm">
            Want SweatBuddies in your city?{' '}
            <a href="#submit" className="text-[#3CCFBB] hover:underline underline-offset-4">
              Let us know
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
