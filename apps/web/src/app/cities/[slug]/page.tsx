import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params

  redirect(`/explore?city=${encodeURIComponent(slug)}`)
}
