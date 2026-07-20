import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FitnessDirectoryPage } from '@/components/fitness-directory/FitnessDirectoryPage'
import {
  fitnessDirectoryCategories,
  getDirectoryCategory,
  isDirectoryCategorySlug,
  type FitnessDirectoryCategorySlug,
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
    return { title: 'Singapore Fitness Guide | SweatBuddies' }
  }

  const directoryCategory = getDirectoryCategory(category)

  return {
    title: `${directoryCategory.title} | SweatBuddies`,
    description: directoryCategory.description,
    openGraph: {
      title: `${directoryCategory.title} | SweatBuddies`,
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

  return (
    <FitnessDirectoryPage
      categorySlug={category as FitnessDirectoryCategorySlug}
      searchParams={await searchParams}
    />
  )
}
