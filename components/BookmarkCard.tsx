'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from '@/lib/types'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ExternalLink, Edit2, Trash2, MoreVertical, Globe, RefreshCw, Upload, Copy, GripVertical, Heart, HeartOff, ChevronDown, EyeOff } from 'lucide-react'
import { getFaviconFromCache, loadFaviconWithCache } from '@/lib/faviconCache'

interface BookmarkCardProps {
  bookmark: Bookmark
  onModalStateChange?: (isOpen: boolean) => void
  dragHandleProps?: any
  desktopDragProps?: any
}

export function BookmarkCard({ bookmark, onModalStateChange, dragHandleProps, desktopDragProps }: BookmarkCardProps) {
  const { updateBookmark, deleteBookmark, getBookmarkById, addBookmark, getBookmarksByCategory, toggleFavorite, toggleBookmarkVisibility, categories, moveBookmark } = useBookmarkStore()
  const { settings } = useSettingsStore()

  // 항상 최신 북마크 데이터 사용
  const currentBookmark = getBookmarkById(bookmark.id) || bookmark
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

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
    isFavorite: currentBookmark.isFavorite || false,
    categoryId: currentBookmark.categoryId,
  })

  // currentBookmark이 변경될 때마다 editData 업데이트
  useEffect(() => {
    setEditData({
      name: currentBookmark.name,
      url: currentBookmark.url,
      description: currentBookmark.description || '',
      isFavorite: currentBookmark.isFavorite || false,
      categoryId: currentBookmark.categoryId,
    })
  }, [currentBookmark.name, currentBookmark.url, currentBookmark.description, currentBookmark.isFavorite, currentBookmark.categoryId])

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

  // Toast 메시지 표시 함수
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      setToastMessage('')
    }, 2000)
  }

  const handleSaveEdit = async () => {
    if (editData.name.trim() && editData.url.trim()) {
      const urlChanged = editData.url.trim() !== currentBookmark.url
      const categoryChanged = editData.categoryId !== currentBookmark.categoryId

      // 카테고리가 변경된 경우 moveBookmark 사용
      if (categoryChanged) {
        const targetCategoryBookmarks = getBookmarksByCategory(editData.categoryId)
        await moveBookmark(currentBookmark.id, editData.categoryId, targetCategoryBookmarks.length)
      }

      // 기본 정보 업데이트
      updateBookmark(currentBookmark.id, {
        name: editData.name.trim(),
        url: editData.url.trim(),
        description: editData.description.trim() || undefined,
        isFavorite: editData.isFavorite,
        // categoryId는 moveBookmark에서 처리하므로 카테고리 변경이 없을 때만 포함
        ...(categoryChanged ? {} : { categoryId: editData.categoryId }),
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
      isFavorite: currentBookmark.isFavorite || false,
      categoryId: currentBookmark.categoryId,
    })
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault()
      if (editData.name.trim() && editData.url.trim()) {
        handleSaveEdit()
      }
    }
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      if (editData.name.trim() && editData.url.trim()) {
        handleSaveEdit()
      }
    }
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
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

  // 북마크 복제
  const handleDuplicate = () => {
    const categoryBookmarks = getBookmarksByCategory(currentBookmark.categoryId)
    const currentBookmarkIndex = categoryBookmarks.findIndex(b => b.id === currentBookmark.id)
    const newOrder = currentBookmarkIndex + 1

    // 현재 북마크 이후의 모든 북마크들의 order를 1씩 증가
    categoryBookmarks.slice(newOrder).forEach(bookmark => {
      updateBookmark(bookmark.id, { order: bookmark.order + 1 })
    })

    // 새로운 북마크 생성
    const duplicatedBookmark = {
      name: `${currentBookmark.name} (복사본)`,
      url: currentBookmark.url,
      description: currentBookmark.description,
      categoryId: currentBookmark.categoryId,
      order: newOrder,
      favicon: currentBookmark.favicon,
      isBlacklisted: currentBookmark.isBlacklisted,
      customFavicon: currentBookmark.customFavicon,
    }

    addBookmark(duplicatedBookmark)
  }

  // 기본 파비콘으로 변경 (블랙리스트 등록)
  const handleSetDefaultFavicon = () => {
    updateBookmark(currentBookmark.id, {
      isBlacklisted: true,
      customFavicon: undefined
    })
  }

  // 커스텀 파비콘 업로드
  const handleCustomFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 제한 (1MB)
    if (file.size > 1024 * 1024) {
      alert('파일 크기는 1MB 이하여야 합니다.')
      return
    }

    // 이미지 파일 형식 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    setIsUploadingFavicon(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      updateBookmark(currentBookmark.id, {
        customFavicon: result,
        isBlacklisted: false
      })
      setIsUploadingFavicon(false)
    }
    reader.onerror = () => {
      alert('파일을 읽는 중 오류가 발생했습니다.')
      setIsUploadingFavicon(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      {/* Toast 메시지 */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transition-opacity">
          {toastMessage}
        </div>
      )}

      <Card className={`group hover:shadow-md transition-shadow cursor-pointer ${currentBookmark.isFavorite ? 'bg-favorite text-favorite-foreground' : ''}`}>
        <CardContent className="p-4 sm:p-3">
          <div className="flex items-start gap-3">
            {/* Drag Handle - Mobile only */}
            <div
              className="flex-shrink-0 sm:hidden opacity-50 active:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 -ml-2 -my-1"
              {...dragHandleProps}
              title="드래그하여 순서 변경"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Favicon */}
            <div className="w-4 h-4 mt-1 flex-shrink-0">
              {currentBookmark.isBlacklisted ? (
                <Globe className="w-4 h-4 text-muted-foreground" />
              ) : currentBookmark.customFavicon ? (
                <img
                  src={currentBookmark.customFavicon}
                  alt=""
                  className="w-full h-full"
                  onError={() => setCurrentFavicon(null)}
                />
              ) : currentFavicon ? (
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
            <div
              className={`flex-1 min-w-0 ${desktopDragProps ? 'sm:cursor-grab sm:active:cursor-grabbing sm:touch-none' : ''}`}
              onClick={handleOpenUrl}
              {...(desktopDragProps ? desktopDragProps : {})}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-base sm:text-sm truncate">
                    {currentBookmark.name}
                  </h4>
                  {currentBookmark.description && (settings.displayOptions?.showDescription ?? true) && (
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      currentBookmark.isFavorite
                        ? 'text-primary-subtle'
                        : 'text-muted-foreground'
                    }`}>
                      {currentBookmark.description}
                    </p>
                  )}
                  {(settings.displayOptions?.showUrl ?? true) && (
                    <p className={`text-xs mt-1 truncate ${
                      currentBookmark.isFavorite
                        ? 'text-primary-subtle'
                        : 'text-muted-foreground'
                    }`}>
                      {currentBookmark.url}
                    </p>
                  )}
                  {/* {(settings.displayOptions?.showUrl ?? true) && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {currentBookmark.url}
                    </p>
                  )} */}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity">
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
                    className="h-8 w-8 sm:h-6 sm:w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    title="북마크 수정"
                  >
                    <Edit2 className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 sm:h-6 sm:w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          // isFavorite의 새로운 상태를 미리 계산합니다.
                          const newIsFavorite = !currentBookmark.isFavorite
                          await toggleFavorite(currentBookmark.id)
                          
                          // 상태 변경 후 즉시 메시지 표시 (setTimeout 제거)
                          if (newIsFavorite) {

                          // await toggleFavorite(currentBookmark.id)
                          // // 상태 변경 후 메시지 표시
                          // setTimeout(() => {
                          //   const updatedBookmark = getBookmarkById(currentBookmark.id)
                          //   if (updatedBookmark?.isFavorite) {
                              showToastMessage('즐겨찾기가 등록되었습니다.')
                            } else {
                              showToastMessage('즐겨찾기가 해제되었습니다.')
                            }
                          // }, 100) // 상태 업데이트를 위한 짧은 지연
                        } catch (error) {
                          showToastMessage('즐겨찾기 변경에 실패했습니다.')
                        }
                      }}>
                        {currentBookmark.isFavorite ? (
                          <>
                            <HeartOff className="h-4 w-4 mr-2" />
                            즐겨찾기 해제
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 mr-2" />
                            즐겨찾기 등록
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate()
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        복제
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
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleSetDefaultFavicon()
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        파비콘 리셋
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        const fileInput = document.createElement('input')
                        fileInput.type = 'file'
                        fileInput.accept = 'image/*'
                        fileInput.onchange = (e) => handleCustomFaviconUpload(e as any)
                        fileInput.click()
                      }} disabled={isUploadingFavicon}>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploadingFavicon ? '업로드 중...' : '파비콘 등록'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await toggleBookmarkVisibility(currentBookmark.id)
                          showToastMessage('북마크가 숨겨졌습니다.')
                        } catch (error) {
                          showToastMessage('북마크 숨기기에 실패했습니다.')
                        }
                      }}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        숨기기
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
              <label className="text-sm font-medium">카테고리</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {categories.find(cat => cat.id === editData.categoryId)?.name || '카테고리 선택'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setEditData({ ...editData, categoryId: category.id })}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <label htmlFor="edit-name" className="text-sm font-medium">
                이름
              </label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="북마크 이름"
                autoFocus
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
                onKeyDown={handleKeyDown}
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
                onKeyDown={handleTextareaKeyDown}
                placeholder="북마크에 대한 설명을 입력하세요 (Ctrl+Enter로 저장)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-favorite"
                checked={editData.isFavorite}
                onCheckedChange={(checked) => setEditData({ ...editData, isFavorite: checked })}
              />
              <Label htmlFor="edit-favorite" className="text-sm font-medium">
                즐겨찾기
              </Label>
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