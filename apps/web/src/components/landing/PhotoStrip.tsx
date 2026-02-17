import Image from 'next/image'

const photos = [
  { src: '/images/hero-1.webp', alt: 'Run club group running together' },
  { src: '/images/hero/run-club.jpg', alt: 'Women running and smiling' },
  { src: '/images/hero-3.jpg', alt: 'Cold plunge recovery session' },
  { src: '/images/community-bonds.jpg', alt: 'Community group selfie on sports court' },
  { src: '/images/hero/ice-bath.webp', alt: 'Ice bath challenge with friends' },
]

export function PhotoStrip() {
  return (
    <section className="py-8 overflow-hidden bg-dark">
      <div className="flex gap-4 animate-scroll">
        {/* Double the photos for seamless loop */}
        {[...photos, ...photos].map((photo, i) => (
          <div
            key={i}
            className="relative w-[280px] h-[180px] sm:w-[340px] sm:h-[220px] flex-shrink-0 rounded-xl overflow-hidden"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="340px"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
