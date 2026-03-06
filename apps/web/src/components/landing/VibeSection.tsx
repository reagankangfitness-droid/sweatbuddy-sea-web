import { ScrollAnimator } from './ScrollAnimator'

const cards = [
  {
    emoji: '\u{1F91D}',
    title: 'Real connections',
    desc: 'No algorithms. No feeds. Just real people showing up to move together. Every event is a chance to meet your next running buddy or gym partner.',
  },
  {
    emoji: '\u{1F4CD}',
    title: 'Hyperlocal',
    desc: 'Events happening in your neighbourhood, not across the city. We focus on Singapore first — every listing is verified and within reach.',
  },
  {
    emoji: '\u{1F331}',
    title: 'All levels welcome',
    desc: 'First 5K or fiftieth? Just started yoga or been practising for years? Every event on SweatBuddies welcomes beginners.',
  },
]

export function VibeSection() {
  return (
    <section className="py-20 sm:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollAnimator>
          <div className="text-center mb-12">
            <span className="inline-block px-2.5 py-1 bg-neutral-100 rounded-md text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              More Than an App
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Why people choose SweatBuddies
            </h2>
          </div>
        </ScrollAnimator>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <ScrollAnimator key={card.title} delay={i * 100}>
              <div className="bg-neutral-50 rounded-xl p-6 sm:p-7 h-full">
                <span className="text-2xl block mb-3">{card.emoji}</span>
                <h3 className="font-bold text-neutral-900 mb-2">{card.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{card.desc}</p>
              </div>
            </ScrollAnimator>
          ))}
        </div>
      </div>
    </section>
  )
}
