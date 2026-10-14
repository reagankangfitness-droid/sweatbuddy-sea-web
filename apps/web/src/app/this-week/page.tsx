import { redirect } from 'next/navigation'

export default async function ThisWeekRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const incoming = await searchParams
  const params = new URLSearchParams({ when: 'this-week' })
  for (const [key, value] of Object.entries(incoming)) {
    if (key === 'when' || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else params.set(key, value)
  }
  redirect(`/explore?${params.toString()}`)
}
