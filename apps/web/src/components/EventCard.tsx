'use client'

import Image from 'next/image'
import { MapPin, Clock, Calendar, Instagram, Users } from 'lucide-react'

interface Event {
  id: string
  name: string
  category: string
  day: string
  time: string
  location: string
  description: string
  organizer: string
  imageUrl?: string
  recurring: boolean
}

interface EventCardProps {
  event: Event
  index?: number
}

const categoryStyles: Record<string, { gradient: string; glow: string; badge: string }> = {
  'Run Club': {
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
    badge: 'badge-run',
  },
  'Running': {
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
    badge: 'badge-run',
  },
  'Yoga': {
    gradient: 'from-violet-500/20 to-violet-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)]',
    badge: 'badge-yoga',
  },
  'HIIT': {
    gradient: 'from-orange-500/20 to-orange-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]',
    badge: 'badge-hiit',
  },
  'Bootcamp': {
    gradient: 'from-orange-500/20 to-orange-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]',
    badge: 'badge-hiit',
  },
  'Dance': {
    gradient: 'from-yellow-500/20 to-amber-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(250,204,21,0.4)]',
    badge: 'badge-dance',
  },
  'Dance Fitness': {
    gradient: 'from-yellow-500/20 to-amber-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(250,204,21,0.4)]',
    badge: 'badge-dance',
  },
  'Combat': {
    gradient: 'from-pink-500/20 to-rose-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.4)]',
    badge: 'badge-combat',
  },
  'Outdoor': {
    gradient: 'from-teal-500/20 to-cyan-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]',
    badge: 'badge-outdoor',
  },
  'Outdoor Fitness': {
    gradient: 'from-teal-500/20 to-cyan-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]',
    badge: 'badge-outdoor',
  },
  'Hiking': {
    gradient: 'from-teal-500/20 to-cyan-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]',
    badge: 'badge-outdoor',
  },
  'Meditation': {
    gradient: 'from-violet-500/20 to-violet-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)]',
    badge: 'badge-yoga',
  },
  'Breathwork': {
    gradient: 'from-violet-500/20 to-violet-600/10',
    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)]',
    badge: 'badge-yoga',
  },
}

const defaultStyle = {
  gradient: 'from-slate-500/20 to-slate-600/10',
  glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(100,116,139,0.4)]',
  badge: 'bg-white/10 text-white/80 border border-white/20',
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const style = categoryStyles[event.category] || defaultStyle

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ease-out
        bg-gradient-to-br ${style.gradient} backdrop-blur-xl
        border border-white/10 hover:border-white/20
        ${style.glow}
        hover:-translate-y-2`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Event Image */}
      {event.imageUrl && (
        <div className="relative w-full aspect-[16/10] overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Image overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/20 to-transparent" />

          {/* Category Badge on image */}
          <div className="absolute top-4 left-4">
            <span className={`badge ${style.badge}`}>
              {event.category}
            </span>
          </div>

          {/* Recurring indicator */}
          {event.recurring && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3CCFBB] animate-pulse" />
                Weekly
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="relative p-5">
        {/* No image fallback badge */}
        {!event.imageUrl && (
          <div className="mb-4">
            <span className={`badge ${style.badge}`}>
              {event.category}
            </span>
          </div>
        )}

        {/* Event Name */}
        <h3 className="font-heading font-bold text-white mb-3 text-lg leading-tight tracking-wide group-hover:text-[#3CCFBB] transition-colors duration-300">
          {event.name}
        </h3>

        {/* Meta info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-white/60 text-sm font-body">
            <Calendar className="w-4 h-4 text-[#3CCFBB]" />
            <span>{event.day}</span>
            <span className="text-white/30">•</span>
            <Clock className="w-4 h-4 text-[#3CCFBB]" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-start gap-2 text-white/60 text-sm font-body">
            <MapPin className="w-4 h-4 text-[#3CCFBB] flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="font-body text-white/50 text-sm mb-4 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Footer: Organizer */}
        <div className="pt-4 border-t border-white/10">
          <a
            href={`https://instagram.com/${event.organizer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-[#3CCFBB] transition-colors group/link"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <span className="group-hover/link:underline underline-offset-2">@{event.organizer}</span>
          </a>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(60, 207, 187, 0.1), transparent 70%)',
        }}
      />
    </div>
  )
}
