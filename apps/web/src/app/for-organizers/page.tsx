import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Check, ClipboardCheck, Users } from 'lucide-react'
import { LogoWithText } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Club Manager for Fitness Communities',
  description: 'Publish recurring sessions, manage RSVPs, and welcome newcomers with SweatBuddies.',
}

const features = [
  'Unlimited recurring sessions',
  'RSVPs, capacity and attendee lists',
  'Newcomer details and reminders',
  'Attendance and returning-member history',
  'Two organizer accounts',
]

export default function ForOrganizersPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EA] text-[#17130E]">
      <header className="border-b border-black/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Link href="/"><LogoWithText size={27} color="#E83E6B" textColor="#17130E" /></Link>
          <Link href="/sign-in?redirect_url=/hub" className="text-sm font-bold">Organizer sign in</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.2fr_.8fr] md:py-24">
        <div>
          <p className="sb-eyebrow">SweatBuddies Club Manager</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[.98] tracking-[-.045em] !text-[#17130E] md:text-7xl">Run your community without running another spreadsheet.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">Publish one recurring schedule, share one link, and know who is coming—including first-timers who need a little more confidence.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="inline-flex h-[52px] items-center gap-2 rounded-full bg-[#17130E] px-6 text-sm font-bold !text-white">Claim your community <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/hub" className="inline-flex h-[52px] items-center rounded-full border border-black/15 bg-white px-6 text-sm font-bold !text-[#17130E]">Open organizer hub</Link>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            <Value icon={<CalendarDays />} title="Publish once" copy="Turn a weekly schedule into upcoming sessions." />
            <Value icon={<Users />} title="Know who’s new" copy="See first-timers before they arrive." />
            <Value icon={<ClipboardCheck />} title="Close the loop" copy="Track attendance and repeat participation." />
          </div>
        </div>
        <aside className="self-start rounded-[2rem] border border-black/10 bg-white p-7 shadow-[0_20px_60px_rgba(23,19,14,.1)]">
          <p className="text-sm font-bold text-[#E83E6B]">FOUNDING CLUB</p>
          <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-bold">S$15</span><span className="pb-1 text-black/50">/ month</span></div>
          <p className="mt-3 text-sm leading-6 text-black/55">For Singapore fitness communities testing a simpler weekly workflow.</p>
          <ul className="mt-6 space-y-3">{features.map((feature) => <li key={feature} className="flex gap-3 text-sm"><Check className="h-5 w-5 shrink-0 text-[#E83E6B]" />{feature}</li>)}</ul>
          <form action="/api/club/checkout" method="post" className="mt-8">
            <button className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#E83E6B] px-6 text-sm font-bold !text-white">Start Founding Club <ArrowRight className="h-4 w-4" /></button>
          </form>
          <p className="mt-3 text-center text-xs text-black/45">Cancel anytime. Claim a community before checkout.</p>
        </aside>
      </section>
    </main>
  )
}

function Value({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="rounded-2xl border border-black/10 bg-white p-4"><span className="text-[#E83E6B] [&_svg]:h-5 [&_svg]:w-5">{icon}</span><h2 className="mt-3 font-bold !text-[#17130E]">{title}</h2><p className="mt-1 text-xs leading-5 text-black/55">{copy}</p></div>
}
