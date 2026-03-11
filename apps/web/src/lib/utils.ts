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
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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
  running:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: '#60A5FA' },
  cycling:  { bg: 'bg-red-500/10',    text: 'text-red-400',    dot: '#F87171' },
  yoga:     { bg: 'bg-emerald-500/10',text: 'text-emerald-400',dot: '#34D399' },
  gym:      { bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: '#FBBF24' },
  strength: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: '#FBBF24' },
  hiking:   { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: '#A78BFA' },
  bootcamp: { bg: 'bg-pink-500/10',   text: 'text-pink-400',   dot: '#F472B6' },
  hiit:     { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: '#FB923C' },
  pilates:  { bg: 'bg-sky-500/10',    text: 'text-sky-400',    dot: '#38BDF8' },
  swimming: { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   dot: '#22D3EE' },
  sports:   { bg: 'bg-lime-500/10',   text: 'text-lime-400',   dot: '#A3E635' },
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
