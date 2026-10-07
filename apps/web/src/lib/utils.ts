import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Date / time ─────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Singapore',
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Singapore',
  })
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} · ${formatTime(date)}`
}

// ─── Activity helpers ─────────────────────────────────────────────────────────

interface ActivityColorScheme {
  bg: string       // Tailwind class for pill background
  text: string     // Tailwind class for pill text
  dot: string      // Hex for the colored dot / accent
}

const ACTIVITY_COLORS: Record<string, ActivityColorScheme> = {
  running:  { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  cycling:  { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  yoga:     { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  gym:      { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  strength: { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  hiking:   { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  bootcamp: { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  hiit:     { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  pilates:  { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  swimming: { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
  sports:   { bg: 'bg-[#E83E6B]/10', text: 'text-[#E83E6B]', dot: '#E83E6B' },
}

export function getActivityColor(type: string): ActivityColorScheme {
  return (
    ACTIVITY_COLORS[type.toLowerCase()] ?? {
      bg: 'bg-neutral-800',
      text: 'text-neutral-300',
      dot: '#A3A3A3',
    }
  )
}

export function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    running: '🏃', cycling: '🚴', yoga: '🧘', gym: '🏋️',
    strength: '🏋️', hiking: '🥾', bootcamp: '🎖️', hiit: '⚡',
    pilates: '🦢', swimming: '🏊', sports: '⚽',
  }
  return icons[type.toLowerCase()] ?? '🏃'
}
