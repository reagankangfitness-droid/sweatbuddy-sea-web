import { MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppLoadingScreenProps = {
  label?: string
  detail?: string
  className?: string
  compact?: boolean
}

const planRows = [
  { width: 'w-40', metaWidth: 'w-28' },
  { width: 'w-48', metaWidth: 'w-36' },
  { width: 'w-32', metaWidth: 'w-24' },
]

const activityPins = [
  { top: '22%', left: '18%', label: 'RUN' },
  { top: '38%', left: '62%', label: 'YOGA' },
  { top: '62%', left: '34%', label: 'GAME' },
  { top: '68%', left: '74%', label: 'MOVE' },
]

export function AppLoadingScreen({
  label = 'Loading SweatBuddies',
  detail = 'Finding active communities near you',
  className,
  compact = false,
}: AppLoadingScreenProps) {
  return (
    <main
      className={cn(
        'sb-page flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-6',
        className,
      )}
      data-sb-paper-shell
      aria-busy="true"
      aria-live="polite"
    >
      <section className="relative w-full max-w-md">
        <div className="absolute -inset-6 rounded-[32px] bg-[#C6E76A]/8 blur-3xl" aria-hidden="true" />

        <div className="relative overflow-hidden rounded-[24px] border border-white/12 bg-[#0B0D0C] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/14 bg-white/[0.04]">
                <span className="absolute h-1.5 w-1.5 -translate-x-1.5 -translate-y-1.5 rounded-full bg-white" />
                <span className="absolute h-1.5 w-1.5 translate-x-1.5 -translate-y-1.5 rounded-full bg-white" />
                <span className="mt-2 h-3 w-5 rounded-b-full border-b-2 border-white" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">sweatbuddies</p>
                <p className="font-mono text-[10px] font-bold uppercase text-white/42">Community map</p>
              </div>
            </div>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#C6E76A]" />
          </header>

          <div className="relative h-64 overflow-hidden border-b border-white/10 bg-[#10130F]">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-[-20%] top-[18%] h-px w-[150%] rotate-[-16deg] bg-white/10" />
              <div className="absolute left-[-18%] top-[48%] h-px w-[145%] rotate-[10deg] bg-white/10" />
              <div className="absolute left-[12%] top-[-10%] h-[120%] w-px rotate-[18deg] bg-white/10" />
              <div className="absolute left-[54%] top-[-12%] h-[130%] w-px rotate-[-12deg] bg-white/10" />
              <div className="absolute bottom-8 left-[-15%] h-24 w-[130%] rounded-[999px] border border-white/8" />
            </div>

            {activityPins.map((pin, index) => (
              <div
                key={pin.label}
                className="absolute flex items-center gap-1.5 rounded-full border border-[#17130E] bg-[#F8F4EA] py-1.5 pl-1.5 pr-3 text-[#17130E] shadow-[3px_3px_0_rgba(0,0,0,0.24)]"
                style={{ top: pin.top, left: pin.left, animationDelay: `${index * 140}ms` }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C6E76A]">
                  <Users className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase">{pin.label}</span>
              </div>
            ))}

            <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/12 bg-[#0B0D0C]/88 p-3 backdrop-blur-md">
              <p className="font-mono text-[10px] font-bold uppercase text-[#C6E76A]">{label}</p>
              <p className="mt-1 text-lg font-bold leading-tight text-white">{detail}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/5 rounded-full bg-[#C6E76A] [animation:sbLoadingBar_1.4s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          {!compact && (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-28 rounded-full bg-white/12 skeleton-wave" />
                  <div className="mt-2 h-5 w-44 rounded-full bg-white/12 skeleton-wave" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04]">
                  <MapPin className="h-4 w-4 text-[#C6E76A]" />
                </div>
              </div>

              {planRows.map((row) => (
                <div key={row.width} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3">
                  <div className="h-10 w-10 rounded-full bg-white/12 skeleton-wave" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className={cn('h-4 rounded-full bg-white/12 skeleton-wave', row.width)} />
                    <div className={cn('h-3 rounded-full bg-white/8 skeleton-wave', row.metaWidth)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
