'use client'

import Image from 'next/image'

const bannerImages = [
  { src: '/banner/run-club.jpg', alt: 'Run Club', category: 'Running' },
  { src: '/banner/athletics.jpg', alt: 'Athletics', category: 'HIIT' },
  { src: '/banner/meditation.png', alt: 'Meditation', category: 'Wellness' },
  { src: '/banner/ice-bath.webp', alt: 'Ice Bath', category: 'Recovery' },
  { src: '/banner/running.jpg', alt: 'Running', category: 'Cardio' },
]

export function RollingBanner() {
  // Duplicate images for seamless infinite scroll
  const images = [...bannerImages, ...bannerImages]

  return (
    <section className="relative py-12 md:py-16 overflow-hidden" style={{ background: '#f0f4fa' }}>
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(52, 119, 248, 0.04) 0%, transparent 70%)' }} />

      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 z-10" style={{ background: 'linear-gradient(to right, #f0f4fa, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 z-10" style={{ background: 'linear-gradient(to left, #f0f4fa, transparent)' }} />

        {/* Rolling banner */}
        <div className="flex animate-scroll">
          {images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="flex-shrink-0 mx-3 md:mx-4 group"
            >
              <div className="relative w-72 h-48 md:w-96 md:h-64 rounded-2xl overflow-hidden">
                {/* Image */}
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 288px, 384px"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Border glow on hover */}
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#3477f8]/30 transition-colors duration-500" />

                {/* Category tag */}
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                    {image.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
