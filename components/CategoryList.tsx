'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Category } from '@/lib/types'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { CategorySection } from './CategorySection'
import { GripVertical } from 'lucide-react'

interface CategoryListProps {
  categories: Category[]
  gridCols: string
}

interface DraggableCategoryProps {
  category: Category
}

function DraggableCategory({ category }: DraggableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="카테고리 순서 변경"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* 카테고리 섹션 */}
      <div className="group">
        <CategorySection category={category} />
      </div>
    </div>
  )
}

export function CategoryList({ categories, gridCols }: CategoryListProps) {
  const sortedCategories = categories.sort((a, b) => a.order - b.order)

  return (
    <SortableContext
      items={sortedCategories.map(c => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className={`grid gap-6 ${gridCols}`}>
        {sortedCategories.map((category) => (
          <DraggableCategory key={category.id} category={category} />
        ))}
      </div>
    </SortableContext>
  )
}