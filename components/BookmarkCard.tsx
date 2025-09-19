'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from '@/lib/types'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ExternalLink, Edit2, Trash2, MoreVertical, Globe } from 'lucide-react'
import { getFaviconFromCache, loadFaviconWithCache } from '@/lib/faviconCache'

interface BookmarkCardProps {
  bookmark: Bookmark
  onModalStateChange?: (isOpen: boolean) => void
}

export function BookmarkCard({ bookmark, onModalStateChange }: BookmarkCardProps) {
  const { updateBookmark, deleteBookmark, getBookmarkById } = useBookmarkStore()

  // 항상 최신 북마크 데이터 사용
  const currentBookmark = getBookmarkById(bookmark.id) || bookmark
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 모달 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    const isAnyModalOpen = isEditing || isDeleteDialogOpen
    onModalStateChange?.(isAnyModalOpen)
  }, [isEditing, isDeleteDialogOpen, onModalStateChange])
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(currentBookmark.favicon || null)
  const [editData, setEditData] = useState({
    name: currentBookmark.name,
    url: currentBookmark.url,
    description: currentBookmark.description || '',
  })

  // currentBookmark이 변경될 때마다 editData 업데이트
  useEffect(() => {
    setEditData({
      name: currentBookmark.name,
      url: currentBookmark.url,
      description: currentBookmark.description || '',
    })
  }, [currentBookmark.name, currentBookmark.url, currentBookmark.description])

  // 컴포넌트 마운트 시 캐시에서 favicon 확인 및 로딩
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const urlObj = new URL(currentBookmark.url)
        const domain = urlObj.hostname

        // 먼저 캐시에서 확인
        const cached = getFaviconFromCache(domain)
        if (cached) {
          setCurrentFavicon(cached)
          return
        }

        // 캐시에 없으면 로딩 시도
        const loadedFavicon = await loadFaviconWithCache(currentBookmark.url)
        if (loadedFavicon) {
          setCurrentFavicon(loadedFavicon)
        }
      } catch {
        // URL 파싱 실패하거나 로딩 실패 시 무시
      }
    }

    loadFavicon()
  }, [currentBookmark.url])

  const handleSaveEdit = async () => {
    if (editData.name.trim() && editData.url.trim()) {
      const urlChanged = editData.url.trim() !== currentBookmark.url

      updateBookmark(currentBookmark.id, {
        name: editData.name.trim(),
        url: editData.url.trim(),
        description: editData.description.trim() || undefined,
      })

      // URL이 변경된 경우 새로운 favicon 로딩
      if (urlChanged) {
        setCurrentFavicon(null) // 즉시 favicon 리셋
        try {
          const newFavicon = await loadFaviconWithCache(editData.url.trim())
          if (newFavicon) {
            setCurrentFavicon(newFavicon)
            // 북마크 데이터에도 favicon 업데이트
            updateBookmark(currentBookmark.id, { favicon: newFavicon })
          }
        } catch {
          // favicon 로딩 실패 시 무시
        }
      }

      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      name: currentBookmark.name,
      url: currentBookmark.url,
      description: currentBookmark.description || '',
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteBookmark(currentBookmark.id)
    setIsDeleteDialogOpen(false)
  }

  const handleOpenUrl = () => {

    // 편집 중인 경우 편집 중인 URL을, 아니면 원본 URL을 사용
    const urlToOpen = isEditing ? editData.url : currentBookmark.url

    window.open(urlToOpen, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Favicon */}
            <div className="w-4 h-4 mt-1 flex-shrink-0">
              {currentFavicon ? (
                <img
                  src={currentFavicon}
                  alt=""
                  className="w-full h-full"
                  onError={() => setCurrentFavicon(null)}
                />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0" onClick={handleOpenUrl}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-primary">
                    {currentBookmark.name}
                  </h4>
                  {currentBookmark.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {currentBookmark.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {currentBookmark.url}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* URL 수정해도 문제가 생겼던 과거 코드
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
                   */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
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
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setIsEditing(true)
                      }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsDeleteDialogOpen(true)
                        }}
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
              &ldquo;{currentBookmark.name}&rdquo; 북마크를 삭제하시겠습니까?
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