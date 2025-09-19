'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Category } from '@/lib/types'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Edit2, Trash2, MoreVertical, RefreshCw } from 'lucide-react'
import { DraggableBookmarkCard } from './DraggableBookmarkCard'
import { forceRefreshFavicon } from '@/lib/faviconCache'

interface CategorySectionProps {
  category: Category
}

export function CategorySection({ category }: CategorySectionProps) {
  const { getBookmarksByCategory, updateCategory, deleteCategory } = useBookmarkStore()
  const bookmarks = getBookmarksByCategory(category.id)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: category.id,
    data: {
      type: 'category',
    },
  })

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateCategory(category.id, { name: editName.trim() })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(category.name)
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteCategory(category.id)
    setIsDeleteDialogOpen(false)
  }

  const handleRefreshFavicons = async () => {
    setIsRefreshing(true)
    try {
      // 카테고리 내 모든 북마크의 favicon 강제 새로고침
      const refreshPromises = bookmarks.map(bookmark =>
        forceRefreshFavicon(bookmark.url)
      )

      await Promise.allSettled(refreshPromises)

      // 페이지 새로고침으로 UI 업데이트
      window.location.reload()
    } catch (error) {
      console.error('Favicon refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card
      ref={setNodeRef}
      className={`h-fit transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveEdit}>
                저장
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                취소
              </Button>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-lg">{category.name}</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshFavicons}
                  disabled={isRefreshing || bookmarks.length === 0}
                  title="Favicon 새로고침"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    이름 수정
                  </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      카테고리 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {bookmarks.length}개의 북마크
        </div>
      </CardHeader>

      <CardContent className="space-y-2 min-h-[100px]">
        <SortableContext
          items={bookmarks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {bookmarks.map((bookmark) => (
            <DraggableBookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </SortableContext>

        {bookmarks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>북마크가 없습니다</p>
            <p className="text-sm mt-1">새 북마크를 추가하거나 여기로 드래그하세요</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              &ldquo;{category.name}&rdquo; 카테고리를 삭제하시겠습니까?
            </p>
            <p className="text-sm text-muted-foreground">
              이 카테고리에 속한 모든 북마크({bookmarks.length}개)도 함께 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}