import Link from 'next/link'
import { ArrowRight, CheckCircle2, PencilLine, ShieldCheck } from 'lucide-react'
import { LogoWithText } from '@/components/logo'

const hostActions = [
  {
    icon: ShieldCheck,
    title: 'Claim your community',
    body: 'Confirm that you manage the official page and keep the listing accurate.',
  },
  {
    icon: PencilLine,
    title: 'Update the essentials',
    body: 'Share the usual area, schedule, beginner fit, and official way to join.',
  },
  {
    icon: CheckCircle2,
    title: 'Help first-timers arrive',
    body: 'Give newcomers enough context to know what happens and whether they can come solo.',
  },
]

export default function HostPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EA] text-[#17130E]">
      <header className="border-b border-[#17130E]/14">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="SweatBuddies home" className="inline-flex min-h-11 items-center">
            <LogoWithText size={28} color="#17130E" textColor="#17130E" />
          </Link>
          <Link href="/communities" className="sb-button-secondary px-4 text-xs">
            View communities
          </Link>
        </div>
      </header>

      <section className="border-b border-[#17130E]/14 px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#E8412C]">
            For community hosts
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Make your community easier to discover and easier to join.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#17130E]/68 sm:text-lg">
            SweatBuddies is a source-checked guide. We help people understand your community, then
            send them directly to your official group or website.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/communities/nominate" className="sb-button-primary px-5">
              Add or claim a community <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:support@sweatbuddies.co" className="sb-button-secondary px-5">
              Contact SweatBuddies
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-3 md:grid-cols-3">
            {hostActions.map((action) => {
              const Icon = action.icon
              return (
                <article key={action.title} className="rounded-xl border-2 border-[#17130E] bg-[#F8F4EA] p-5 shadow-[3px_3px_0_#17130E]">
                  <Icon className="h-5 w-5 text-[#E8412C]" />
                  <h2 className="mt-5 text-lg font-semibold">{action.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#17130E]/62">{action.body}</p>
                </article>
              )
            })}
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-6 text-[#17130E]/62">
            There is no required booking system or payment setup. Keep using the tools your
            community already trusts; we provide a clearer path for discovery.
          </p>
        </div>
      </section>
    </main>
  )
}
