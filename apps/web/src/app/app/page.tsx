import dynamicImport from 'next/dynamic'

const WaveMap = dynamicImport(
  () => import('@/components/wave/WaveMap').then((mod) => ({ default: mod.WaveMap })),
  { ssr: false }
)

export default function AppPage() {
  return <WaveMap />
}
