import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params

  if (slug === 'singapore') redirect('/singapore')
  if (slug === 'bangkok') redirect('/bangkok')

  redirect(`/singapore?tab=map&city=${encodeURIComponent(slug)}`)
}
