'use client'

import Link from 'next/link'
import { Bookmark, CalendarDays, Map, UserRound } from 'lucide-react'
import { LogoWithText } from '@/components/logo'

export type ProductNavItem = 'explore' | 'week' | 'me' | 'profile'

const items = [
  { key: 'explore', href: '/explore', label: 'Explore', icon: Map },
  { key: 'week', href: '/this-week', label: 'This week', icon: CalendarDays },
  { key: 'me', href: '/me', label: 'My activity', icon: Bookmark },
  { key: 'profile', href: '/profile', label: 'Profile', icon: UserRound },
] as const

export function ProductNav({ active }: { active: ProductNavItem }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-black/10 bg-white/95 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon
        const selected = item.key === active
        return (
          <Link key={item.key} href={item.href} aria-current={selected ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${selected ? 'text-[#E83E6B]' : 'text-black/45'}`}>
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function ProductHeader({ active }: { active: ProductNavItem }) {
  return (
    <header className="hidden border-b border-black/10 bg-[#F8F4EA]/95 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="SweatBuddies home">
          <LogoWithText size={27} color="#E83E6B" textColor="#17130E" />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {items.map((item) => {
            const selected = item.key === active
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={selected ? 'page' : undefined}
                className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${selected ? 'bg-[#17130E] text-white' : 'text-[#17130E]/65 hover:bg-black/[0.05] hover:text-[#17130E]'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
