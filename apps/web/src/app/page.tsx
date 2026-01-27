import dynamicImport from 'next/dynamic'

const MapHome = dynamicImport(
  () => import('@/components/im-down/MapHome').then((mod) => ({ default: mod.MapHome })),
  { ssr: false }
)

export default function Home() {
  return <MapHome />
}
