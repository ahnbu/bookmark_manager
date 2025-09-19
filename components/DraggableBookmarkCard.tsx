'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bookmark } from '@/lib/types'
import { BookmarkCard } from './BookmarkCard'

interface DraggableBookmarkCardProps {
  bookmark: Bookmark
}

export function DraggableBookmarkCard({ bookmark }: DraggableBookmarkCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: {
      type: 'bookmark',
      categoryId: bookmark.categoryId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <BookmarkCard
        bookmark={bookmark}
        onModalStateChange={setIsModalOpen}
        dragHandleProps={!isModalOpen ? listeners : {}}
        desktopDragProps={!isModalOpen ? listeners : {}}
      />
    </div>
  )
}