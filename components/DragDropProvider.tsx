'use client'

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Bookmark, Category } from '@/lib/types'

interface DragDropProviderProps {
  children: React.ReactNode
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  const { moveBookmark, moveCategoryOrder, bookmarks, categories } = useBookmarkStore()
  const [activeBookmark, setActiveBookmark] = useState<Bookmark | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    if (active.data.current?.type === 'bookmark') {
      const bookmark = bookmarks.find(b => b.id === active.id)
      if (bookmark) {
        setActiveBookmark(bookmark)
      }
    } else if (active.data.current?.type === 'category') {
      const category = categories.find(c => c.id === active.id)
      if (category) {
        setActiveCategory(category)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveBookmark(null)
    setActiveCategory(null)

    if (!over) return

    // 카테고리 순서 변경
    if (active.data.current?.type === 'category' && over.data.current?.type === 'category') {
      const activeCategory = categories.find(c => c.id === active.id)
      const overCategory = categories.find(c => c.id === over.id)

      if (activeCategory && overCategory && activeCategory.id !== overCategory.id) {
        const sortedCategories = categories.sort((a, b) => a.order - b.order)
        const overIndex = sortedCategories.findIndex(c => c.id === overCategory.id)
        moveCategoryOrder(activeCategory.id, overIndex)
      }
      return
    }

    // 북마크 드래그 로직 (기존)
    const activeBookmark = bookmarks.find(b => b.id === active.id)
    if (!activeBookmark) return

    // 다른 카테고리로 이동하는 경우
    if (over.data.current?.type === 'category') {
      const targetCategoryId = over.id as string
      if (targetCategoryId !== activeBookmark.categoryId) {
        moveBookmark(activeBookmark.id, targetCategoryId)
      }
      return
    }

    // 같은 카테고리 내에서 순서 변경
    if (over.data.current?.type === 'bookmark') {
      const overBookmark = bookmarks.find(b => b.id === over.id)
      if (overBookmark && overBookmark.categoryId === activeBookmark.categoryId) {
        // 같은 카테고리 내에서 순서 변경 로직
        const categoryBookmarks = bookmarks
          .filter(b => b.categoryId === activeBookmark.categoryId)
          .sort((a, b) => a.order - b.order)

        const activeIndex = categoryBookmarks.findIndex(b => b.id === activeBookmark.id)
        const overIndex = categoryBookmarks.findIndex(b => b.id === overBookmark.id)

        if (activeIndex !== overIndex) {
          moveBookmark(activeBookmark.id, activeBookmark.categoryId, overIndex)
        }
      } else if (overBookmark) {
        // 다른 카테고리로 이동
        moveBookmark(activeBookmark.id, overBookmark.categoryId)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeBookmark ? (
          <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <span className="font-medium text-sm">{activeBookmark.name}</span>
            </div>
          </div>
        ) : activeCategory ? (
          <div className="bg-card border rounded-lg p-4 shadow-lg opacity-90 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{activeCategory.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}