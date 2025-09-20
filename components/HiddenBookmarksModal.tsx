'use client'

import { useState } from 'react'
import { Bookmark } from '@/lib/types'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, Eye, ExternalLink } from 'lucide-react'
import { getFaviconFromCache } from '@/lib/faviconCache'

interface HiddenBookmarksModalProps {
  categoryId: string
  categoryName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function HiddenBookmarksModal({ categoryId, categoryName, isOpen, onOpenChange }: HiddenBookmarksModalProps) {
  const { getHiddenBookmarksByCategory, toggleBookmarkVisibility } = useBookmarkStore()
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const hiddenBookmarks = getHiddenBookmarksByCategory(categoryId)

  // Toast 메시지 표시 함수
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      setToastMessage('')
    }, 2000)
  }

  const handleUnhideBookmark = async (bookmarkId: string) => {
    try {
      await toggleBookmarkVisibility(bookmarkId)
      showToastMessage('북마크 숨기기가 해제되었습니다.')
    } catch (error) {
      showToastMessage('북마크 숨기기 해제에 실패했습니다.')
    }
  }

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* Toast 메시지 */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transition-opacity">
          {toastMessage}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>숨겨진 북마크 관리 - {categoryName}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3">
            {hiddenBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">숨겨진 북마크가 없습니다</h3>
                  <p className="text-muted-foreground text-sm">
                    이 카테고리에는 현재 숨겨진 북마크가 없습니다.
                  </p>
                </div>
              </div>
            ) : (
              hiddenBookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Favicon */}
                      <div className="w-4 h-4 mt-1 flex-shrink-0">
                        {bookmark.isBlacklisted ? (
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        ) : bookmark.customFavicon ? (
                          <img
                            src={bookmark.customFavicon}
                            alt=""
                            className="w-full h-full"
                          />
                        ) : bookmark.favicon ? (
                          <img
                            src={bookmark.favicon}
                            alt=""
                            className="w-full h-full"
                          />
                        ) : (
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
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
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenUrl(bookmark.url)}
                          title="새 탭에서 열기"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => handleUnhideBookmark(bookmark.id)}
                          title="숨기기 해제"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-xs">해제</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}