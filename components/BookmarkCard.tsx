'use client'

import { useState } from 'react'
import { Bookmark } from '@/lib/types'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ExternalLink, Edit2, Trash2, MoreVertical, Globe } from 'lucide-react'

interface BookmarkCardProps {
  bookmark: Bookmark
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const { updateBookmark, deleteBookmark } = useBookmarkStore()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    name: bookmark.name,
    url: bookmark.url,
    description: bookmark.description || '',
  })

  const handleSaveEdit = () => {
    if (editData.name.trim() && editData.url.trim()) {
      updateBookmark(bookmark.id, {
        name: editData.name.trim(),
        url: editData.url.trim(),
        description: editData.description.trim() || undefined,
      })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      name: bookmark.name,
      url: bookmark.url,
      description: bookmark.description || '',
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteBookmark(bookmark.id)
    setIsDeleteDialogOpen(false)
  }

  const handleOpenUrl = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Favicon */}
            <div className="w-4 h-4 mt-1 flex-shrink-0">
              {bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt=""
                  className="w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <Globe className={`w-4 h-4 text-muted-foreground ${bookmark.favicon ? 'hidden' : ''}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0" onClick={handleOpenUrl}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-primary">
                    {bookmark.name}
                  </h4>
                  {bookmark.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {bookmark.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {bookmark.url}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenUrl()
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>북마크 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="text-sm font-medium">
                이름
              </label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="북마크 이름"
              />
            </div>
            <div>
              <label htmlFor="edit-url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="edit-url"
                value={editData.url}
                onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="text-sm font-medium">
                설명 (선택사항)
              </label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="북마크에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                취소
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editData.name.trim() || !editData.url.trim()}
              >
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>북마크 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              &ldquo;{bookmark.name}&rdquo; 북마크를 삭제하시겠습니까?
            </p>
            <p className="text-sm text-muted-foreground">
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
    </>
  )
}