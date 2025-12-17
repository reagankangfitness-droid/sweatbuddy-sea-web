'use client'

const activities = [
  { emoji: '🏃', name: 'Run Club' },
  { emoji: '🧘', name: 'Yoga' },
  { emoji: '💪', name: 'HIIT' },
  { emoji: '🚴', name: 'Cycling' },
  { emoji: '🏊', name: 'Swimming' },
  { emoji: '🥊', name: 'Boxing' },
  { emoji: '🧗', name: 'Climbing' },
  { emoji: '🎾', name: 'Tennis' },
  { emoji: '🏄', name: 'Surfing' },
  { emoji: '💃', name: 'Dance' },
  { emoji: '🏋️', name: 'Weights' },
  { emoji: '🤸', name: 'Pilates' },
]

export function ActivityMarquee() {
  return (
    <div className="bg-forest-900 py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...activities, ...activities].map((activity, index) => (
          <span
            key={index}
            className="mx-8 text-cream font-display font-semibold text-lg flex items-center gap-2"
          >
            <span className="text-2xl">{activity.emoji}</span>
            <span>{activity.name}</span>
            <span className="text-coral ml-4">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
