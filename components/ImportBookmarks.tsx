'use client'

import { useState } from 'react'
import { useBookmarkStore } from '@/store/bookmarkStore'
import { BookmarkParser } from '@/lib/bookmarkParser'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Globe, FileText, AlertCircle } from 'lucide-react'

interface ImportBookmarksProps {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export function ImportBookmarks({ variant = 'outline', size = 'default' }: ImportBookmarksProps) {
  const { importBookmarks } = useBookmarkStore()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    if (!BookmarkParser.validateBookmarkFile(file)) {
      toast({
        title: '잘못된 파일 형식',
        description: 'HTML 형식의 북마크 파일만 지원됩니다.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const content = await BookmarkParser.readBookmarkFile(file)
      const importData = BookmarkParser.parseHtmlFile(content)
      const { categories, bookmarks } = BookmarkParser.convertToBookmarksAndCategories(importData)

      importBookmarks(bookmarks, categories)

      toast({
        title: '북마크 가져오기 완료',
        description: `${categories.length}개의 카테고리와 ${bookmarks.length}개의 북마크를 가져왔습니다.`,
      })

      setIsOpen(false)
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: '가져오기 실패',
        description: error instanceof Error ? error.message : '북마크 파일을 처리하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Globe className="h-4 w-4 mr-2" />
          북마크 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>북마크 파일 가져오기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>브라우저에서 내보낸 북마크 HTML 파일을 가져올 수 있습니다.</p>
            <div className="space-y-1">
              <p className="font-medium">지원 브라우저:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Chrome: 설정 → 북마크 → 북마크 내보내기</li>
                <li>• Firefox: 라이브러리 → 북마크 → 백업 및 복원 → HTML로 내보내기</li>
                <li>• Safari: 파일 → 북마크 내보내기</li>
                <li>• Edge: 설정 → 즐겨찾기 → 즐겨찾기 내보내기</li>
              </ul>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-2">
              파일을 여기에 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              HTML 파일만 지원됩니다
            </p>
            <Input
              type="file"
              accept=".html,.htm"
              onChange={handleFileInput}
              className="hidden"
              id="bookmark-file"
              disabled={isLoading}
            />
            <label htmlFor="bookmark-file">
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isLoading}
                asChild
              >
                <span>
                  {isLoading ? '처리 중...' : '파일 선택'}
                </span>
              </Button>
            </label>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              가져온 북마크는 기존 북마크에 추가됩니다. 중복된 북마크가 생성될 수 있습니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}