'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_CATEGORIES,
  CATEGORY_GROUPS,
  getCategoriesByGroup,
  getFeaturedCategories,
  searchCategories,
  type ActivityCategory,
} from '@/lib/categories'

interface CategoryPickerProps {
  value?: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  showGroups?: boolean
  featuredOnly?: boolean
  placeholder?: string
  className?: string
}

export function CategoryPicker({
  value,
  onChange,
  multiple = false,
  showGroups = true,
  featuredOnly = false,
  placeholder = 'Select activity type',
  className,
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const categories = useMemo(() => {
    if (search) {
      return searchCategories(search)
    }
    if (featuredOnly) {
      return getFeaturedCategories()
    }
    return ACTIVITY_CATEGORIES
  }, [search, featuredOnly])

  const selectedCategories = useMemo(() => {
    if (!value) return []
    const values = Array.isArray(value) ? value : [value]
    return values
      .map((v) => ACTIVITY_CATEGORIES.find((c) => c.slug === v))
      .filter(Boolean) as ActivityCategory[]
  }, [value])

  const handleSelect = (category: ActivityCategory) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(category.slug)
        ? currentValues.filter((v) => v !== category.slug)
        : [...currentValues, category.slug]
      onChange(newValues)
    } else {
      onChange(category.slug)
      setIsOpen(false)
      setSearch('')
    }
  }

  const isSelected = (slug: string): boolean => {
    if (!value) return false
    return Array.isArray(value) ? value.includes(slug) : value === slug
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(multiple ? [] : '')
    setIsOpen(false)
  }

  return (
    <div className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'bg-white border rounded-xl text-left transition-all',
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-200 hover:border-neutral-300'
        )}
      >
        {selectedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedCategories.slice(0, 3).map((cat) => (
              <span
                key={cat.slug}
                className="inline-flex items-center gap-1 text-sm font-medium bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-md"
              >
                {cat.emoji} {cat.name}
              </span>
            ))}
            {selectedCategories.length > 3 && (
              <span className="text-sm text-neutral-500 px-2 py-1">
                +{selectedCategories.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-neutral-400 text-sm">{placeholder}</span>
        )}
        <div className="flex items-center gap-2">
          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-neutral-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              setSearch('')
            }}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none placeholder:text-neutral-400"
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="max-h-80 overflow-y-auto">
              {showGroups && !search ? (
                // Grouped view
                CATEGORY_GROUPS.map((group) => {
                  const groupCategories = getCategoriesByGroup(group.slug).filter(
                    (c) => !featuredOnly || c.featured
                  )

                  if (groupCategories.length === 0) return null

                  const isExpanded = expandedGroup === group.slug

                  return (
                    <div key={group.slug} className="border-b border-neutral-50 last:border-b-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGroup(isExpanded ? null : group.slug)
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                      >
                        <span className="text-lg">{group.emoji}</span>
                        <span className="flex-1 text-left font-medium text-sm text-neutral-800">
                          {group.name}
                        </span>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                          {groupCategories.length}
                        </span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-neutral-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>

                      {isExpanded && (
                        <div className="bg-neutral-50/50 py-1">
                          {groupCategories.map((category) => (
                            <button
                              key={category.slug}
                              type="button"
                              onClick={() => handleSelect(category)}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 pl-12 transition-colors',
                                isSelected(category.slug)
                                  ? 'bg-primary/10'
                                  : 'hover:bg-neutral-100'
                              )}
                            >
                              <span className="text-base">{category.emoji}</span>
                              <span className="flex-1 text-left text-sm text-neutral-700">
                                {category.name}
                              </span>
                              {isSelected(category.slug) && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                // Flat view (search results)
                categories.map((category) => {
                  const group = CATEGORY_GROUPS.find(
                    (g) => g.slug === category.groupSlug
                  )
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => handleSelect(category)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                        isSelected(category.slug)
                          ? 'bg-primary/10'
                          : 'hover:bg-neutral-50'
                      )}
                    >
                      <span className="text-lg">{category.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-neutral-800">
                          {category.name}
                        </div>
                        {group && (
                          <div className="text-xs text-neutral-400">
                            {group.name}
                          </div>
                        )}
                      </div>
                      {isSelected(category.slug) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  )
                })
              )}

              {categories.length === 0 && (
                <div className="py-8 text-center text-neutral-400 text-sm">
                  No activities found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
