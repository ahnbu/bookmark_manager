'use client'

import { useBookmarkStore } from '@/store/bookmarkStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function CategoryFilter() {
  const { categories, getVisibleCategories } = useBookmarkStore()
  const { selectedCategoryFilters, toggleCategoryFilter, clearCategoryFilters } = useSettingsStore()

  const visibleCategories = getVisibleCategories()

  if (visibleCategories.length === 0) {
    return null
  }

  const hasSelectedFilters = selectedCategoryFilters.length > 0

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {visibleCategories.map((category) => {
          const isSelected = selectedCategoryFilters.includes(category.id)
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategoryFilter(category.id)}
              className="h-8 text-sm"
            >
              {category.name}
            </Button>
          )
        })}
      </div>

      {hasSelectedFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCategoryFilters}
          className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          전체 보기
        </Button>
      )}
    </div>
  )
}