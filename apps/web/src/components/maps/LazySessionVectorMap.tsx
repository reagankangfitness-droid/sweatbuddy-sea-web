'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { SessionVectorMap as SessionVectorMapComponent } from './SessionVectorMap'

type SessionVectorMapProps = ComponentProps<typeof SessionVectorMapComponent>

const DynamicSessionVectorMap = dynamic(
  () => import('./SessionVectorMap').then((module) => module.SessionVectorMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-2 overflow-hidden bg-[#161A18]">
        <Loader2 className="h-6 w-6 animate-spin text-white/45" />
        <p className="font-mono text-xs font-bold uppercase tracking-wide text-white/40">Loading map</p>
      </div>
    ),
  },
)

export type { SessionVectorMapPin } from './SessionVectorMap'

export function LazySessionVectorMap(props: SessionVectorMapProps) {
  return <DynamicSessionVectorMap {...props} />
}
