import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ type?: string; cat?: string }>
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const { type, cat } = await searchParams
  const params = new URLSearchParams({ view: 'map' })
  const activity = type ?? cat

  if (activity) params.set('type', activity)

  redirect(`/buddy?${params.toString()}`)
}
