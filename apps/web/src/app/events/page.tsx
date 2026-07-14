import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ cat?: string; city?: string }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { cat, city } = await searchParams
  const params = new URLSearchParams({ view: 'map' })

  if (cat) params.set('type', cat)
  if (city) params.set('city', city)

  redirect(`/buddy?${params.toString()}`)
}
