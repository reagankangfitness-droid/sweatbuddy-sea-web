import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  fitnessDirectoryCategories,
  getDirectoryCategory,
  isDirectoryCategorySlug,
} from '@/lib/fitness-directory'

interface CategoryPageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{
    q?: string
    area?: string
    vibe?: string
    beginner?: string
    trust?: string
  }>
}

export function generateStaticParams() {
  return fitnessDirectoryCategories
    .filter((category) => category.slug !== 'fitness')
    .map((category) => ({ category: category.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params

  if (!isDirectoryCategorySlug(category) || category === 'fitness') {
    return { title: 'Singapore Fitness Guide' }
  }

  const directoryCategory = getDirectoryCategory(category)

  return {
    title: directoryCategory.title,
    description: directoryCategory.description,
    openGraph: {
      title: directoryCategory.title,
      description: directoryCategory.searchIntent,
      images: ['/images/cities/singapore.jpg'],
    },
  }
}

export default async function SingaporeCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params

  if (!isDirectoryCategorySlug(category) || category === 'fitness') {
    notFound()
  }

  const query = new URLSearchParams({ city: 'singapore' })
  const paramsValue = await searchParams
  if (paramsValue.q) query.set('q', paramsValue.q)

  redirect(`/communities?${query.toString()}`)
}
